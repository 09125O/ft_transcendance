import { Logger, OnModuleDestroy } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { RealtimeAuthService } from "./services/realtime-auth.service";
import { RealtimeGameEventsService } from "./services/realtime-game-events.service";
import { RealtimeGameRuntimeService } from "./services/realtime-game-runtime.service";
import { RealtimePresenceService } from "./services/realtime-presence.service";
import { RealtimeNotifierService } from "./services/realtime-notifier.service";
import { RealtimeResponseService } from "./services/realtime-response.service";
import { RealtimeRoomEventsService } from "./services/realtime-room-events.service";
import { isOriginAllowed } from "@/config/runtime";

@WebSocketGateway({
  namespace: "/ws",
  cors: {
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin));
    },
    credentials: true,
  },
  transports: ["websocket", "polling"],
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy, OnGatewayInit
{
  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly roomCleanupIntervalMs = Number(
    process.env.ROOM_CLEANUP_INTERVAL_MS || 30000,
  );
  private roomCleanupInterval: NodeJS.Timeout | null = null;

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly auth: RealtimeAuthService,
    private readonly response: RealtimeResponseService,
    private readonly presence: RealtimePresenceService,
    private readonly roomEvents: RealtimeRoomEventsService,
    private readonly gameEvents: RealtimeGameEventsService,
    private readonly gameRuntime: RealtimeGameRuntimeService,
    private readonly notifier: RealtimeNotifierService,
  ) {}

  afterInit(server: Server): void {
    this.notifier.bindServer(server);

    if (this.roomCleanupIntervalMs > 0) {
      this.roomCleanupInterval = setInterval(() => {
        void this.roomEvents.cleanupExpiredRooms(server).catch((exception) => {
          const message =
            exception instanceof Error ? exception.message : "Unknown room cleanup error";
          this.logger.error(`Failed to auto-close expired rooms: ${message}`);
        });
      }, this.roomCleanupIntervalMs);
    }
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const userId = await this.auth.authenticateSocket(client);
      this.presence.bindSocketToUser(client.id, userId);
      this.roomEvents.handleReconnect(userId);

      client.emit(
        "ws:connected",
        this.response.ok({
          socketId: client.id,
          userId,
          timestamp: new Date().toISOString(),
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Authentification requise";

      client.emit(
        "ws:auth:error",
        this.response.fail("UNAUTHORIZED", message),
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    void this.roomEvents.handleDisconnect(client.id, this.server).catch((exception) => {
      const message =
        exception instanceof Error ? exception.message : "Unknown disconnect error";
      this.logger.error(`Failed to handle socket disconnect: ${message}`);
    });
    this.logger.log(`Socket disconnected: ${client.id}`);
  }

  onModuleDestroy(): void {
    if (this.roomCleanupInterval) {
      clearInterval(this.roomCleanupInterval);
      this.roomCleanupInterval = null;
    }
    this.gameRuntime.stopAllTimers();
    this.roomEvents.clearPendingDisconnects();
    this.presence.clear();
  }

  @SubscribeMessage("room:list")
  handleRoomList(@ConnectedSocket() client: Socket): void {
    void this.runSafely(client, "room:list:error", async () => {
      await this.roomEvents.handleRoomList(client);
    });
  }

  @SubscribeMessage("room:create")
  handleRoomCreate(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ): void {
    void this.runSafely(client, "room:create:error", async () => {
      await this.roomEvents.handleRoomCreate(payload, client, this.server);
    });
  }

  @SubscribeMessage("room:join")
  handleRoomJoin(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ): void {
    void this.runSafely(client, "room:join:error", async () => {
      await this.roomEvents.handleRoomJoin(payload, client, this.server);
    });
  }

  @SubscribeMessage("room:leave")
  handleRoomLeave(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ): void {
    void this.runSafely(client, "room:leave:error", async () => {
      await this.roomEvents.handleRoomLeave(payload, client, this.server);
    });
  }

  @SubscribeMessage("room:start")
  handleRoomStart(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ): void {
    void this.runSafely(client, "room:start:error", async () => {
      await this.roomEvents.handleRoomStart(payload, client, this.server);
    });
  }

  @SubscribeMessage("room:spectate")
  handleRoomSpectate(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ): void {
    void this.runSafely(client, "room:spectate:error", async () => {
      await this.roomEvents.handleRoomSpectate(payload, client, this.server);
    });
  }

  @SubscribeMessage("game:answer")
  handleGameAnswer(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ): void {
    void this.runSafely(client, "game:answer:error", async () => {
      await this.gameEvents.handleGameAnswer(payload, client, this.server);
    });
  }

  @SubscribeMessage("chat:message")
  handleChatMessage(
    @MessageBody() payload: unknown,
    @ConnectedSocket() client: Socket,
  ): void {
    void this.runSafely(client, "chat:message:error", async () => {
      await this.roomEvents.handleChatMessage(payload, client, this.server);
    });
  }

  private async runSafely(
    client: Socket,
    errorEvent: string,
    callback: () => void | Promise<void>,
  ): Promise<void> {
    try {
      await callback();
    } catch (exception) {
      this.response.emitError(client, errorEvent, exception);
    }
  }
}
