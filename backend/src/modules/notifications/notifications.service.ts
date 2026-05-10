import { PrismaService } from "@/prisma/prisma.service";
import { Prisma } from "@generated/prisma/client";
import { Injectable, NotFoundException } from "@nestjs/common";

export type NotificationItem = {
  id: number;
  type:
    | "FRIEND_REQUEST_RECEIVED"
    | "FRIEND_REQUEST_ACCEPTED"
    | "FRIEND_REQUEST_DECLINED"
    | "FRIEND_REMOVED";
  title: string;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
  dismissible: true;
};

export type NotificationList = {
  items: NotificationItem[];
  nextCursor: string | null;
};

export type CreateNotificationInput = {
  userId: number;
  type: Exclude<NotificationItem["type"], "FRIEND_REQUEST_RECEIVED">;
  title: string;
  payload: Record<string, unknown>;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: number, limit = 20, cursor?: string): Promise<NotificationList> {
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 50) : 20;

    const [requests, notifications] = await Promise.all([
      this.prisma.client.friendRequests.findMany({
        where: {
          receiverId: userId,
          status: "pending",
          receiverDeletedAt: null,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.client.notification.findMany({
        where: {
          userId,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const mergedItems = [
      ...requests.map((request) => this.toFriendRequestNotification(request)),
      ...notifications.map((notification) => this.toStoredNotification(notification)),
    ].sort((left, right) => {
      const timestampDelta =
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      if (timestampDelta !== 0) {
        return timestampDelta;
      }

      return Math.abs(right.id) - Math.abs(left.id);
    });

    const startIndex =
      typeof cursor === "string" && cursor.length > 0
        ? Math.max(
            0,
            mergedItems.findIndex((item) => String(item.id) === cursor) + 1,
          )
        : 0;
    const pageItems = mergedItems.slice(startIndex, startIndex + safeLimit);
    const hasNext = startIndex + safeLimit < mergedItems.length;

    return {
      items: pageItems,
      nextCursor: hasNext ? String(pageItems[pageItems.length - 1].id) : null,
    };
  }

  async markRead(userId: number, notificationId: number): Promise<{ read: true }> {
    if (notificationId < 0) {
      const storedNotificationId = this.toStoredNotificationId(notificationId);
      await this.ensureStoredNotificationExists(userId, storedNotificationId);
      await this.prisma.client.notification.update({
        where: { id: storedNotificationId },
        data: {
          readAt: new Date(),
        },
      });
      return { read: true };
    }

    await this.ensureFriendRequestNotificationExists(userId, notificationId);
    await this.prisma.client.friendRequests.update({
      where: { id: notificationId },
      data: {
        receiverReadAt: new Date(),
      },
    });
    return { read: true };
  }

  async markAllRead(userId: number): Promise<{ readAll: true }> {
    const readAt = new Date();
    await Promise.all([
      this.prisma.client.friendRequests.updateMany({
        where: {
          receiverId: userId,
          status: "pending",
          receiverReadAt: null,
          receiverDeletedAt: null,
        },
        data: {
          receiverReadAt: readAt,
        },
      }),
      this.prisma.client.notification.updateMany({
        where: {
          userId,
          readAt: null,
        },
        data: {
          readAt,
        },
      }),
    ]);
    return { readAll: true };
  }

  async remove(userId: number, notificationId: number): Promise<{ removed: true }> {
    if (notificationId < 0) {
      const removed = await this.prisma.client.notification.deleteMany({
        where: {
          id: this.toStoredNotificationId(notificationId),
          userId,
        },
      });

      if (removed.count === 0) {
        throw new NotFoundException(`Notification ${notificationId} introuvable`);
      }

      return { removed: true };
    }

    await this.ensureFriendRequestNotificationExists(userId, notificationId);
    await this.prisma.client.friendRequests.update({
      where: { id: notificationId },
      data: {
        receiverDeletedAt: new Date(),
      },
    });
    return { removed: true };
  }

  async createNotification(input: CreateNotificationInput): Promise<NotificationItem> {
    const created = await this.prisma.client.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        payload: input.payload as Prisma.InputJsonValue,
      },
    });

    return this.toStoredNotification(created);
  }

  private async ensureFriendRequestNotificationExists(
    userId: number,
    notificationId: number,
  ): Promise<void> {
    const request = await this.prisma.client.friendRequests.findFirst({
      where: {
        id: notificationId,
        receiverId: userId,
        status: "pending",
        receiverDeletedAt: null,
      },
      select: { id: true },
    });

    if (!request) {
      throw new NotFoundException(`Notification ${notificationId} introuvable`);
    }
  }

  private async ensureStoredNotificationExists(
    userId: number,
    notificationId: number,
  ): Promise<void> {
    const notification = await this.prisma.client.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
      select: { id: true },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} introuvable`);
    }
  }

  private toFriendRequestNotification(request: {
    id: number;
    sender: { id: number; username: string };
    receiverReadAt: Date | null;
    createdAt: Date;
  }): NotificationItem {
    return {
      id: request.id,
      type: "FRIEND_REQUEST_RECEIVED",
      title: "Nouvelle demande d'ami",
      payload: {
        requestId: request.id,
        fromUserId: request.sender.id,
        fromUsername: request.sender.username,
      },
      read: request.receiverReadAt !== null,
      createdAt: request.createdAt.toISOString(),
      dismissible: true,
    };
  }

  private toStoredNotification(notification: {
    id: number;
    type: CreateNotificationInput["type"];
    title: string;
    payload: Prisma.JsonValue;
    readAt: Date | null;
    createdAt: Date;
  }): NotificationItem {
    return {
      id: -notification.id,
      type: notification.type,
      title: notification.title,
      payload: this.toPayloadObject(notification.payload),
      read: notification.readAt !== null,
      createdAt: notification.createdAt.toISOString(),
      dismissible: true,
    };
  }

  private toPayloadObject(payload: Prisma.JsonValue): Record<string, unknown> {
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      return payload as Record<string, unknown>;
    }

    return {};
  }

  private toStoredNotificationId(notificationId: number): number {
    return Math.abs(notificationId);
  }
}
