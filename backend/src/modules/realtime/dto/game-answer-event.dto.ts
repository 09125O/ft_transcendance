import { SubmitAnswerDto } from "@/modules/game/dto/submit-answer.dto";
import { IsInt, IsOptional, Min } from "class-validator";

export class GameAnswerEventDto extends SubmitAnswerDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;
}
