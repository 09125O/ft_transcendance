import { useCallback, useEffect, useState } from "react";
import type { Room } from "../services/quiz";
import { getUserById } from "../services/users";

type ScoreEntry = {
  userId: number;
  username: string;
  avatarUrl: string | null;
  score: number;
};

type LeaderboardEntry = {
  userId: number;
  score: number;
};

export type RoomLeaderboardPayload = {
  roomId: number;
  leaderboard: LeaderboardEntry[];
};

type UseRoomParticipantsResult = {
  scoreEntries: ScoreEntry[];
  applyLeaderboard: (payload: LeaderboardEntry[] | RoomLeaderboardPayload) => void;
};

function compareScoreEntries(left: ScoreEntry, right: ScoreEntry): number {
  return right.score - left.score || left.userId - right.userId;
}

export function useRoomParticipants(
  currentRoom: Room | null,
): UseRoomParticipantsResult {
  const [scoreEntries, setScoreEntries] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    if (!currentRoom) {
      setScoreEntries([]);
      return;
    }

    const loadRoomUsers = async () => {
      const entries = await Promise.all(
        currentRoom.players.map(async (player) => {
          const userId = player.userId;
          try {
            const user = await getUserById(userId);
            return {
              userId,
              username: user.username,
              avatarUrl: user.avatar_url ?? null,
              score: 0,
            };
          } catch {
            return {
              userId,
              username: `Joueur #${userId}`,
              avatarUrl: null,
              score: 0,
            };
          }
        }),
      );

      setScoreEntries((previous) => {
        const mergedEntries = entries.map((entry) => ({
          ...entry,
          score:
            previous.find((previousEntry) => previousEntry.userId === entry.userId)?.score ??
            entry.score,
        }));

        return mergedEntries.sort(compareScoreEntries);
      });
    };

    void loadRoomUsers();
  }, [currentRoom]);

  const applyLeaderboard = useCallback((payload: LeaderboardEntry[] | RoomLeaderboardPayload) => {
    const leaderboard = Array.isArray(payload) ? payload : payload.leaderboard;

    setScoreEntries((previous) => {
      const scoreByUserId = new Map(
        leaderboard.map((entry) => [entry.userId, entry.score]),
      );

      const updatedEntries = previous.map((entry) => ({
        ...entry,
        score: scoreByUserId.get(entry.userId) ?? entry.score,
      }));

      const knownUserIds = new Set(updatedEntries.map((entry) => entry.userId));
      const missingEntries = leaderboard
        .filter((entry) => !knownUserIds.has(entry.userId))
        .map((entry) => ({
          userId: entry.userId,
          username: `Joueur #${entry.userId}`,
          avatarUrl: null,
          score: entry.score,
        }));

      return [...updatedEntries, ...missingEntries].sort(compareScoreEntries);
    });
  }, []);

  return {
    scoreEntries,
    applyLeaderboard,
  };
}
