/// <reference types="jest" />

import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { RoomsService } from "./rooms.service";

describe("RoomsService", () => {
  it("is instantiated", () => {
    const service = new RoomsService({} as any);
    expect(service).toBeDefined();
  });

  it("rejects create when owner is missing", async () => {
    const service = new RoomsService({} as any);

    await expect(
      service.create({
        name: "Room test",
        quizId: 1,
        rounds: 3,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects join when room is not in waiting state", async () => {
    const service = new RoomsService({} as any);
    jest.spyOn(service as any, "findRoomOrThrow").mockResolvedValue({
      id: 7,
      status: "playing",
      isPrivate: false,
      players: [],
    });

    await expect(service.join(7, 42)).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects starting a room by non-owner", async () => {
    const service = new RoomsService({} as any);
    jest.spyOn(service as any, "findRoomOrThrow").mockResolvedValue({
      id: 11,
      ownerId: 2,
      quizId: 1,
      status: "waiting",
      players: [{ userId: 2 }, { userId: 3 }],
      games: [],
    });

    await expect(service.start(11, 99)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
