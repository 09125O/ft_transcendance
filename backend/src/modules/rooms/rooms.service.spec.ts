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

  it("rejects joining a private room when requester is not host friend", async () => {
    const prisma = {
      client: {
        friendRequests: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      },
    };
    const service = new RoomsService(prisma as any);
    jest.spyOn(service as any, "findRoomOrThrow").mockResolvedValue({
      id: 8,
      ownerId: 11,
      status: "waiting",
      isPrivate: true,
      passwordHash: "hashed-room-password",
      players: [],
    });

    await expect(service.join(8, 42)).rejects.toThrow(
      "Private room is restricted to host friends",
    );
    expect(prisma.client.friendRequests.findFirst).toHaveBeenCalled();
  });

  it("skips friendship lookup for private room owner", async () => {
    const prisma = {
      client: {
        friendRequests: {
          findFirst: jest.fn(),
        },
      },
    };
    const service = new RoomsService(prisma as any);
    jest.spyOn(service as any, "findRoomOrThrow").mockResolvedValue({
      id: 9,
      ownerId: 42,
      status: "waiting",
      isPrivate: true,
      passwordHash: "hashed-room-password",
      players: [],
    });

    await expect(service.join(9, 42)).rejects.toThrow("Invalid room password");
    expect(prisma.client.friendRequests.findFirst).not.toHaveBeenCalled();
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

  it("allows starting a quiz room with a single player", async () => {
    const prisma = {
      client: {
        room: {
          update: jest.fn().mockResolvedValue({
            id: 19,
            name: "Quiz solo",
            ownerId: 5,
            quizId: 42,
            rounds: 5,
            isPrivate: false,
            status: "playing",
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
            startedAt: new Date("2026-01-01T00:01:00.000Z"),
            finishedAt: null,
            passwordHash: null,
            players: [
              {
                userId: 5,
                roomId: 19,
                joinedAt: new Date("2026-01-01T00:00:00.000Z"),
              },
            ],
          }),
        },
      },
    };
    const service = new RoomsService(prisma as any);
    jest.spyOn(service as any, "findRoomOrThrow").mockResolvedValue({
      id: 19,
      ownerId: 5,
      quizId: 42,
      status: "waiting",
      players: [{ userId: 5 }],
    });

    await expect(service.start(19, 5)).resolves.toMatchObject({
      id: 19,
      status: "playing",
    });
  });

  it("keeps 3 players minimum for rooms without quiz", async () => {
    const service = new RoomsService({} as any);
    jest.spyOn(service as any, "findRoomOrThrow").mockResolvedValue({
      id: 21,
      ownerId: 7,
      quizId: null,
      status: "waiting",
      players: [{ userId: 7 }, { userId: 8 }],
    });

    await expect(service.start(21, 7)).rejects.toThrow(
      "Cannot start a room with fewer than 3 players",
    );
  });
});
