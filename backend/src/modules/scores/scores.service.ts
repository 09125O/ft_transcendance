import { PrismaService } from "@/prisma/prisma.service";
import { Injectable, NotFoundException } from "@nestjs/common";

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

@Injectable()
export class ScoresService {
  constructor(private readonly prisma: PrismaService) {}

  async recordGameResult(
    entries: Array<{ userId: number; score: number }>,
    winnerUserId: number | null,
  ): Promise<void> {
    if (entries.length === 0) {
      return;
    }

    const userIds = [...new Set(entries.map((entry) => entry.userId))];
    const existingUsers = await this.prisma.client.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    });
    const existingUserIdSet = new Set(existingUsers.map((user) => user.id));

    await this.prisma.client.$transaction(
      entries
        .filter((entry) => existingUserIdSet.has(entry.userId))
        .map((entry) =>
          this.prisma.client.userAggregateScore.upsert({
            where: { userId: entry.userId },
            create: {
              userId: entry.userId,
              score: entry.score,
              wins: winnerUserId === entry.userId ? 1 : 0,
            },
            update: {
              score: { increment: entry.score },
              ...(winnerUserId === entry.userId
                ? { wins: { increment: 1 } }
                : {}),
            },
          }),
        ),
    );
  }

  async getLeaderboard(limit = 10): Promise<UserScore[]> {
    const rows = await this.prisma.client.userAggregateScore.findMany({
      take: limit,
      orderBy: [{ score: "desc" }, { wins: "desc" }, { userId: "asc" }],
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    const gamesPlayedByUserId = await this.getGamesPlayedMap(rows.map((row) => row.userId));

    return rows.map((row, index) => {
      const gamesPlayed = Math.max(gamesPlayedByUserId.get(row.userId) ?? 0, row.wins);

      return {
        userId: row.userId,
        username: row.user.username,
        score: row.score,
        wins: row.wins,
        losses: Math.max(0, gamesPlayed - row.wins),
        gamesPlayed,
        rank: index + 1,
        level: this.getLevelFromScore(row.score),
      };
    });
  }

  async getUserScore(userId: number): Promise<UserScore> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const row = await this.prisma.client.userAggregateScore.findUnique({
      where: { userId },
    });
    const recordedGamesPlayed = await this.prisma.client.leaderboard.count({
      where: { userId },
    });

    if (!row) {
      return {
        userId,
        username: user.username,
        score: 0,
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
        rank: null,
        level: 1,
      };
    }

    return {
      userId: row.userId,
      username: user.username,
      score: row.score,
      wins: row.wins,
      gamesPlayed: Math.max(recordedGamesPlayed, row.wins),
      losses: Math.max(0, Math.max(recordedGamesPlayed, row.wins) - row.wins),
      rank: await this.getRankForUser(row.userId, row.score, row.wins),
      level: this.getLevelFromScore(row.score),
    };
  }

  async getUserMatchHistory(
    userId: number,
    limit = 10,
  ): Promise<MatchHistoryEntry[]> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const rows = await this.prisma.client.leaderboard.findMany({
      where: { userId },
      take: limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        game: {
          select: {
            id: true,
            roomId: true,
            quizId: true,
            finishedAt: true,
            createdAt: true,
            room: {
              select: {
                name: true,
              },
            },
            quiz: {
              select: {
                title: true,
              },
            },
            leaderboard: {
              orderBy: [{ rank: "asc" }, { userId: "asc" }],
              select: {
                userId: true,
                user: {
                  select: {
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return rows.map((row) => ({
      gameId: row.game.id,
      roomId: row.game.roomId,
      roomName: row.game.room.name,
      quizId: row.game.quizId,
      quizTitle: row.game.quiz.title,
      playedAt: (row.game.finishedAt ?? row.createdAt ?? row.game.createdAt).toISOString(),
      finalScore: row.finalScore,
      rank: row.rank,
      isWinner: row.isWinner,
      totalPlayers: row.game.leaderboard.length,
      opponents: row.game.leaderboard
        .filter((entry) => entry.userId !== userId)
        .map((entry) => ({
          userId: entry.userId,
          username: entry.user.username,
        })),
    }));
  }

  private async getGamesPlayedMap(userIds: number[]): Promise<Map<number, number>> {
    const uniqueUserIds = [...new Set(userIds)];
    if (uniqueUserIds.length === 0) {
      return new Map();
    }

    const counts = await Promise.all(
      uniqueUserIds.map(async (userId) => [
        userId,
        await this.prisma.client.leaderboard.count({
          where: { userId },
        }),
      ] as const),
    );

    return new Map(counts);
  }

  private async getRankForUser(
    userId: number,
    score: number,
    wins: number,
  ): Promise<number> {
    const betterPlayersCount = await this.prisma.client.userAggregateScore.count({
      where: {
        OR: [
          { score: { gt: score } },
          {
            AND: [{ score }, { wins: { gt: wins } }],
          },
          {
            AND: [{ score }, { wins }, { userId: { lt: userId } }],
          },
        ],
      },
    });

    return betterPlayersCount + 1;
  }

  private getLevelFromScore(score: number): number {
    return Math.max(1, Math.floor(score / 100) + 1);
  }
}
