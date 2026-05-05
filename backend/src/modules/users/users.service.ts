import { PrismaService } from "@/prisma/prisma.service";
import { Prisma, User } from "@generated/prisma/client";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { mkdir, rm, writeFile } from "fs/promises";
import { extname } from "path";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import {
  ALLOWED_AVATAR_MIME_TYPES,
  AVATAR_PUBLIC_PREFIX,
  AVATAR_UPLOADS_DIR,
  MAX_AVATAR_FILE_SIZE_BYTES,
  isManagedAvatarUrl,
  resolveManagedAvatarPath,
} from "./avatar-storage";

type AvatarUploadInput = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertUsernameAvailable(
    username: string,
    excludedUserId?: number,
  ): Promise<void> {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      return;
    }

    const existingUser = await this.prisma.client.user.findFirst({
      where: {
        username: {
          equals: trimmedUsername,
          mode: "insensitive",
        },
        ...(typeof excludedUserId === "number"
          ? {
              id: {
                not: excludedUserId,
              },
            }
          : {}),
      },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException("Username already exists");
    }
  }

  async findUserByIdentifier(identifier: string): Promise<User | null> {
    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier) {
      return null;
    }

    if (/^\d+$/.test(normalizedIdentifier)) {
      const parsedId = Number(normalizedIdentifier);
      if (!Number.isSafeInteger(parsedId) || parsedId <= 0) {
        return null;
      }

      return this.findUser({ id: parsedId });
    }

    const users = await this.findUsers({
      where: {
        username: {
          equals: normalizedIdentifier,
          mode: "insensitive",
        },
      },
      orderBy: {
        id: "asc",
      },
      take: 1,
    });

    return users[0] ?? null;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<User> {
    const currentUser = await this.findUser({ id: userId });
    if (!currentUser) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const data: Prisma.UserUpdateInput = {};

    if (typeof dto.username !== "undefined") {
      await this.assertUsernameAvailable(dto.username, userId);
      data.username = dto.username;
    }
    if (typeof dto.avatar_url !== "undefined") {
      data.avatar_url = dto.avatar_url;
    }
    if (typeof dto.status !== "undefined") {
      data.status = dto.status;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException("At least one profile field must be provided");
    }

    try {
      const updatedUser = await this.updateUser({
        where: { id: userId },
        data,
      });
      await this.deleteManagedAvatarIfReplaced(
        currentUser.avatar_url,
        updatedUser.avatar_url,
      );
      return updatedUser;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Username already exists");
      }

      throw error;
    }
  }

  async uploadAvatar(userId: number, file: AvatarUploadInput): Promise<User> {
    const currentUser = await this.findUser({ id: userId });
    if (!currentUser) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    this.validateAvatarFile(file);

    await mkdir(AVATAR_UPLOADS_DIR, { recursive: true });

    const fileExtension = this.resolveAvatarExtension(file);
    const fileName = `user-${userId}-${randomUUID()}${fileExtension}`;
    const filePath = `${AVATAR_UPLOADS_DIR}/${fileName}`;
    const avatarUrl = `${AVATAR_PUBLIC_PREFIX}/${fileName}`;

    await writeFile(filePath, file.buffer);

    try {
      const updatedUser = await this.updateUser({
        where: { id: userId },
        data: {
          avatar_url: avatarUrl,
        },
      });
      await this.deleteManagedAvatarIfReplaced(
        currentUser.avatar_url,
        updatedUser.avatar_url,
      );
      return updatedUser;
    } catch (error) {
      await rm(filePath, { force: true });
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.findUser({ email });
  }

  async findUser(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.client.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async findUsers(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.client.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    await this.assertUsernameAvailable(data.username);
    return this.prisma.client.user.create({
      data,
    });
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;

    return this.prisma.client.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.client.user.delete({
      where,
    });
  }

  private validateAvatarFile(file: AvatarUploadInput): void {
    if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
      throw new BadRequestException("Avatar file is required");
    }

    if (!ALLOWED_AVATAR_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException("Avatar format must be JPEG, PNG, WebP or GIF");
    }

    if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
      throw new BadRequestException("Avatar file must be 2 MB or smaller");
    }
  }

  private resolveAvatarExtension(file: AvatarUploadInput): string {
    const explicitExtension = extname(file.originalname).toLowerCase();
    if (explicitExtension === ".jpg" || explicitExtension === ".jpeg") {
      return ".jpg";
    }
    if (
      explicitExtension === ".png" ||
      explicitExtension === ".webp" ||
      explicitExtension === ".gif"
    ) {
      return explicitExtension;
    }

    switch (file.mimetype) {
      case "image/jpeg":
        return ".jpg";
      case "image/png":
        return ".png";
      case "image/webp":
        return ".webp";
      case "image/gif":
        return ".gif";
      default:
        return ".img";
    }
  }

  private async deleteManagedAvatarIfReplaced(
    previousAvatarUrl: string | null,
    nextAvatarUrl: string | null,
  ): Promise<void> {
    if (
      !isManagedAvatarUrl(previousAvatarUrl) ||
      previousAvatarUrl === nextAvatarUrl
    ) {
      return;
    }

    await rm(resolveManagedAvatarPath(previousAvatarUrl), { force: true });
  }
}
