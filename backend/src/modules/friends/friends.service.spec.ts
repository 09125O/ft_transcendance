/// <reference types="jest" />

import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { FriendsService } from "./friends.service";

describe("FriendsService", () => {
  it("rejects sending a friend request to self", async () => {
    const service = new FriendsService({} as any);

    await expect(service.sendRequest(7, 7)).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects accepting a request when caller is not receiver", async () => {
    const prisma = {
      client: {
        friendRequests: {
          findUnique: jest.fn().mockResolvedValue({
            id: 42,
            senderId: 10,
            receiverId: 11,
            status: "pending",
          }),
          update: jest.fn(),
        },
      },
    } as any;

    const service = new FriendsService(prisma);

    await expect(service.acceptRequest(99, 42)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.client.friendRequests.update).not.toHaveBeenCalled();
  });

  it("creates a request in transaction with advisory lock", async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({ id: 7, username: "sender" })
          .mockResolvedValueOnce({ id: 8 }),
      },
      friendRequests: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 100,
          senderId: 7,
          receiverId: 8,
          status: "pending",
          createdAt: new Date("2026-04-17T12:00:00.000Z"),
        }),
      },
    } as any;

    const prisma = {
      client: {
        $transaction: jest.fn().mockImplementation(async (fn: (t: any) => unknown) => fn(tx)),
      },
    } as any;

    const service = new FriendsService(prisma);
    const result = await service.sendRequest(7, 8);

    expect(prisma.client.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.friendRequests.create).toHaveBeenCalledWith({
      data: {
        senderId: 7,
        receiverId: 8,
        status: "pending",
        receiverReadAt: null,
      },
    });
    expect(result).toMatchObject({
      requestId: 100,
      senderUserId: 7,
      senderUsername: "sender",
      receiverUserId: 8,
      status: "pending",
    });
  });

  it("rejects declining non-pending request", async () => {
    const prisma = {
      client: {
        friendRequests: {
          findUnique: jest.fn().mockResolvedValue({
            id: 55,
            senderId: 10,
            receiverId: 11,
            status: "accepted",
          }),
          update: jest.fn(),
        },
      },
    } as any;

    const service = new FriendsService(prisma);

    await expect(service.declineRequest(11, 55)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.client.friendRequests.update).not.toHaveBeenCalled();
  });

  it("rejects creating duplicate pending request", async () => {
    const tx = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({ id: 7, username: "sender" })
          .mockResolvedValueOnce({ id: 8 }),
      },
      friendRequests: {
        findFirst: jest.fn().mockResolvedValue({
          id: 10,
          senderId: 8,
          receiverId: 7,
          status: "pending",
          createdAt: new Date("2026-04-17T11:00:00.000Z"),
        }),
        create: jest.fn(),
      },
    } as any;

    const prisma = {
      client: {
        $transaction: jest.fn().mockImplementation(async (fn: (t: any) => unknown) => fn(tx)),
      },
    } as any;

    const service = new FriendsService(prisma);

    await expect(service.sendRequest(7, 8)).rejects.toBeInstanceOf(ConflictException);
    expect(tx.friendRequests.create).not.toHaveBeenCalled();
  });
});
