/// <reference types="jest" />

import { QuizzesService } from "./quizzes.service";

describe("QuizzesService", () => {
  it("hides ws smoke and technical quizzes from the public quiz list", async () => {
    const prisma = {
      client: {
        quiz: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 50,
              title: "WS Smoke Quiz 1776511484030",
              createdAt: new Date("2026-04-18T11:24:44.050Z"),
              _count: {
                games: 0,
                questions: 1,
              },
            },
            {
              id: 42,
              title: "Culture 42",
              createdAt: new Date("2026-04-01T10:00:00.000Z"),
              _count: {
                games: 7,
                questions: 12,
              },
            },
          ]),
        },
        room: {
          count: jest.fn().mockResolvedValue(2),
        },
      },
    };
    const service = new QuizzesService(prisma as any);

    await expect(service.listQuizzes()).resolves.toEqual([
      {
        id: 42,
        title: "Culture 42",
        createdAt: "2026-04-01T10:00:00.000Z",
        playCount: 7,
        activeRoomCount: 2,
        questionCount: 12,
      },
    ]);
  });

  it("counts only waiting and playing rooms as active", async () => {
    const prisma = {
      client: {
        quiz: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 42,
              title: "Culture 42",
              createdAt: new Date("2026-04-01T10:00:00.000Z"),
              _count: {
                games: 7,
                questions: 12,
              },
            },
          ]),
        },
        room: {
          count: jest.fn().mockResolvedValue(2),
        },
      },
    };
    const service = new QuizzesService(prisma as any);

    await expect(service.listQuizzes()).resolves.toEqual([
      {
        id: 42,
        title: "Culture 42",
        createdAt: "2026-04-01T10:00:00.000Z",
        playCount: 7,
        activeRoomCount: 2,
        questionCount: 12,
      },
    ]);

    expect(prisma.client.room.count).toHaveBeenCalledWith({
      where: {
        quizId: 42,
        status: {
          in: ["waiting", "playing"],
        },
        players: {
          some: {},
        },
      },
    });
  });
});
