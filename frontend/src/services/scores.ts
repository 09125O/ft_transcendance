import { apiRequest } from "./api";

export type UserScore = {
  userId: number;
  username: string;
  score: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  rank: number | null;
  level: number;
};

export type MatchHistoryEntry = {
  gameId: number;
  roomId: number;
  roomName: string;
  quizId: number;
  quizTitle: string;
  playedAt: string;
  finalScore: number;
  rank: number | null;
  isWinner: boolean;
  totalPlayers: number;
  opponents: Array<{
    userId: number;
    username: string;
  }>;
};

export function getLeaderboard(limit = 10): Promise<UserScore[]> {
  return apiRequest<UserScore[]>(`/scores/leaderboard?limit=${limit}`);
}

export function getUserScore(userId: number): Promise<UserScore> {
  return apiRequest<UserScore>(`/scores/users/${userId}`);
}

export function getUserMatchHistory(
  userId: number,
  limit = 10,
): Promise<MatchHistoryEntry[]> {
  return apiRequest<MatchHistoryEntry[]>(
    `/scores/users/${userId}/history?limit=${limit}`,
  );
}
