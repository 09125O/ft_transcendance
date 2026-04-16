import { Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class RealtimePresenceService {
  private readonly socketToUser = new Map<string, number>();
  private readonly userToSockets = new Map<number, Set<string>>();
  private readonly socketToSpectatingRooms = new Map<string, Set<number>>();
  private readonly roomToSpectatorSockets = new Map<number, Set<string>>();

  bindSocketToUser(socketId: string, userId: number): void {
    this.socketToUser.set(socketId, userId);

    const sockets = this.userToSockets.get(userId) || new Set<string>();
    sockets.add(socketId);
    this.userToSockets.set(userId, sockets);
  }

  resolveSocketUser(
    socketId: string,
    payloadUserId?: number,
    missingUserMessage = "Missing userId for this socket",
  ): number {
    const boundUserId = this.socketToUser.get(socketId);

    if (typeof boundUserId !== "number") {
      throw new UnauthorizedException(missingUserMessage);
    }

    if (typeof payloadUserId === "number" && boundUserId !== payloadUserId) {
      throw new UnauthorizedException("Socket user mismatch");
    }

    return boundUserId;
  }

  unregisterSocket(socketId: string): number | undefined {
    const userId = this.socketToUser.get(socketId);
    if (typeof userId !== "number") {
      return undefined;
    }

    this.socketToUser.delete(socketId);
    const sockets = this.userToSockets.get(userId);
    if (!sockets) {
      return userId;
    }

    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.userToSockets.delete(userId);
    }

    const spectatingRooms = this.socketToSpectatingRooms.get(socketId);
    if (spectatingRooms) {
      for (const roomId of spectatingRooms) {
        const spectatorSockets = this.roomToSpectatorSockets.get(roomId);
        if (!spectatorSockets) {
          continue;
        }

        spectatorSockets.delete(socketId);
        if (spectatorSockets.size === 0) {
          this.roomToSpectatorSockets.delete(roomId);
        }
      }
      this.socketToSpectatingRooms.delete(socketId);
    }

    return userId;
  }

  markSpectator(socketId: string, roomId: number): void {
    const rooms = this.socketToSpectatingRooms.get(socketId) || new Set<number>();
    rooms.add(roomId);
    this.socketToSpectatingRooms.set(socketId, rooms);

    const sockets = this.roomToSpectatorSockets.get(roomId) || new Set<string>();
    sockets.add(socketId);
    this.roomToSpectatorSockets.set(roomId, sockets);
  }

  unmarkSpectator(socketId: string, roomId: number): void {
    const rooms = this.socketToSpectatingRooms.get(socketId);
    if (rooms) {
      rooms.delete(roomId);
      if (rooms.size === 0) {
        this.socketToSpectatingRooms.delete(socketId);
      }
    }

    const sockets = this.roomToSpectatorSockets.get(roomId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.roomToSpectatorSockets.delete(roomId);
      }
    }
  }

  isSpectator(socketId: string, roomId: number): boolean {
    return this.socketToSpectatingRooms.get(socketId)?.has(roomId) === true;
  }

  getSpectatingRooms(socketId: string): number[] {
    return [...(this.socketToSpectatingRooms.get(socketId) || [])];
  }

  getSpectatorCount(roomId: number): number {
    return this.roomToSpectatorSockets.get(roomId)?.size || 0;
  }

  hasActiveSockets(userId: number): boolean {
    return this.userToSockets.has(userId);
  }

  clear(): void {
    this.socketToUser.clear();
    this.userToSockets.clear();
    this.socketToSpectatingRooms.clear();
    this.roomToSpectatorSockets.clear();
  }
}
