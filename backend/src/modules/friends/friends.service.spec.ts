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
});
