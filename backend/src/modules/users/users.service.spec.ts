/// <reference types="jest" />

import { access, mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { BadRequestException } from "@nestjs/common";
import { AVATAR_UPLOADS_DIR, AVATAR_PUBLIC_PREFIX } from "./avatar-storage";
import { UsersService } from "./users.service";

describe("UsersService", () => {
  afterEach(async () => {
    await rm(AVATAR_UPLOADS_DIR, { recursive: true, force: true });
  });

  it("rejects profile update when no fields are provided", async () => {
    const prisma = {
      client: {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1,
            email: "user@test.com",
            username: "user",
            password: "hashed",
            status: "online",
            avatar_url: null,
            createdAt: new Date(),
          }),
        },
      },
    } as any;

    const service = new UsersService(prisma);

    await expect(service.updateProfile(1, {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it("updates username and status", async () => {
    const prisma = {
      client: {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1,
            email: "user@test.com",
            username: "current-name",
            password: "hashed",
            status: "offline",
            avatar_url: null,
            createdAt: new Date(),
          }),
          findFirst: jest.fn().mockResolvedValue(null),
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

  it("stores uploaded avatars under managed uploads", async () => {
    const prisma = {
      client: {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 7,
            email: "user@test.com",
            username: "player-seven",
            password: "hashed",
            status: "online",
            avatar_url: null,
            createdAt: new Date(),
          }),
          update: jest.fn().mockImplementation(async ({ data }: { data: { avatar_url: string } }) => ({
            id: 7,
            email: "user@test.com",
            username: "player-seven",
            password: "hashed",
            status: "online",
            avatar_url: data.avatar_url,
            createdAt: new Date(),
          })),
        },
      },
    } as any;

    const service = new UsersService(prisma);

    const result = await service.uploadAvatar(7, {
      buffer: Buffer.from("avatar-bytes"),
      mimetype: "image/png",
      originalname: "avatar.png",
      size: Buffer.byteLength("avatar-bytes"),
    });

    expect(result.avatar_url).toMatch(new RegExp(`^${AVATAR_PUBLIC_PREFIX}/user-7-`));

    const storedFileName = result.avatar_url?.split("/").pop();
    expect(storedFileName).toBeTruthy();
    await expect(access(join(AVATAR_UPLOADS_DIR, storedFileName as string))).resolves.toBeUndefined();
  });

  it("removes replaced managed avatars on profile update", async () => {
    await mkdir(AVATAR_UPLOADS_DIR, { recursive: true });
    const previousFileName = "user-1-previous.png";
    await writeFile(join(AVATAR_UPLOADS_DIR, previousFileName), "old-avatar");

    const prisma = {
      client: {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1,
            email: "user@test.com",
            username: "user",
            password: "hashed",
            status: "online",
            avatar_url: `${AVATAR_PUBLIC_PREFIX}/${previousFileName}`,
            createdAt: new Date(),
          }),
          update: jest.fn().mockResolvedValue({
            id: 1,
            email: "user@test.com",
            username: "user",
            password: "hashed",
            status: "online",
            avatar_url: null,
            createdAt: new Date(),
          }),
        },
      },
    } as any;

    const service = new UsersService(prisma);

    await service.updateProfile(1, {
      avatar_url: null,
    });

    await expect(access(join(AVATAR_UPLOADS_DIR, previousFileName))).rejects.toThrow();
  });
});
