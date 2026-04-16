/// <reference types="jest" />

import { BadRequestException } from "@nestjs/common";
import { UsersService } from "./users.service";

describe("UsersService", () => {
  it("rejects profile update when no fields are provided", async () => {
    const service = new UsersService({} as any);

    await expect(service.updateProfile(1, {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it("updates username and status", async () => {
    const prisma = {
      client: {
        user: {
          update: jest.fn().mockResolvedValue({
            id: 1,
            email: "user@test.com",
            username: "new-name",
            password: "hashed",
            status: "online",
            avatar_url: null,
            createdAt: new Date(),
          }),
        },
      },
    } as any;

    const service = new UsersService(prisma);

    const result = await service.updateProfile(1, {
      username: "new-name",
      status: "online" as any,
    });

    expect(prisma.client.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        username: "new-name",
        status: "online",
      },
    });
    expect(result.username).toBe("new-name");
  });
});
