import { PrismaService } from "@/prisma/prisma.service";
import { Prisma, User } from "@generated/prisma/client";
import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
    const data: Prisma.UserUpdateInput = {};

    if (typeof dto.username !== "undefined") {
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
      return await this.updateUser({
        where: { id: userId },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Username already exists");
      }

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
}
