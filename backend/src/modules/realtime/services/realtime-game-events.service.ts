import { GameService } from "@/modules/game/game.service";
import { GameAnswerEventDto } from "@/modules/realtime/dto/game-answer-event.dto";
import { RoomsService } from "@/modules/rooms/rooms.service";
import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { RealtimePresenceService } from "./realtime-presence.service";
import { RealtimeResponseService } from "./realtime-response.service";
import { RealtimeValidationService } from "./realtime-validation.service";
import { RealtimeGameRuntimeService } from "./realtime-game-runtime.service";

@Injectable()
export class RealtimeGameEventsService {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly gameService: GameService,
    private readonly validation: RealtimeValidationService,
    private readonly response: RealtimeResponseService,
    private readonly presence: RealtimePresenceService,
    private readonly gameRuntime: RealtimeGameRuntimeService,
  ) {}

  async handleGameAnswer(
    rawPayload: unknown,
    client: Socket,
    server: Server,
  ): Promise<void> {
    const payload = this.validation.validatePayload(GameAnswerEventDto, rawPayload);
    if (this.presence.isSpectator(client.id, payload.roomId)) {
      throw new UnauthorizedException("Un spectateur ne peut pas répondre");
    }
    const userId = this.presence.resolveSocketUser(client.id, payload.userId);

    const room = await this.roomsService.getById(payload.roomId);
    if (room.status !== "playing") {
      throw new ConflictException("La partie n'est pas en cours pour cette room");
    }
    if (!room.players.some((player) => player.userId === userId)) {
      throw new UnauthorizedException("L'utilisateur n'est pas dans cette room");
    }

    await this.gameRuntime.ensureActiveQuestion(payload.roomId, payload.questionId);

    const answer = await this.gameService.submitAnswer(payload, userId);
    const gameState = await this.gameService.getRoomState(payload.roomId);
    const leaderboard = await this.gameService.getRoomLeaderboard(payload.roomId);
    const channel = this.roomChannel(payload.roomId);

    client.emit("game:answer:result", this.response.ok(answer));
    server.to(channel).emit("game:state", this.response.ok(gameState));
    server.to(channel).emit(
      "game:leaderboard",
      this.response.ok({
        roomId: payload.roomId,
        leaderboard,
      }),
    );

    await this.gameRuntime.tryAdvanceAfterAnswer(payload.roomId, server);
  }

  private roomChannel(roomId: number): string {
    return `room:${roomId}`;
  }
}
