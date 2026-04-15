import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class ChatMessageDto {
  @IsInt()
  @Min(1)
  roomId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content: string;
}
