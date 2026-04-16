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
});
