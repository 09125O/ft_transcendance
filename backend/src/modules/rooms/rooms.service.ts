import { PrismaService } from "@/prisma/prisma.service";
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  Prisma,
  Room as PrismaRoom,
  RoomPlayer as PrismaRoomPlayer,
} from "@generated/prisma/client";
import * as bcrypt from "bcrypt";
import { CreateRoomDto } from "./dto/create-room.dto";
import { JoinRoomDto } from "./dto/join-room.dto";

const MIN_PLAYERS_TO_START = 3;
const MIN_PLAYERS_TO_START_WITH_QUIZ = 1;
const DEFAULT_ROOM_QUESTION_DURATION_MS = Number(
  process.env.GAME_QUESTION_DURATION_MS || 10000,
);

export type RoomPlayer = {
  userId: number;
  joinedAt: string;
};

export type Room = {
  id: number;
  name: string;
  ownerUserId?: number;
  quizId?: number;
  rounds: number;
  questionDurationMs: number;
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
    return this.findRooms({
      players: {
        some: {},
      },
    });
  }

  async listVisible(): Promise<Array<Omit<Room, "passwordHash">>> {
    return this.findRooms({
      players: {
        some: {},
      },
      status: {
        in: ["waiting", "playing"],
      },
    });
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
      throw new UnauthorizedException("Authentification requise pour créer une room");
    }

    const shouldStorePasswordHash =
      dto.isPrivate === true &&
      typeof dto.password === "string" &&
      dto.password.length > 0;
    const questionDurationMs =
      typeof dto.questionDurationMs === "number"
        ? dto.questionDurationMs
        : DEFAULT_ROOM_QUESTION_DURATION_MS;
    const passwordHash = shouldStorePasswordHash
      ? await bcrypt.hash(dto.password as string, 10)
      : undefined;
    let rounds = dto.rounds;

    if (typeof dto.quizId === "number") {
      const quiz = await this.prisma.client.quiz.findUnique({
        where: { id: dto.quizId },
        include: {
          questions: true,
        },
      });
      if (!quiz) {
        throw new NotFoundException(`Quiz ${dto.quizId} introuvable`);
      }
      if (quiz.questions.length < 1) {
        throw new ConflictException("Impossible de créer une room avec un quiz vide");
      }
      rounds = Math.min(dto.rounds, quiz.questions.length);
    }

    const room = await this.prisma.client.room.create({
      data: {
        name: dto.name,
        ownerId: dto.ownerUserId,
        quizId: dto.quizId,
        rounds,
        questionDurationMs,
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

    if (room.status === "finished") {
      throw new ConflictException("Cette room ne peut pas être rejointe");
    }

    if (room.isPrivate) {
      await this.assertPrivateRoomFriendAccess(room, userId);

      if (!room.passwordHash || typeof password !== "string") {
        throw new UnauthorizedException("Mot de passe de room invalide");
      }

      const isValidPassword = await bcrypt.compare(password, room.passwordHash);
      if (!isValidPassword) {
        throw new UnauthorizedException("Mot de passe de room invalide");
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

  private async assertPrivateRoomFriendAccess(
    room: RoomWithPlayers,
    userId: number,
  ): Promise<void> {
    if (!room.isPrivate || room.ownerId === userId) {
      return;
    }

    if (typeof room.ownerId !== "number") {
      throw new UnauthorizedException("Cette room privée ne peut pas être rejointe");
    }

    const friendship = await this.prisma.client.friendRequests.findFirst({
      where: {
        status: "accepted",
        OR: [
          {
            senderId: room.ownerId,
            receiverId: userId,
          },
          {
            senderId: userId,
            receiverId: room.ownerId,
          },
        ],
      },
      select: { id: true },
    });

    if (!friendship) {
      throw new UnauthorizedException("Cette room privée est réservée aux amis de l'hôte");
    }
  }

  async leave(roomId: number, userId: number): Promise<Omit<Room, "passwordHash">> {
    const room = await this.findRoomOrThrow(roomId);
    const isMember = room.players.some((player) => player.userId === userId);
    if (!isMember) {
      throw new ConflictException("L'utilisateur n'est pas dans cette room");
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
        throw new NotFoundException(`Room ${roomId} introuvable`);
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
      throw new ConflictException("La room n'est pas en attente");
    }

    if (!room.players.some((player) => player.userId === requesterUserId)) {
      throw new UnauthorizedException("L'utilisateur n'est pas dans cette room");
    }

    if (typeof room.ownerId === "number" && room.ownerId !== requesterUserId) {
      throw new UnauthorizedException("Seul le propriétaire de la room peut lancer la partie");
    }

    const minimumPlayers =
      typeof room.quizId === "number"
        ? MIN_PLAYERS_TO_START_WITH_QUIZ
        : MIN_PLAYERS_TO_START;

    if (room.players.length < minimumPlayers) {
      throw new ConflictException(
        `Impossible de lancer une room avec moins de ${minimumPlayers} joueur${minimumPlayers > 1 ? "s" : ""}`,
      );
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
      throw new ConflictException("La room n'est pas en cours de partie");
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
      throw new ConflictException("Impossible de fermer une room pendant une partie");
    }

    const persistedGamesCount = await this.prisma.client.game.count({
      where: { roomId },
    });

    await this.prisma.client.$transaction(async (tx) => {
      await tx.messages.deleteMany({
        where: { roomId },
      });
      await tx.roomPlayer.deleteMany({
        where: { roomId },
      });

      if (persistedGamesCount === 0) {
        await tx.room.delete({
          where: { id: roomId },
        });
        return;
      }

      await tx.room.update({
        where: { id: roomId },
        data: {
          ownerId: null,
          status: "finished",
          isPrivate: false,
          passwordHash: null,
          finishedAt: room.finishedAt ? new Date(room.finishedAt) : new Date(),
        },
      });
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
      throw new NotFoundException(`Room ${roomId} introuvable`);
    }

    return room;
  }

  private async findRooms(
    where: Prisma.RoomWhereInput,
  ): Promise<Array<Omit<Room, "passwordHash">>> {
    const rooms = await this.prisma.client.room.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        players: {
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    return rooms.map((room) => this.stripPasswordHash(this.toRoom(room)));
  }

  private toRoom(room: RoomWithPlayers): Room {
    return {
      id: room.id,
      name: room.name,
      ownerUserId: room.ownerId ?? undefined,
      quizId: room.quizId ?? undefined,
      rounds: room.rounds,
      questionDurationMs: room.questionDurationMs,
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
    const { passwordHash: _passwordHash, ...publicRoom } = room;
    return publicRoom;
  }
}
