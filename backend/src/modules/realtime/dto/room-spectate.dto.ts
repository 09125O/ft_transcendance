import { IsInt, IsOptional, Min } from "class-validator";

export class RoomSpectateDto {
  @IsInt()
  @Min(1)
  roomId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;
}
