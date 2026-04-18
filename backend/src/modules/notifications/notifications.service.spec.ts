/// <reference types="jest" />

import { NotificationsService } from "./notifications.service";

describe("NotificationsService", () => {
  it("returns merged notifications ordered by creation date", async () => {
    const prisma = {
      client: {
        friendRequests: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 12,
              sender: { id: 5, username: "alice" },
              receiverReadAt: null,
              createdAt: new Date("2026-04-16T10:00:00.000Z"),
            },
          ]),
        },
        notification: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 7,
              type: "FRIEND_REQUEST_ACCEPTED",
              title: "Demande d'ami acceptee",
              payload: { actorUserId: 9, actorUsername: "bob", requestId: 12 },
              readAt: null,
              createdAt: new Date("2026-04-16T12:00:00.000Z"),
            },
          ]),
        },
      },
    } as any;

    const service = new NotificationsService(prisma);
    const result = await service.list(7, 20);

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      id: -7,
      type: "FRIEND_REQUEST_ACCEPTED",
      read: false,
      dismissible: true,
    });
    expect(result.items[1]).toMatchObject({
      id: 12,
      type: "FRIEND_REQUEST_RECEIVED",
      read: false,
      dismissible: true,
      payload: {
        requestId: 12,
        fromUserId: 5,
        fromUsername: "alice",
      },
    });
  });

  it("marks a notification as read", async () => {
    const prisma = {
      client: {
        friendRequests: {
          findFirst: jest.fn().mockResolvedValue({ id: 12 }),
          update: jest.fn().mockResolvedValue({ id: 12 }),
        },
      },
    } as any;

    const service = new NotificationsService(prisma);
    await service.markRead(7, 12);
    expect(prisma.client.friendRequests.update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: {
        receiverReadAt: expect.any(Date),
      },
    });
  });

  it("deletes a persisted notification when its public id is negative", async () => {
    const prisma = {
      client: {
        notification: {
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      },
    } as any;

    const service = new NotificationsService(prisma);
    await service.remove(7, -5);

    expect(prisma.client.notification.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 5,
        userId: 7,
      },
    });
  });
});
