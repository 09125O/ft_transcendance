import { PrismaService } from "@/prisma/prisma.service";
import { RoomsService } from "@/modules/rooms/rooms.service";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { RoomGameState } from "@generated/prisma/client";
import { SubmitAnswerDto } from "./dto/submit-answer.dto";

export type GameLeaderboardEntry = {
  userId: number;
  score: number;
};

export type GameState = {
  roomId: number;
  status: "waiting" | "playing" | "finished";
  currentQuestionId: number | null;
  currentQuestionNumber: number;
  totalQuestions: number;
  questionDurationMs: number | null;
  questionStartedAt: string | null;
  questionEndsAt: string | null;
  answersForCurrentQuestion: number;
  totalAnswers: number;
  leaderboard: GameLeaderboardEntry[];
  winnerUserId: number | null;
  startedAt: string | null;
  endedAt: string | null;
  updatedAt: string;
};

export type SubmitAnswerResult = {
  roomId: number;
  userId: number;
  questionId: number;
  selectedAnswerIndex: number;
  isCorrect: boolean;
  scoreDelta: number;
  userTotalScore: number;
  totalAnswers: number;
};

export type PublicQuestion = {
  id: number;
  text: string;
  options: string[];
};

type RoomRuntime = {
  answeredByQuestion: Map<number, Set<number>>;
  scoresByUser: Map<number, number>;
  totalAnswers: number;
};

type QuestionEntry = PublicQuestion & {
  correctAnswerIndex: number;
};

@Injectable()
export class GameService {
  private readonly questionBank = new Map<number, QuestionEntry>([
    [
      101,
      {
        id: 101,
        text: "Quel est le language principal utilise pour ce backend ?",
        options: ["Python", "TypeScript", "Go", "Rust"],
        correctAnswerIndex: 1,
      },
    ],
    [
      102,
      {
        id: 102,
        text: "Quel endpoint est utilise pour rejoindre une room ?",
        options: ["/room/join", "/rooms/join", "/rooms/:roomId/join", "/join-room"],
        correctAnswerIndex: 2,
      },
    ],
    [
      103,
      {
        id: 103,
        text: "Quel event WebSocket diffuse le compte a rebours ?",
        options: ["game:start", "game:timer", "question:tick", "room:timer"],
        correctAnswerIndex: 1,
      },
    ],
  ]);

  constructor(
    private readonly roomsService: RoomsService,
    private readonly prisma: PrismaService,
  ) {}

  async getRoomState(roomId: number): Promise<GameState> {
    const room = await this.roomsService.getById(roomId);
    const existing = await this.prisma.client.roomGameState.findUnique({
      where: { roomId },
    });

    const runtime = this.deserializeRuntime(existing);
    this.syncScoresWithPlayers(
      room.players.map((player) => player.userId),
      runtime,
    );
    const leaderboard = this.buildLeaderboard(runtime);

    if (!existing) {
      const created = await this.prisma.client.roomGameState.create({
        data: {
          roomId,
          status: room.status,
          totalQuestions: room.rounds,
          currentQuestionId: null,
          currentQuestionNumber: 0,
          questionDurationMs: null,
          questionStartedAt: null,
          questionEndsAt: null,
          answersForCurrentQuestion: 0,
          totalAnswers: runtime.totalAnswers,
          winnerUserId: room.status === "finished" ? leaderboard[0]?.userId ?? null : null,
          startedAt: room.startedAt ? new Date(room.startedAt) : null,
          endedAt: room.finishedAt ? new Date(room.finishedAt) : null,
          answeredByQuestion: this.serializeAnsweredByQuestion(runtime.answeredByQuestion),
          scoresByUser: this.serializeScoresByUser(runtime.scoresByUser),
        },
      });

      return this.toGameState(created, leaderboard);
    }

    const winnerUserId =
      room.status === "finished"
        ? leaderboard[0]?.userId ?? existing.winnerUserId ?? null
        : existing.winnerUserId;
    const updated = await this.prisma.client.roomGameState.update({
      where: { roomId },
      data: {
        status: room.status,
        totalQuestions: Math.max(existing.totalQuestions, room.rounds),
        startedAt:
          room.startedAt && !existing.startedAt
            ? new Date(room.startedAt)
            : undefined,
        endedAt:
          room.finishedAt && !existing.endedAt
            ? new Date(room.finishedAt)
            : undefined,
        winnerUserId,
        totalAnswers: runtime.totalAnswers,
        answeredByQuestion: this.serializeAnsweredByQuestion(runtime.answeredByQuestion),
        scoresByUser: this.serializeScoresByUser(runtime.scoresByUser),
      },
    });

    return this.toGameState(updated, leaderboard);
  }

  async startGame(
    roomId: number,
    totalQuestions: number,
    questionDurationMs: number,
  ): Promise<GameState> {
    const room = await this.roomsService.getById(roomId);
    const runtime: RoomRuntime = {
      answeredByQuestion: new Map(),
      scoresByUser: new Map(),
      totalAnswers: 0,
    };
    this.syncScoresWithPlayers(
      room.players.map((player) => player.userId),
      runtime,
    );
    const now = new Date();

    const state = await this.prisma.client.roomGameState.upsert({
      where: { roomId },
      update: {
        status: "playing",
        currentQuestionId: null,
        currentQuestionNumber: 0,
        totalQuestions: Math.max(1, totalQuestions),
        questionDurationMs,
        questionStartedAt: null,
        questionEndsAt: null,
        answersForCurrentQuestion: 0,
        totalAnswers: 0,
        winnerUserId: null,
        startedAt: room.startedAt ? new Date(room.startedAt) : now,
        endedAt: null,
        answeredByQuestion: this.serializeAnsweredByQuestion(runtime.answeredByQuestion),
        scoresByUser: this.serializeScoresByUser(runtime.scoresByUser),
      },
      create: {
        roomId,
        status: "playing",
        currentQuestionId: null,
        currentQuestionNumber: 0,
        totalQuestions: Math.max(1, totalQuestions),
        questionDurationMs,
        questionStartedAt: null,
        questionEndsAt: null,
        answersForCurrentQuestion: 0,
        totalAnswers: 0,
        winnerUserId: null,
        startedAt: room.startedAt ? new Date(room.startedAt) : now,
        endedAt: null,
        answeredByQuestion: this.serializeAnsweredByQuestion(runtime.answeredByQuestion),
        scoresByUser: this.serializeScoresByUser(runtime.scoresByUser),
      },
    });

    return this.toGameState(state, this.buildLeaderboard(runtime));
  }

  async startQuestion(params: {
    roomId: number;
    questionId: number;
    questionNumber: number;
    totalQuestions: number;
    questionDurationMs: number;
    startsAt: string;
    endsAt: string;
  }): Promise<GameState> {
    await this.getRoomState(params.roomId);

    const updated = await this.prisma.client.roomGameState.update({
      where: { roomId: params.roomId },
      data: {
        status: "playing",
        currentQuestionId: params.questionId,
        currentQuestionNumber: params.questionNumber,
        totalQuestions: params.totalQuestions,
        questionDurationMs: params.questionDurationMs,
        questionStartedAt: new Date(params.startsAt),
        questionEndsAt: new Date(params.endsAt),
        answersForCurrentQuestion: 0,
      },
    });
    const runtime = this.deserializeRuntime(updated);
    return this.toGameState(updated, this.buildLeaderboard(runtime));
  }

  async markQuestionTimedOut(roomId: number): Promise<GameState> {
    await this.getRoomState(roomId);
    const updated = await this.prisma.client.roomGameState.update({
      where: { roomId },
      data: {},
    });
    const runtime = this.deserializeRuntime(updated);
    return this.toGameState(updated, this.buildLeaderboard(runtime));
  }

  async submitAnswer(
    dto: SubmitAnswerDto,
    userId: number,
  ): Promise<SubmitAnswerResult> {
    const room = await this.roomsService.getById(dto.roomId);
    if (room.status !== "playing") {
      throw new ConflictException("Game is not running for this room");
    }

    if (!room.players.some((player) => player.userId === userId)) {
      throw new UnauthorizedException("User is not in this room");
    }

    await this.getRoomState(dto.roomId);
    const state = await this.findStateOrThrow(dto.roomId);
    if (state.currentQuestionId === null || state.currentQuestionId !== dto.questionId) {
      throw new ConflictException("Question is not active");
    }

    const runtime = this.deserializeRuntime(state);
    const question = this.getQuestionEntry(dto.questionId);
    if (dto.answerIndex >= question.options.length) {
      throw new BadRequestException("Answer index is out of range");
    }

    const answeredUsers =
      runtime.answeredByQuestion.get(dto.questionId) || new Set<number>();
    if (answeredUsers.has(userId)) {
      throw new ConflictException("User already answered this question");
    }

    answeredUsers.add(userId);
    runtime.answeredByQuestion.set(dto.questionId, answeredUsers);
    runtime.totalAnswers += 1;

    const isCorrect = question.correctAnswerIndex === dto.answerIndex;
    const scoreDelta = isCorrect ? 100 : 0;
    const previousScore = runtime.scoresByUser.get(userId) || 0;
    const userTotalScore = previousScore + scoreDelta;
    runtime.scoresByUser.set(userId, userTotalScore);
    const leaderboard = this.buildLeaderboard(runtime);

    await this.prisma.client.roomGameState.update({
      where: { roomId: dto.roomId },
      data: {
        answersForCurrentQuestion: answeredUsers.size,
        totalAnswers: runtime.totalAnswers,
        answeredByQuestion: this.serializeAnsweredByQuestion(runtime.answeredByQuestion),
        scoresByUser: this.serializeScoresByUser(runtime.scoresByUser),
        winnerUserId: leaderboard[0]?.userId ?? null,
      },
    });

    return {
      roomId: dto.roomId,
      userId,
      questionId: dto.questionId,
      selectedAnswerIndex: dto.answerIndex,
      isCorrect,
      scoreDelta,
      userTotalScore,
      totalAnswers: runtime.totalAnswers,
    };
  }

  async finishGame(roomId: number): Promise<GameState> {
    const room = await this.roomsService.getById(roomId);
    await this.getRoomState(roomId);

    const state = await this.findStateOrThrow(roomId);
    const runtime = this.deserializeRuntime(state);
    const leaderboard = this.buildLeaderboard(runtime);
    const endedAt = room.finishedAt ? new Date(room.finishedAt) : new Date();
    const finished = await this.prisma.client.roomGameState.update({
      where: { roomId },
      data: {
        status: "finished",
        winnerUserId: leaderboard[0]?.userId ?? null,
        endedAt,
      },
    });

    return this.toGameState(finished, leaderboard);
  }

  getQuestionOrder(): number[] {
    return [...this.questionBank.keys()].sort((a, b) => a - b);
  }

  getPublicQuestion(questionId: number): PublicQuestion {
    const question = this.getQuestionEntry(questionId);

    return {
      id: question.id,
      text: question.text,
      options: [...question.options],
    };
  }

  async getRoomLeaderboard(roomId: number): Promise<GameLeaderboardEntry[]> {
    await this.getRoomState(roomId);
    const state = await this.findStateOrThrow(roomId);
    return this.buildLeaderboard(this.deserializeRuntime(state));
  }

  async clearRoomState(roomId: number): Promise<void> {
    await this.prisma.client.roomGameState.deleteMany({
      where: { roomId },
    });
  }

  private buildLeaderboard(runtime: RoomRuntime): GameLeaderboardEntry[] {
    return [...runtime.scoresByUser.entries()]
      .map(([userId, score]) => ({ userId, score }))
      .sort((left, right) => right.score - left.score || left.userId - right.userId);
  }

  private syncScoresWithPlayers(playerIds: number[], runtime: RoomRuntime): void {
    const playerIdSet = new Set(playerIds);

    for (const playerId of playerIds) {
      if (!runtime.scoresByUser.has(playerId)) {
        runtime.scoresByUser.set(playerId, 0);
      }
    }

    for (const userId of [...runtime.scoresByUser.keys()]) {
      if (!playerIdSet.has(userId)) {
        runtime.scoresByUser.delete(userId);
      }
    }
  }

  private getQuestionEntry(questionId: number): QuestionEntry {
    const question = this.questionBank.get(questionId);
    if (!question) {
      throw new ConflictException(`Question ${questionId} not configured`);
    }
    return question;
  }

  private async findStateOrThrow(roomId: number): Promise<RoomGameState> {
    const state = await this.prisma.client.roomGameState.findUnique({
      where: { roomId },
    });
    if (!state) {
      throw new ConflictException(`Game state for room ${roomId} not found`);
    }
    return state;
  }

  private deserializeRuntime(state: RoomGameState | null): RoomRuntime {
    if (!state) {
      return {
        answeredByQuestion: new Map<number, Set<number>>(),
        scoresByUser: new Map<number, number>(),
        totalAnswers: 0,
      };
    }

    const answeredByQuestion = new Map<number, Set<number>>();
    const answeredRaw = this.toRecord(state.answeredByQuestion);
    for (const [questionId, userIds] of Object.entries(answeredRaw)) {
      if (!Array.isArray(userIds)) {
        continue;
      }
      const parsedQuestionId = Number(questionId);
      if (!Number.isFinite(parsedQuestionId)) {
        continue;
      }

      const parsedUserIds = userIds.filter(
        (value): value is number => typeof value === "number" && Number.isInteger(value),
      );
      answeredByQuestion.set(parsedQuestionId, new Set(parsedUserIds));
    }

    const scoresByUser = new Map<number, number>();
    const scoresRaw = this.toRecord(state.scoresByUser);
    for (const [userId, score] of Object.entries(scoresRaw)) {
      const parsedUserId = Number(userId);
      if (!Number.isFinite(parsedUserId) || typeof score !== "number") {
        continue;
      }
      scoresByUser.set(parsedUserId, score);
    }

    return {
      answeredByQuestion,
      scoresByUser,
      totalAnswers: state.totalAnswers || 0,
    };
  }

  private serializeAnsweredByQuestion(
    answeredByQuestion: Map<number, Set<number>>,
  ): Record<string, number[]> {
    const serialized: Record<string, number[]> = {};
    for (const [questionId, userIds] of answeredByQuestion.entries()) {
      serialized[String(questionId)] = [...userIds.values()];
    }
    return serialized;
  }

  private serializeScoresByUser(
    scoresByUser: Map<number, number>,
  ): Record<string, number> {
    const serialized: Record<string, number> = {};
    for (const [userId, score] of scoresByUser.entries()) {
      serialized[String(userId)] = score;
    }
    return serialized;
  }

  private toRecord(payload: unknown): Record<string, unknown> {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return {};
    }
    return payload as Record<string, unknown>;
  }

  private toGameState(
    state: RoomGameState,
    leaderboard: GameLeaderboardEntry[],
  ): GameState {
    return {
      roomId: state.roomId,
      status: state.status,
      currentQuestionId: state.currentQuestionId,
      currentQuestionNumber: state.currentQuestionNumber,
      totalQuestions: state.totalQuestions,
      questionDurationMs: state.questionDurationMs,
      questionStartedAt: state.questionStartedAt
        ? state.questionStartedAt.toISOString()
        : null,
      questionEndsAt: state.questionEndsAt ? state.questionEndsAt.toISOString() : null,
      answersForCurrentQuestion: state.answersForCurrentQuestion,
      totalAnswers: state.totalAnswers,
      leaderboard,
      winnerUserId: state.winnerUserId,
      startedAt: state.startedAt ? state.startedAt.toISOString() : null,
      endedAt: state.endedAt ? state.endedAt.toISOString() : null,
      updatedAt: state.updatedAt.toISOString(),
    };
  }
}
