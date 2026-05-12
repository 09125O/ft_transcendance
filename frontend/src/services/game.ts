import { apiRequest } from "./api";
import type { PublicQuestion } from "../types/game";

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

export type ActiveQuestionSnapshot = {
  state: GameState;
  question: PublicQuestion | null;
};

export function getActiveQuestionSnapshot(
  roomId: number,
): Promise<ActiveQuestionSnapshot> {
  return apiRequest<ActiveQuestionSnapshot>(`/game/${roomId}/active-question`);
}
