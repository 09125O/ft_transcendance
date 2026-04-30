import { PrismaService } from "@/prisma/prisma.service";
import { RealtimePresenceService } from "@/modules/realtime/services/realtime-presence.service";
import { FriendshipStatus, Prisma, UserStatus } from "@generated/prisma/client";
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";

type BasicUser = {
  id: number;
  username: string;
  avatar_url: string | null;
  status: UserStatus;
};

export type FriendListEntry = {
  userId: number;
  username: string;
  avatar_url: string | null;
  status: UserStatus;
  since: string;
};

export type FriendRequestEntry = {
  requestId: number;
  userId: number;
  username: string;
  avatar_url: string | null;
  status: UserStatus;
  createdAt: string;
};

export type FriendRequestLists = {
  received: FriendRequestEntry[];
  sent: FriendRequestEntry[];
};

export type FriendRequestCreated = {
  requestId: number;
  senderUserId: number;
  senderUsername: string;
  receiverUserId: number;
  status: FriendshipStatus;
  createdAt: string;
};

export type FriendRequestUpdated = {
  requestId: number;
  status: FriendshipStatus;
};

export type FriendRequestRecord = {
  id: number;
  senderId: number;
  receiverId: number;
  status: FriendshipStatus;
  senderUsername: string;
  receiverUsername: string;
};

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presence: RealtimePresenceService,
  ) {}

  async listFriends(userId: number): Promise<FriendListEntry[]> {
    const relations = await this.prisma.client.friendRequests.findMany({
      where: {
        status: "accepted",
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            status: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return relations.map((relation) => {
      const user = relation.senderId === userId ? relation.receiver : relation.sender;

      return {
        userId: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        status: this.getLiveStatus(user),
        since: relation.createdAt.toISOString(),
      };
    });
  }

  async listRequests(userId: number): Promise<FriendRequestLists> {
    const [received, sent] = await Promise.all([
      this.prisma.client.friendRequests.findMany({
        where: {
          receiverId: userId,
          status: "pending",
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.client.friendRequests.findMany({
        where: {
          senderId: userId,
          status: "pending",
        },
        include: {
          receiver: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      received: received.map((request) =>
        this.toRequestEntry(request.id, request.sender, request.createdAt),
      ),
      sent: sent.map((request) =>
        this.toRequestEntry(request.id, request.receiver, request.createdAt),
      ),
    };
  }

  async sendRequest(userId: number, receiverUserId: number): Promise<FriendRequestCreated> {
    if (userId === receiverUserId) {
      throw new ConflictException("Cannot send friend request to yourself");
    }

    const leftUserId = Math.min(userId, receiverUserId);
    const rightUserId = Math.max(userId, receiverUserId);

    return this.prisma.client.$transaction(async (tx) => {
      // Serialize friend-request creation for a pair to avoid concurrent duplicates.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${leftUserId}, ${rightUserId})`;

      const [sender, receiver] = await Promise.all([
        tx.user.findUnique({
          where: { id: userId },
          select: { id: true, username: true },
        }),
        tx.user.findUnique({
          where: { id: receiverUserId },
          select: { id: true },
        }),
      ]);

      if (!sender) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      if (!receiver) {
        throw new NotFoundException(`User ${receiverUserId} not found`);
      }

      const existing = await tx.friendRequests.findFirst({
        where: {
          OR: [
            {
              senderId: userId,
              receiverId: receiverUserId,
            },
            {
              senderId: receiverUserId,
              receiverId: userId,
            },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      if (existing) {
        if (existing.status === "accepted") {
          throw new ConflictException("Users are already friends");
        }
        if (existing.status === "pending") {
          throw new ConflictException("A friend request is already pending");
        }
      }

      const created = await tx.friendRequests.create({
        data: {
          senderId: userId,
          receiverId: receiverUserId,
          status: "pending",
          receiverReadAt: null,
        },
      });

      return {
        requestId: created.id,
        senderUserId: created.senderId,
        senderUsername: sender.username,
        receiverUserId: created.receiverId,
        status: created.status,
        createdAt: created.createdAt.toISOString(),
      };
    });
  }

  async acceptRequest(userId: number, requestId: number): Promise<FriendRequestUpdated> {
    const request = await this.findRequestOrThrow(requestId);

    if (request.receiverId !== userId) {
      throw new UnauthorizedException("Only the request receiver can accept this request");
    }
    if (request.status !== "pending") {
      throw new ConflictException("Friend request is not pending");
    }

    return this.updateRequestStatus(requestId, "accepted");
  }

  async declineRequest(userId: number, requestId: number): Promise<FriendRequestUpdated> {
    const request = await this.findRequestOrThrow(requestId);

    if (request.receiverId !== userId) {
      throw new UnauthorizedException("Only the request receiver can decline this request");
    }
    if (request.status !== "pending") {
      throw new ConflictException("Friend request is not pending");
    }

    return this.updateRequestStatus(requestId, "declined");
  }

  async removeFriend(userId: number, friendUserId: number): Promise<void> {
    const friendRelation = await this.prisma.client.friendRequests.findFirst({
      where: {
        status: "accepted",
        OR: [
          {
            senderId: userId,
            receiverId: friendUserId,
          },
          {
            senderId: friendUserId,
            receiverId: userId,
          },
        ],
      },
    });

    if (!friendRelation) {
      throw new NotFoundException("Friend relation not found");
    }

    await this.prisma.client.friendRequests.deleteMany({
      where: {
        status: "accepted",
        OR: [
          {
            senderId: userId,
            receiverId: friendUserId,
          },
          {
            senderId: friendUserId,
            receiverId: userId,
          },
        ],
      },
    });
  }

  async getRequestOrThrow(requestId: number): Promise<FriendRequestRecord> {
    const request = await this.findRequestOrThrow(requestId);

    return {
      id: request.id,
      senderId: request.senderId,
      receiverId: request.receiverId,
      status: request.status,
      senderUsername: request.sender.username,
      receiverUsername: request.receiver.username,
    };
  }

  private toRequestEntry(
    requestId: number,
    user: BasicUser,
    createdAt: Date,
  ): FriendRequestEntry {
    return {
      requestId,
      userId: user.id,
      username: user.username,
      avatar_url: user.avatar_url,
      status: this.getLiveStatus(user),
      createdAt: createdAt.toISOString(),
    };
  }

  private getLiveStatus(user: BasicUser): UserStatus {
    return this.presence.hasActiveSockets(user.id) ? "online" : "offline";
  }

  private async findRequestOrThrow(requestId: number) {
    const request = await this.prisma.client.friendRequests.findUnique({
      where: { id: requestId },
      include: {
        sender: {
          select: {
            username: true,
          },
        },
        receiver: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`Friend request ${requestId} not found`);
    }

    return request;
  }

  private async updateRequestStatus(
    requestId: number,
    status: FriendshipStatus,
  ): Promise<FriendRequestUpdated> {
    try {
      const updated = await this.prisma.client.friendRequests.update({
        where: { id: requestId },
        data: { status },
      });

      return {
        requestId: updated.id,
        status: updated.status,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException(`Friend request ${requestId} not found`);
      }

      throw error;
    }
  }
}
