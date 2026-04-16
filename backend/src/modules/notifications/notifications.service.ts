import { PrismaService } from "@/prisma/prisma.service";
import { Injectable, NotFoundException } from "@nestjs/common";

export type NotificationItem = {
  id: number;
  type: "FRIEND_REQUEST_RECEIVED";
  title: string;
  payload: {
    requestId: number;
    fromUserId: number;
    fromUsername: string;
  };
  read: boolean;
  createdAt: string;
};

export type NotificationList = {
  items: NotificationItem[];
  nextCursor: string | null;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: number, limit = 20, cursor?: string): Promise<NotificationList> {
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 50) : 20;

    const requests = await this.prisma.client.friendRequests.findMany({
      where: {
        receiverId: userId,
        status: "pending",
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
      ...(cursor ? { cursor: { id: Number(cursor) }, skip: 1 } : {}),
      take: safeLimit + 1,
    });

    const hasNext = requests.length > safeLimit;
    const pageItems = (hasNext ? requests.slice(0, safeLimit) : requests).map((request) =>
      this.toNotification(
        request.id,
        request.sender.id,
        request.sender.username,
        request.createdAt,
        request.receiverReadAt,
      ),
    );

    return {
      items: pageItems,
      nextCursor: hasNext ? String(pageItems[pageItems.length - 1].id) : null,
    };
  }

  async markRead(userId: number, notificationId: number): Promise<{ read: true }> {
    await this.ensureNotificationExists(userId, notificationId);
    await this.prisma.client.friendRequests.update({
      where: { id: notificationId },
      data: {
        receiverReadAt: new Date(),
      },
    });
    return { read: true };
  }

  async markAllRead(userId: number): Promise<{ readAll: true }> {
    await this.prisma.client.friendRequests.updateMany({
      where: {
        receiverId: userId,
        status: "pending",
        receiverReadAt: null,
      },
      data: {
        receiverReadAt: new Date(),
      },
    });
    return { readAll: true };
  }

  private async ensureNotificationExists(userId: number, notificationId: number): Promise<void> {
    const request = await this.prisma.client.friendRequests.findFirst({
      where: {
        id: notificationId,
        receiverId: userId,
        status: "pending",
      },
      select: { id: true },
    });

    if (!request) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }
  }

  private toNotification(
    requestId: number,
    fromUserId: number,
    fromUsername: string,
    createdAt: Date,
    receiverReadAt: Date | null,
  ): NotificationItem {
    return {
      id: requestId,
      type: "FRIEND_REQUEST_RECEIVED",
      title: "Nouvelle demande d'ami",
      payload: {
        requestId,
        fromUserId,
        fromUsername,
      },
      read: receiverReadAt !== null,
      createdAt: createdAt.toISOString(),
    };
  }
}
