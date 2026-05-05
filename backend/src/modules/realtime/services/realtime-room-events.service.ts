import { RoomsService } from "@/modules/rooms/rooms.service";
import { UsersService } from "@/modules/users/users.service";
import { ChatMessageDto } from "@/modules/realtime/dto/chat-message.dto";
import { RoomCreateEventDto } from "@/modules/realtime/dto/room-create-event.dto";
import { RoomJoinEventDto } from "@/modules/realtime/dto/room-join-event.dto";
import { RoomLeaveDto } from "@/modules/realtime/dto/room-leave.dto";
import { RoomSpectateDto } from "@/modules/realtime/dto/room-spectate.dto";
import { RoomStartDto } from "@/modules/realtime/dto/room-start.dto";
import { GameService } from "@/modules/game/game.service";
import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { RealtimeGameRuntimeService } from "./realtime-game-runtime.service";
import { RealtimePresenceService } from "./realtime-presence.service";
import { RealtimeResponseService } from "./realtime-response.service";
import { RealtimeValidationService } from "./realtime-validation.service";

@Injectable()
export class RealtimeRoomEventsService {
  private readonly logger = new Logger(RealtimeRoomEventsService.name);
  private readonly disconnectGraceMs = Number(
    process.env.ROOM_RECONNECT_GRACE_MS || 10000,
  );
  private readonly waitingRoomTtlMs = Number(
    process.env.ROOM_WAITING_TTL_MS || 1800000,
  );
  private readonly finishedRoomTtlMs = Number(
    process.env.ROOM_FINISHED_TTL_MS || 300000,
  );
  private readonly pendingDisconnects = new Map<number, NodeJS.Timeout>();
  private roomCleanupInProgress = false;

  constructor(
    private readonly roomsService: RoomsService,
    private readonly gameService: GameService,
    private readonly usersService: UsersService,
    private readonly validation: RealtimeValidationService,
    private readonly response: RealtimeResponseService,
    private readonly presence: RealtimePresenceService,
    private readonly gameRuntime: RealtimeGameRuntimeService,
  ) {}

  async handleDisconnect(clientId: string, server: Server): Promise<void> {
    const spectatingRooms = this.presence.getSpectatingRooms(clientId);
    const userId = this.presence.unregisterSocket(clientId);
    if (typeof userId === "number" && !this.presence.hasActiveSockets(userId)) {
      this.scheduleUserRemoval(userId, server);
    }

    for (const roomId of spectatingRooms) {
      this.emitSpectatorCount(roomId, server);
    }
  }

  handleReconnect(userId: number): void {
    this.cancelPendingDisconnect(userId);
  }

  clearPendingDisconnects(): void {
    for (const timeout of this.pendingDisconnects.values()) {
      clearTimeout(timeout);
    }
    this.pendingDisconnects.clear();
  }

  async cleanupExpiredRooms(server: Server): Promise<void> {
    if (this.roomCleanupInProgress) {
      return;
    }

    this.roomCleanupInProgress = true;

    try {
      const nowMs = Date.now();

      for (const room of await this.roomsService.list()) {
        let reason: string | null = null;

        if (room.status === "waiting") {
          if (this.hasExpired(room.createdAt, this.waitingRoomTtlMs, nowMs)) {
            reason = "room_waiting_ttl_expired";
          }
        } else if (room.status === "finished") {
          const referenceTime = room.finishedAt ?? room.createdAt;
          if (this.hasExpired(referenceTime, this.finishedRoomTtlMs, nowMs)) {
            reason = "room_finished_ttl_expired";
          }
        }

        if (!reason) {
          continue;
        }

        try {
          await this.gameRuntime.closeRoom(room.id, reason, server);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown cleanup error";
          this.logger.warn(`Failed to auto-close room ${room.id}: ${message}`);
        }
      }
    } finally {
      this.roomCleanupInProgress = false;
    }
  }

  async handleRoomList(client: Socket): Promise<void> {
    client.emit("room:list", this.response.ok(await this.roomsService.listVisible()));
  }

  async handleRoomCreate(
    rawPayload: unknown,
    client: Socket,
    server: Server,
  ): Promise<void> {
    const payload = this.validation.validatePayload(RoomCreateEventDto, rawPayload);
    const requesterUserId = this.presence.resolveSocketUser(client.id, payload.userId);
    const room = await this.roomsService.create({
      name: payload.name,
      rounds: payload.rounds,
      questionDurationMs: payload.questionDurationMs,
      isPrivate: payload.isPrivate,
      password: payload.password,
      quizId: payload.quizId,
      ownerUserId: requesterUserId,
    });

    client.join(this.roomChannel(room.id));
    this.presence.unmarkSpectator(client.id, room.id);
    client.emit("room:created", this.response.ok(room));
    server.to(this.roomChannel(room.id)).emit("room:state", this.response.ok(room));
    this.broadcastRoomList(server);
  }

  async handleRoomJoin(
    rawPayload: unknown,
    client: Socket,
    server: Server,
  ): Promise<void> {
    const payload = this.validation.validatePayload(RoomJoinEventDto, rawPayload);
    const userId = this.presence.resolveSocketUser(client.id, payload.userId);
    const existingRoom = await this.roomsService.getById(payload.roomId);
    const isAlreadyMember = existingRoom.players.some(
      (player) => player.userId === userId,
    );
    const room = isAlreadyMember
      ? existingRoom
      : await this.roomsService.join(payload.roomId, userId, payload.password);

    client.join(this.roomChannel(payload.roomId));
    this.presence.unmarkSpectator(client.id, payload.roomId);
    client.emit("room:joined", this.response.ok(room));
    server
      .to(this.roomChannel(payload.roomId))
      .emit("room:state", this.response.ok(room));
    this.broadcastRoomList(server);
  }

  async handleRoomLeave(
    rawPayload: unknown,
    client: Socket,
    server: Server,
  ): Promise<void> {
    const payload = this.validation.validatePayload(RoomLeaveDto, rawPayload);
    const userId = this.presence.resolveSocketUser(client.id, payload.userId);
    await this.assertUserInRoom(payload.roomId, userId);

    const room = await this.roomsService.leave(payload.roomId, userId);
    const channel = this.roomChannel(payload.roomId);

    client.leave(channel);
    client.emit("room:left", this.response.ok({ roomId: payload.roomId, userId }));

    if (room.players.length === 0) {
      const closed = await this.gameRuntime.closeRoom(
        payload.roomId,
        "room_empty",
        server,
      );
      client.emit("room:closed", this.response.ok(closed));
      return;
    }

    server.to(channel).emit("room:state", this.response.ok(room));
    await this.broadcastRoomList(server);
  }

  async handleRoomStart(
    rawPayload: unknown,
    client: Socket,
    server: Server,
  ): Promise<void> {
    const payload = this.validation.validatePayload(RoomStartDto, rawPayload);
    if (this.presence.isSpectator(client.id, payload.roomId)) {
      throw new UnauthorizedException("Spectator cannot start a game");
    }
    const requesterUserId = this.presence.resolveSocketUser(
      client.id,
      payload.userId,
      "room:start requires a bound userId on this socket",
    );
    await this.assertUserInRoom(payload.roomId, requesterUserId);

    const room = await this.roomsService.start(payload.roomId, requesterUserId);
    server.to(this.roomChannel(payload.roomId)).emit("room:started", this.response.ok(room));
    await this.gameRuntime.startGameLoop(room, server);
    await this.broadcastRoomList(server);
  }

  async handleChatMessage(
    rawPayload: unknown,
    client: Socket,
    server: Server,
  ): Promise<void> {
    const payload = this.validation.validatePayload(ChatMessageDto, rawPayload);
    const userId = this.presence.resolveSocketUser(client.id, payload.userId);
    await this.assertUserInRoom(payload.roomId, userId);

    const content = payload.content?.trim();
    if (!content) {
      client.emit(
        "chat:message:error",
        this.response.fail("BAD_REQUEST", "Message content is required"),
      );
      return;
    }

    server.to(this.roomChannel(payload.roomId)).emit(
      "chat:message",
      this.response.ok({
        roomId: payload.roomId,
        userId,
        content,
        sentAt: new Date().toISOString(),
      }),
    );
  }

  async handleRoomSpectate(
    rawPayload: unknown,
    client: Socket,
    server: Server,
  ): Promise<void> {
    const payload = this.validation.validatePayload(RoomSpectateDto, rawPayload);
    const userId = this.presence.resolveSocketUser(client.id, payload.userId);
    const room = await this.roomsService.getById(payload.roomId);
    const isMember = room.players.some((player) => player.userId === userId);

    if (room.isPrivate && !isMember) {
      throw new UnauthorizedException("Private room cannot be spectated");
    }

    client.join(this.roomChannel(payload.roomId));
    this.presence.markSpectator(client.id, payload.roomId);

    client.emit(
      "room:spectated",
      this.response.ok({
        roomId: payload.roomId,
        spectatorCount: this.presence.getSpectatorCount(payload.roomId),
      }),
    );
    client.emit("room:state", this.response.ok(room));
    client.emit(
      "game:state",
      this.response.ok(await this.gameService.getRoomState(payload.roomId)),
    );
    this.emitSpectatorCount(payload.roomId, server);
  }

  private async removeUserFromRooms(userId: number, server: Server): Promise<void> {
    let listUpdated = false;

    for (const room of await this.roomsService.list()) {
      if (!room.players.some((player) => player.userId === userId)) {
        continue;
      }

      if (room.status === "playing") {
        continue;
      }

      const updatedRoom = await this.roomsService.leave(room.id, userId);
      const channel = this.roomChannel(room.id);
      server
        .to(channel)
        .emit("room:left", this.response.ok({ roomId: room.id, userId }));

      if (updatedRoom.players.length === 0) {
        await this.gameRuntime.closeRoom(room.id, "socket_disconnect", server);
        continue;
      }

      server.to(channel).emit("room:state", this.response.ok(updatedRoom));
      listUpdated = true;
    }

    if (listUpdated) {
      await this.broadcastRoomList(server);
    }
  }

  private scheduleUserRemoval(userId: number, server: Server): void {
    this.cancelPendingDisconnect(userId);

    const timeout = setTimeout(() => {
      this.pendingDisconnects.delete(userId);

      void (async () => {
        if (this.presence.hasActiveSockets(userId)) {
          return;
        }
        await this.usersService.updateUser({
          where: { id: userId },
          data: { status: "offline" },
        });
        await this.removeUserFromRooms(userId, server);
      })();
    }, this.disconnectGraceMs);

    this.pendingDisconnects.set(userId, timeout);
  }

  private cancelPendingDisconnect(userId: number): void {
    const timeout = this.pendingDisconnects.get(userId);
    if (!timeout) {
      return;
    }
    clearTimeout(timeout);
    this.pendingDisconnects.delete(userId);
  }

  private hasExpired(sinceIso: string, ttlMs: number, nowMs: number): boolean {
    if (ttlMs <= 0) {
      return false;
    }

    const sinceMs = Date.parse(sinceIso);
    if (Number.isNaN(sinceMs)) {
      return false;
    }

    return nowMs - sinceMs >= ttlMs;
  }

  private async assertUserInRoom(roomId: number, userId: number) {
    const room = await this.roomsService.getById(roomId);
    if (!room.players.some((player) => player.userId === userId)) {
      throw new UnauthorizedException("User is not in this room");
    }
    return room;
  }

  private async broadcastRoomList(server: Server): Promise<void> {
    server.emit("room:list-updated", this.response.ok(await this.roomsService.listVisible()));
  }

  private roomChannel(roomId: number): string {
    return `room:${roomId}`;
  }

  private emitSpectatorCount(roomId: number, server: Server): void {
    server.to(this.roomChannel(roomId)).emit(
      "room:spectators:update",
      this.response.ok({
        roomId,
        count: this.presence.getSpectatorCount(roomId),
      }),
    );
  }
}
