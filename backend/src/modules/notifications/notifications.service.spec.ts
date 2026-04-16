/// <reference types="jest" />

import { NotificationsService } from "./notifications.service";

describe("NotificationsService", () => {
  it("returns friend-request notifications", async () => {
    const prisma = {
      client: {
        friendRequests: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 12,
              sender: { id: 5, username: "alice" },
              createdAt: new Date("2026-04-16T10:00:00.000Z"),
            },
          ]),
        },
      },
    } as any;

    const service = new NotificationsService(prisma);
    const result = await service.list(7, 20);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 12,
      type: "FRIEND_REQUEST_RECEIVED",
      read: false,
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
        },
      },
    } as any;

    const service = new NotificationsService(prisma);
    await service.markRead(7, 12);

    const listed = await (service as any).toNotification(
      7,
      12,
      5,
      "alice",
      new Date("2026-04-16T10:00:00.000Z"),
    );
    expect(listed.read).toBe(true);
  });
});
