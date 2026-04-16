import { PrismaService } from "@/prisma/prisma.service";
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Room as PrismaRoom, RoomPlayer as PrismaRoomPlayer } from "@generated/prisma/client";
import * as bcrypt from "bcrypt";
import { CreateRoomDto } from "./dto/create-room.dto";
import { JoinRoomDto } from "./dto/join-room.dto";

export type RoomPlayer = {
  userId: number;
  joinedAt: string;
};

export type Room = {
  id: number;
  name: string;
  ownerUserId?: number;
  rounds: number;
  isPrivate: boolean;
  status: "waiting" | "playing" | "finished";
  players: RoomPlayer[];
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  passwordHash?: string;
};

type RoomWithPlayers = PrismaRoom & {
  players: PrismaRoomPlayer[];
};

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<Array<Omit<Room, "passwordHash">>> {
    const rooms = await this.prisma.client.room.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        players: {
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    return rooms.map((room) => this.stripPasswordHash(this.toRoom(room)));
  }

  async getById(roomId: number): Promise<Omit<Room, "passwordHash">> {
    const room = await this.findRoomOrThrow(roomId);
    return this.stripPasswordHash(this.toRoom(room));
  }

  async create(
    dto: CreateRoomDto & {
      ownerUserId?: number;
    },
  ): Promise<Omit<Room, "passwordHash">> {
    if (typeof dto.ownerUserId !== "number") {
      throw new UnauthorizedException("Authentication required to create a room");
    }

    const shouldStorePasswordHash =
      dto.isPrivate === true &&
      typeof dto.password === "string" &&
      dto.password.length > 0;
    const passwordHash = shouldStorePasswordHash
      ? await bcrypt.hash(dto.password as string, 10)
      : undefined;

    const room = await this.prisma.client.room.create({
      data: {
        name: dto.name,
        ownerId: dto.ownerUserId,
        rounds: dto.rounds,
        isPrivate: dto.isPrivate ?? false,
        status: "waiting",
        ...(passwordHash ? { passwordHash } : {}),
        players: {
          create: {
            userId: dto.ownerUserId,
          },
        },
      },
      include: {
        players: {
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    return this.stripPasswordHash(this.toRoom(room));
  }

  async join(
    roomId: number,
    userId: number,
    password?: JoinRoomDto["password"],
  ): Promise<Omit<Room, "passwordHash">> {
    const room = await this.findRoomOrThrow(roomId);

    if (room.status !== "waiting") {
      throw new ConflictException("Room is not joinable");
    }

    if (room.isPrivate) {
      if (!room.passwordHash || typeof password !== "string") {
        throw new UnauthorizedException("Invalid room password");
      }

      const isValidPassword = await bcrypt.compare(password, room.passwordHash);
      if (!isValidPassword) {
        throw new UnauthorizedException("Invalid room password");
      }
    }

    const isAlreadyMember = room.players.some((player) => player.userId === userId);
    const shouldSetOwner = room.ownerId === null;

    if (!isAlreadyMember || shouldSetOwner) {
      await this.prisma.client.$transaction(async (tx) => {
        if (!isAlreadyMember) {
          await tx.roomPlayer.create({
            data: {
              roomId,
              userId,
            },
          });
        }

        if (shouldSetOwner) {
          await tx.room.update({
            where: { id: roomId },
            data: { ownerId: userId },
          });
        }
      });
    }

    const updated = await this.findRoomOrThrow(roomId);
    return this.stripPasswordHash(this.toRoom(updated));
  }

  async leave(roomId: number, userId: number): Promise<Omit<Room, "passwordHash">> {
    const room = await this.findRoomOrThrow(roomId);
    const isMember = room.players.some((player) => player.userId === userId);
    if (!isMember) {
      throw new ConflictException("User is not in this room");
    }

    const updated = await this.prisma.client.$transaction(async (tx) => {
      await tx.roomPlayer.delete({
        where: {
          userId_roomId: {
            userId,
            roomId,
          },
        },
      });

      let nextRoom = await tx.room.findUnique({
        where: { id: roomId },
        include: {
          players: {
            orderBy: { joinedAt: "asc" },
          },
        },
      });
      if (!nextRoom) {
        throw new NotFoundException(`Room ${roomId} not found`);
      }

      if (nextRoom.players.length === 0 && nextRoom.ownerId !== null) {
        nextRoom = await tx.room.update({
          where: { id: roomId },
          data: { ownerId: null },
          include: {
            players: {
              orderBy: { joinedAt: "asc" },
            },
          },
        });
      } else if (
        nextRoom.players.length > 0 &&
        nextRoom.ownerId === userId
      ) {
        nextRoom = await tx.room.update({
          where: { id: roomId },
          data: { ownerId: nextRoom.players[0].userId },
          include: {
            players: {
              orderBy: { joinedAt: "asc" },
            },
          },
        });
      }

      return nextRoom;
    });

    return this.stripPasswordHash(this.toRoom(updated));
  }

  async start(
    roomId: number,
    requesterUserId: number,
  ): Promise<Omit<Room, "passwordHash">> {
    const room = await this.findRoomOrThrow(roomId);

    if (room.status !== "waiting") {
      throw new ConflictException("Room is not in waiting state");
    }

    if (!room.players.some((player) => player.userId === requesterUserId)) {
      throw new UnauthorizedException("User is not in this room");
    }

    if (typeof room.ownerId === "number" && room.ownerId !== requesterUserId) {
      throw new UnauthorizedException("Only room owner can start the game");
    }

    if (room.players.length < 1) {
      throw new ConflictException("Cannot start a room without players");
    }

    const updated = await this.prisma.client.room.update({
      where: { id: roomId },
      data: {
        status: "playing",
        startedAt: new Date(),
        finishedAt: null,
      },
      include: {
        players: {
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    return this.stripPasswordHash(this.toRoom(updated));
  }

  async finish(roomId: number): Promise<Omit<Room, "passwordHash">> {
    const room = await this.findRoomOrThrow(roomId);

    if (room.status !== "playing") {
      throw new ConflictException("Room is not in playing state");
    }

    const updated = await this.prisma.client.room.update({
      where: { id: roomId },
      data: {
        status: "finished",
        finishedAt: new Date(),
      },
      include: {
        players: {
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    return this.stripPasswordHash(this.toRoom(updated));
  }

  async close(roomId: number): Promise<{ roomId: number }> {
    const room = await this.findRoomOrThrow(roomId);
    if (room.status === "playing") {
      throw new ConflictException("Cannot close a room while game is playing");
    }

    await this.prisma.client.room.delete({
      where: { id: roomId },
    });

    return { roomId };
  }

  private async findRoomOrThrow(roomId: number): Promise<RoomWithPlayers> {
    const room = await this.prisma.client.room.findUnique({
      where: { id: roomId },
      include: {
        players: {
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }

    return room;
  }

  private toRoom(room: RoomWithPlayers): Room {
    return {
      id: room.id,
      name: room.name,
      ownerUserId: room.ownerId ?? undefined,
      rounds: room.rounds,
      isPrivate: room.isPrivate,
      status: room.status,
      players: room.players.map((player) => ({
        userId: player.userId,
        joinedAt: player.joinedAt.toISOString(),
      })),
      createdAt: room.createdAt.toISOString(),
      startedAt: room.startedAt ? room.startedAt.toISOString() : null,
      finishedAt: room.finishedAt ? room.finishedAt.toISOString() : null,
      ...(room.passwordHash ? { passwordHash: room.passwordHash } : {}),
    };
  }

  private stripPasswordHash(room: Room): Omit<Room, "passwordHash"> {
    const { passwordHash, ...publicRoom } = room;
    return publicRoom;
  }
}
