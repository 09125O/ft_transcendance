import { GameService } from "@/modules/game/game.service";
import { Room, RoomsService } from "@/modules/rooms/rooms.service";
import { ScoresService } from "@/modules/scores/scores.service";
import { ConflictException, Injectable } from "@nestjs/common";
import { Server } from "socket.io";
import { RoomTimerRuntime } from "../realtime.types";
import {
  broadcastRoomList,
  getQuestionIdForTurn,
  roomChannel,
} from "./realtime-runtime-utils";
import { RealtimeResponseService } from "./realtime-response.service";

@Injectable()
export class RealtimeGameRuntimeService {
  private readonly activeTimers = new Map<number, RoomTimerRuntime>();
  private readonly defaultQuestionDurationMs = Number(
    process.env.GAME_QUESTION_DURATION_MS || 10000,
  );
  private readonly answerGraceMs = Number(
    process.env.GAME_ANSWER_GRACE_MS || 400,
  );
  private readonly autoAdvanceDelayMs = Number(
    process.env.GAME_AUTO_ADVANCE_DELAY_MS || 1200,
  );
  private readonly timerTickMs = 1000;

  constructor(
    private readonly roomsService: RoomsService,
    private readonly gameService: GameService,
    private readonly scoresService: ScoresService,
    private readonly response: RealtimeResponseService,
  ) {}

  stopAllTimers(): void {
    for (const roomId of this.activeTimers.keys()) this.stopRoomTimer(roomId);
  }

  async ensureActiveQuestion(roomId: number, questionId: number): Promise<void> {
    const runtime = this.activeTimers.get(roomId);
    if (runtime) {
      if (runtime.questionId !== questionId) {
        throw new ConflictException("Question is not active");
      }
      return;
    }

    const state = await this.gameService.getRoomState(roomId);
    if (state.currentQuestionId === null || state.currentQuestionId !== questionId) {
      throw new ConflictException("Question is not active");
    }
    if (!state.questionEndsAt) {
      throw new ConflictException("Question has no active deadline");
    }

    const graceDeadlineMs = new Date(state.questionEndsAt).getTime() + this.answerGraceMs;
    if (Date.now() > graceDeadlineMs) {
      throw new ConflictException("Question is not active");
    }
  }

  async startGameLoop(
    room: Pick<Room, "id" | "rounds" | "questionDurationMs">,
    server: Server,
  ): Promise<void> {
    const questionOrder = await this.gameService.getQuestionOrder(room.id);
    if (questionOrder.length === 0) {
      throw new ConflictException("No questions configured");
    }
    const questionDurationMs =
      room.questionDurationMs > 0
        ? room.questionDurationMs
        : this.defaultQuestionDurationMs;
    const totalQuestions = Math.min(Math.max(1, room.rounds), questionOrder.length);
    await this.gameService.startGame(room.id, totalQuestions, questionDurationMs);
    server.to(roomChannel(room.id)).emit(
      "game:started",
      this.response.ok({
        roomId: room.id,
        totalQuestions,
        questionDurationMs,
      }),
    );
    await this.startQuestionTimer(room.id, 1, totalQuestions, questionDurationMs, server);
  }

  async closeRoom(
    roomId: number,
    reason: string,
    server: Server,
  ): Promise<{ roomId: number; reason: string }> {
    const channel = roomChannel(roomId);
    const room = await this.roomsService.getById(roomId);
    if (room.status === "playing") {
      await this.endGame(roomId, reason, server);
    }

    const closed = await this.roomsService.close(roomId);
    await this.gameService.clearRoomState(roomId);
    this.stopRoomTimer(roomId);

    const payload = { ...closed, reason };
    server.to(channel).emit("room:closed", this.response.ok(payload));
    await broadcastRoomList(server, this.roomsService, this.response);
    return payload;
  }

  async tryAdvanceAfterAnswer(roomId: number, server: Server): Promise<void> {
    const runtime = this.activeTimers.get(roomId);
    if (!runtime) {
      return;
    }

    const room = await this.roomsService.getById(roomId);
    const activePlayersCount = room.players.length;
    if (activePlayersCount < 1) {
      return;
    }

    const state = await this.gameService.getRoomState(roomId);
    if (
      state.currentQuestionId !== runtime.questionId ||
      state.currentQuestionNumber !== runtime.questionNumber
    ) {
      return;
    }

    if (state.answersForCurrentQuestion < activePlayersCount) {
      return;
    }

    this.stopRoomTimer(roomId);

    if (this.autoAdvanceDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.autoAdvanceDelayMs));
    }

    if (runtime.questionNumber >= runtime.totalQuestions) {
      await this.endGame(roomId, "all_answered", server);
      return;
    }

    await this.startQuestionTimer(
      roomId,
      runtime.questionNumber + 1,
      runtime.totalQuestions,
      runtime.questionDurationMs,
      server,
    );
  }

  private async startQuestionTimer(
    roomId: number,
    questionNumber: number,
    totalQuestions: number,
    questionDurationMs: number,
    server: Server,
  ): Promise<void> {
    this.stopRoomTimer(roomId);

    const questionId = await getQuestionIdForTurn(
      this.gameService,
      roomId,
      questionNumber,
    );
    const startsAtMs = Date.now();
    const endsAtMs = startsAtMs + questionDurationMs;
    const question = await this.gameService.getPublicQuestion(questionId);
    const channel = roomChannel(roomId);
    const startsAt = new Date(startsAtMs).toISOString();
    const endsAt = new Date(endsAtMs).toISOString();

    this.activeTimers.set(roomId, {
      roomId,
      questionId,
      questionNumber,
      totalQuestions,
      questionDurationMs,
      endsAtMs,
      tickInterval: setInterval(() => {
        this.emitTimerTick(roomId, questionId, questionNumber, totalQuestions, server);
      }, this.timerTickMs),
      endTimeout: setTimeout(() => {
        void this.onQuestionTimeout(roomId, server);
      }, questionDurationMs),
    });

    const state = await this.gameService.startQuestion({
      roomId,
      questionId,
      questionNumber,
      totalQuestions,
      questionDurationMs,
      startsAt,
      endsAt,
    });

    server.to(channel).emit(
      "game:question:started",
      this.response.ok({
        roomId,
        questionId,
        question,
        questionNumber,
        totalQuestions,
        durationMs: questionDurationMs,
        startsAt,
        endsAt,
      }),
    );
    server.to(channel).emit("game:state", this.response.ok(state));
    this.emitTimerTick(roomId, questionId, questionNumber, totalQuestions, server);
  }

  private emitTimerTick(
    roomId: number,
    questionId: number,
    questionNumber: number,
    totalQuestions: number,
    server: Server,
  ): void {
    const runtime = this.activeTimers.get(roomId);
    if (!runtime) return;

    const remainingMs = Math.max(0, runtime.endsAtMs - Date.now());
    server.to(roomChannel(roomId)).emit(
      "game:timer",
      this.response.ok({
        roomId,
        questionId,
        questionNumber,
        totalQuestions,
        remainingMs,
        endsAt: new Date(runtime.endsAtMs).toISOString(),
      }),
    );
  }

  private async onQuestionTimeout(roomId: number, server: Server): Promise<void> {
    const runtime = this.activeTimers.get(roomId);
    if (!runtime) return;

    this.stopRoomTimer(roomId);
    const state = await this.gameService.markQuestionTimedOut(roomId);
    server.to(roomChannel(roomId)).emit(
      "game:question:timeout",
      this.response.ok({
        roomId: runtime.roomId,
        questionId: runtime.questionId,
        questionNumber: runtime.questionNumber,
        totalQuestions: runtime.totalQuestions,
      }),
    );
    server.to(roomChannel(roomId)).emit("game:state", this.response.ok(state));

    // Allow in-flight answers emitted at the timer edge to be processed first.
    if (this.answerGraceMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.answerGraceMs));
    }

    if (runtime.questionNumber >= runtime.totalQuestions) {
      await this.endGame(roomId, "timer_completed", server);
      return;
    }

    await this.startQuestionTimer(
      roomId,
      runtime.questionNumber + 1,
      runtime.totalQuestions,
      runtime.questionDurationMs,
      server,
    );
  }

  private async endGame(
    roomId: number,
    reason: string,
    server: Server,
  ): Promise<void> {
    this.stopRoomTimer(roomId);
    const leaderboard = await this.gameService.getRoomLeaderboard(roomId);
    const winnerUserId = leaderboard.length > 0 ? leaderboard[0].userId : null;
    const room = await this.roomsService.finish(roomId);
    const gameState = await this.gameService.finishGame(roomId);
    const channel = roomChannel(roomId);

    await this.scoresService.recordGameResult(leaderboard, winnerUserId);

    server.to(channel).emit("room:state", this.response.ok(room));
    server.to(channel).emit(
      "game:leaderboard",
      this.response.ok({ roomId, leaderboard }),
    );
    server.to(channel).emit("game:state", this.response.ok(gameState));
    server.to(channel).emit(
      "game:ended",
      this.response.ok({ roomId, reason, winnerUserId, leaderboard }),
    );

    await broadcastRoomList(server, this.roomsService, this.response);
  }

  private stopRoomTimer(roomId: number): void {
    const runtime = this.activeTimers.get(roomId);
    if (!runtime) return;

    clearInterval(runtime.tickInterval);
    clearTimeout(runtime.endTimeout);
    this.activeTimers.delete(roomId);
  }
}
