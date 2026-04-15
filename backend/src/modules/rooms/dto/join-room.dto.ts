import { IsOptional, IsString, MaxLength } from "class-validator";

export class JoinRoomDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  password?: string;
}
