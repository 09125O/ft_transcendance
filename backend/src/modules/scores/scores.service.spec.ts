import { ScoresService } from "./scores.service";

describe("ScoresService", () => {
  it("ignores ws smoke users when recording game results", async () => {
    const upsert = jest.fn();
    const transaction = jest.fn(async (operations: unknown[]) => operations);
    const findMany = jest.fn().mockResolvedValue([
      { id: 10, email: "ws-smoke-owner-1@test.com" },
      { id: 11, email: "player@test.com" },
    ]);

    const service = new ScoresService({
      client: {
        user: { findMany },
        userAggregateScore: { upsert },
        $transaction: transaction,
      },
    } as never);

    await service.recordGameResult(
      [
        { userId: 10, score: 200 },
        { userId: 11, score: 300 },
      ],
      11,
    );

    expect(findMany).toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith({
      where: { userId: 11 },
      create: {
        userId: 11,
        score: 300,
        wins: 1,
      },
      update: {
        score: { increment: 300 },
        wins: { increment: 1 },
      },
    });
    expect(transaction).toHaveBeenCalledWith([undefined]);
  });

  it("filters ws smoke users out of the public leaderboard", async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        userId: 42,
        score: 700,
        wins: 4,
        user: {
          username: "alice",
        },
      },
    ]);

    const service = new ScoresService({
      client: {
        userAggregateScore: { findMany },
        leaderboard: { count: jest.fn().mockResolvedValue(4) },
      },
    } as never);

    const leaderboard = await service.getLeaderboard(10);

    expect(findMany).toHaveBeenCalledWith({
      take: 10,
      where: {
        user: {
          email: {
            not: {
              startsWith: "ws-smoke-",
            },
          },
        },
      },
      orderBy: [{ score: "desc" }, { wins: "desc" }, { userId: "asc" }],
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });
    expect(leaderboard).toEqual([
      {
        userId: 42,
        username: "alice",
        score: 700,
        wins: 4,
        losses: 0,
        gamesPlayed: 4,
        rank: 1,
        level: 8,
      },
    ]);
  });
});
