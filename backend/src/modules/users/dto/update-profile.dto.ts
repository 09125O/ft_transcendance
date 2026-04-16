import { UserStatus } from "@generated/prisma/client";
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  username?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && typeof value !== "undefined")
  @IsUrl()
  avatar_url?: string | null;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
