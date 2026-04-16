import { Injectable } from "@nestjs/common";
import { Server } from "socket.io";
import { RealtimePresenceService } from "./realtime-presence.service";

@Injectable()
export class RealtimeNotifierService {
  private server: Server | null = null;

  constructor(private readonly presence: RealtimePresenceService) {}

  bindServer(server: Server): void {
    this.server = server;
  }

  emitOkToUser<T>(userId: number, event: string, data: T): void {
    if (!this.server) {
      return;
    }

    const sockets = this.presence.getSocketIdsForUser(userId);
    for (const socketId of sockets) {
      this.server.to(socketId).emit(event, {
        success: true,
        data,
        error: null,
      });
    }
  }
}
