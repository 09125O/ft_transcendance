/// <reference types="jest" />

import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { GameService } from "./game.service";

describe("GameService", () => {
  it("is instantiated", () => {
    const service = new GameService({} as any, {} as any);
    expect(service).toBeDefined();
  });

  it("rejects submitAnswer when room is not playing", async () => {
    const roomsService = {
      getById: jest.fn().mockResolvedValue({
        id: 1,
        status: "waiting",
        players: [{ userId: 1 }],
      }),
    } as any;

    const service = new GameService(roomsService, {} as any);

    await expect(
      service.submitAnswer(
        {
          roomId: 1,
          questionId: 10,
          answerIndex: 0,
        },
        1,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects submitAnswer when user is not in room", async () => {
    const roomsService = {
      getById: jest.fn().mockResolvedValue({
        id: 1,
        status: "playing",
        players: [{ userId: 10 }],
      }),
    } as any;

    const service = new GameService(roomsService, {} as any);

    await expect(
      service.submitAnswer(
        {
          roomId: 1,
          questionId: 10,
          answerIndex: 0,
        },
        999,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects submitAnswer when question is not active", async () => {
    const roomsService = {
      getById: jest.fn().mockResolvedValue({
        id: 1,
        status: "playing",
        players: [{ userId: 1 }],
      }),
    } as any;

    const prisma = {
      client: {},
    } as any;

    const service = new GameService(roomsService, prisma);
    jest.spyOn(service, "getRoomState").mockResolvedValue({} as any);
    jest.spyOn(service as any, "findStateOrThrow").mockResolvedValue({
      roomId: 1,
      currentGameId: 55,
      currentQuestionId: 999,
    });

    await expect(
      service.submitAnswer(
        {
          roomId: 1,
          questionId: 10,
          answerIndex: 0,
        },
        1,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("returns the persisted active game question order when a game is running", async () => {
    const service = new GameService({} as any, {
      client: {
        game: {
          findFirst: jest.fn().mockResolvedValue({
            questions: [
              { questionId: 31 },
              { questionId: 11 },
              { questionId: 24 },
            ],
          }),
        },
      },
    } as any);

    await expect(service.getQuestionOrder(7)).resolves.toEqual([31, 11, 24]);
  });

  it("falls back to the quiz question order when no active game exists", async () => {
    const roomsService = {
      getById: jest.fn().mockResolvedValue({
        id: 9,
        quizId: 42,
      }),
    } as any;

    const service = new GameService(roomsService, {
      client: {
        game: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
        quizQuestion: {
          findMany: jest.fn().mockResolvedValue([
            { id: 5 },
            { id: 9 },
            { id: 12 },
          ]),
        },
      },
    } as any);

    await expect(service.getQuestionOrder(9)).resolves.toEqual([5, 9, 12]);
  });
});
