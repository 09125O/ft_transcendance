import { PrismaService } from "@/prisma/prisma.service";
import { Injectable, NotFoundException } from "@nestjs/common";

export type UserScore = {
  userId: number;
  username: string;
  score: number;
  wins: number;
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

    return rows.map((row) => ({
      userId: row.userId,
      username: row.user.username,
      score: row.score,
      wins: row.wins,
    }));
  }

  async getUserScore(userId: number): Promise<UserScore> {
    const row = await this.prisma.client.userAggregateScore.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!row) {
      throw new NotFoundException(`Score for user ${userId} not found`);
    }

    return {
      userId: row.userId,
      username: row.user.username,
      score: row.score,
      wins: row.wins,
    };
  }
}
