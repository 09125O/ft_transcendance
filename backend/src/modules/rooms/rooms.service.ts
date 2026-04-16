import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import {
  getRuntimeFilePath,
  readRuntimeJson,
  writeRuntimeJson,
} from "@/common/runtime/runtime-store";
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

type RoomsStore = {
  nextRoomId: number;
  rooms: Room[];
};

@Injectable()
export class RoomsService {
  private readonly storePath = getRuntimeFilePath("rooms-store.json");
  private nextRoomId = 1;

  private readonly rooms: Room[] = [];

  constructor() {
    this.loadStore();
  }

  list(): Array<Omit<Room, "passwordHash">> {
    return this.rooms.map((room) => this.stripPasswordHash(room));
  }

  getById(roomId: number): Omit<Room, "passwordHash"> {
    const room = this.findRoomOrThrow(roomId);
    return this.stripPasswordHash(room);
  }

  async create(
    dto: CreateRoomDto & {
      ownerUserId?: number;
    },
  ): Promise<Omit<Room, "passwordHash">> {
    const createdAt = new Date().toISOString();
    const shouldStorePasswordHash =
      dto.isPrivate === true && typeof dto.password === "string" && dto.password.length > 0;
    const privateRoomPassword = shouldStorePasswordHash ? dto.password : undefined;
    const room: Room = {
      id: this.nextRoomId,
      name: dto.name,
      ownerUserId: dto.ownerUserId,
      rounds: dto.rounds,
      isPrivate: dto.isPrivate ?? false,
      status: "waiting",
      players:
        typeof dto.ownerUserId === "number"
          ? [{ userId: dto.ownerUserId, joinedAt: createdAt }]
          : [],
      createdAt,
      startedAt: null,
      finishedAt: null,
      ...(privateRoomPassword
        ? { passwordHash: await bcrypt.hash(privateRoomPassword, 10) }
        : {}),
    };

    this.nextRoomId += 1;
    this.rooms.unshift(room);
    this.persistStore();
    return this.stripPasswordHash(room);
  }

  async join(
    roomId: number,
    userId: number,
    password?: JoinRoomDto["password"],
  ): Promise<Omit<Room, "passwordHash">> {
    const room = this.findRoomOrThrow(roomId);

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

    if (!room.players.some((player) => player.userId === userId)) {
      room.players.push({
        userId,
        joinedAt: new Date().toISOString(),
      });
    }

    if (typeof room.ownerUserId !== "number") {
      room.ownerUserId = userId;
    }

    this.persistStore();
    return this.stripPasswordHash(room);
  }

  leave(roomId: number, userId: number): Omit<Room, "passwordHash"> {
    const room = this.findRoomOrThrow(roomId);
    const existingPlayer = room.players.find((player) => player.userId === userId);

    if (!existingPlayer) {
      throw new ConflictException("User is not in this room");
    }

    room.players = room.players.filter((player) => player.userId !== userId);

    if (room.players.length === 0) {
      room.ownerUserId = undefined;
      this.persistStore();
      return this.stripPasswordHash(room);
    }

    if (room.ownerUserId === userId) {
      room.ownerUserId = room.players[0]?.userId;
    }

    this.persistStore();
    return this.stripPasswordHash(room);
  }

  start(roomId: number, requesterUserId: number): Omit<Room, "passwordHash"> {
    const room = this.findRoomOrThrow(roomId);

    if (room.status !== "waiting") {
      throw new ConflictException("Room is not in waiting state");
    }

    if (!room.players.some((player) => player.userId === requesterUserId)) {
      throw new UnauthorizedException("User is not in this room");
    }

    if (
      typeof room.ownerUserId === "number" &&
      room.ownerUserId !== requesterUserId
    ) {
      throw new UnauthorizedException("Only room owner can start the game");
    }

    if (room.players.length < 1) {
      throw new ConflictException("Cannot start a room without players");
    }

    room.status = "playing";
    room.startedAt = new Date().toISOString();
    room.finishedAt = null;

    this.persistStore();
    return this.stripPasswordHash(room);
  }

  finish(roomId: number): Omit<Room, "passwordHash"> {
    const room = this.findRoomOrThrow(roomId);

    if (room.status !== "playing") {
      throw new ConflictException("Room is not in playing state");
    }

    room.status = "finished";
    room.finishedAt = new Date().toISOString();

    this.persistStore();
    return this.stripPasswordHash(room);
  }

  close(roomId: number): { roomId: number } {
    const index = this.rooms.findIndex((room) => room.id === roomId);
    if (index === -1) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }

    const room = this.rooms[index];
    if (room.status === "playing") {
      throw new ConflictException("Cannot close a room while game is playing");
    }

    this.rooms.splice(index, 1);
    this.persistStore();

    return { roomId };
  }

  private loadStore(): void {
    const fallback: RoomsStore = {
      nextRoomId: 1,
      rooms: [],
    };
    const snapshot = readRuntimeJson<RoomsStore>(this.storePath, fallback);
    if (!Array.isArray(snapshot.rooms)) {
      return;
    }

    const normalizedRooms = snapshot.rooms.map((room) => {
      const storedRoom = room as Room & { password?: string };
      const migratedPasswordHash =
        typeof storedRoom.passwordHash === "string"
          ? storedRoom.passwordHash
          : typeof storedRoom.password === "string" && storedRoom.password.length > 0
            ? bcrypt.hashSync(storedRoom.password, 10)
            : undefined;

      return {
        id: storedRoom.id,
        name: storedRoom.name,
        ownerUserId: storedRoom.ownerUserId,
        rounds: storedRoom.rounds,
        isPrivate: storedRoom.isPrivate,
        status: storedRoom.status,
        players: storedRoom.players,
        createdAt: storedRoom.createdAt,
        startedAt: storedRoom.startedAt,
        finishedAt: storedRoom.finishedAt,
        ...(migratedPasswordHash ? { passwordHash: migratedPasswordHash } : {}),
      } satisfies Room;
    });

    this.rooms.splice(0, this.rooms.length, ...normalizedRooms);
    const maxRoomId = this.rooms.reduce(
      (max, room) => (room.id > max ? room.id : max),
      0,
    );
    this.nextRoomId = Math.max(snapshot.nextRoomId || 1, maxRoomId + 1);
  }

  private persistStore(): void {
    writeRuntimeJson<RoomsStore>(this.storePath, {
      nextRoomId: this.nextRoomId,
      rooms: this.rooms,
    });
  }

  private stripPasswordHash(room: Room): Omit<Room, "passwordHash"> {
    const { passwordHash, ...publicRoom } = room;
    return publicRoom;
  }

  private findRoomOrThrow(roomId: number): Room {
    const room = this.rooms.find((item) => item.id === roomId);
    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }

    return room;
  }
}
