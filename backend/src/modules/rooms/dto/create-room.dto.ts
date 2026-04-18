import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";

export class CreateRoomDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  name: string;

  @IsInt()
  @Min(1)
  @Max(20)
  rounds: number;

  @IsOptional()
  @IsInt()
  @Min(5000)
  @Max(30000)
  questionDurationMs?: number;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ValidateIf((dto: CreateRoomDto) => dto.isPrivate === true)
  @IsString()
  @MinLength(4)
  @MaxLength(64)
  password?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quizId?: number;
}
