import { ApiExceptionFilter } from "@/common/http/api-exception.filter";
import { ok, type ApiResponse } from "@/common/http/api-response";
import { CurrentUser } from "@/modules/auth/decorators/current-user.decorator";
import { AuthGuard } from "@/modules/auth/guards/auth.guard";
import { AuthPayload } from "@/modules/auth/types/auth-payload.type";
import { PublicUser } from "@/modules/auth/types/public-user.type";
import { User } from "@generated/prisma/client";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { SafeUser } from "../auth/types/safe-user.type";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UsersService } from "./users.service";

@Controller("users")
@UseFilters(ApiExceptionFilter)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @UseGuards(AuthGuard)
  async getMe(
    @CurrentUser() auth: AuthPayload,
  ): Promise<ApiResponse<SafeUser>> {
    const user = await this.usersService.findUser({ id: auth.sub });

    if (!user) {
      throw new NotFoundException(`Utilisateur ${auth.sub} introuvable`);
    }

    return ok(this.sanitizeUser(user));
  }

  @Patch("me")
  @UseGuards(AuthGuard)
  async updateMe(
    @CurrentUser() auth: AuthPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<ApiResponse<SafeUser>> {
    return ok(this.sanitizeUser(await this.usersService.updateProfile(auth.sub, dto)));
  }

  @Post("me/avatar")
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor("avatar"))
  async uploadAvatar(
    @CurrentUser() auth: AuthPayload,
    @UploadedFile()
    file?:
      | {
          buffer: Buffer;
          mimetype: string;
          originalname: string;
          size: number;
        }
      | undefined,
  ): Promise<ApiResponse<SafeUser>> {
    if (!file) {
      throw new BadRequestException("Le fichier d'avatar est requis");
    }

    return ok(this.sanitizeUser(await this.usersService.uploadAvatar(auth.sub, file)));
  }

  @Get(":id")
  @UseGuards(AuthGuard)
  async getById(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<ApiResponse<PublicUser>> {
    const user = await this.usersService.findUser({ id });

    if (!user) {
      throw new NotFoundException(`Utilisateur ${id} introuvable`);
    }

    return ok(this.sanitizePublicUser(user));
  }

  @Get("lookup/:identifier")
  @UseGuards(AuthGuard)
  async getByIdentifier(
    @Param("identifier") identifier: string,
  ): Promise<ApiResponse<PublicUser>> {
    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier) {
      throw new BadRequestException("L'identifiant ne doit pas être vide");
    }

    const user = await this.usersService.findUserByIdentifier(normalizedIdentifier);

    if (!user) {
      throw new NotFoundException(`Utilisateur ${normalizedIdentifier} introuvable`);
    }

    return ok(this.sanitizePublicUser(user));
  }

  private sanitizeUser(user: User): SafeUser {
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  private sanitizePublicUser(user: User): PublicUser {
    const { password: _password, email: _email, ...publicUser } = user;
    return publicUser;
  }
}
