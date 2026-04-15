import { ApiExceptionFilter } from "@/common/http/api-exception.filter";
import { ok, type ApiResponse } from "@/common/http/api-response";
import { CurrentUser } from "@/modules/auth/decorators/current-user.decorator";
import { AuthGuard } from "@/modules/auth/guards/auth.guard";
import { AuthPayload } from "@/modules/auth/types/auth-payload.type";
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import { SubmitAnswerDto } from "./dto/submit-answer.dto";
import { GameService, GameState, SubmitAnswerResult } from "./game.service";

@Controller("game")
@UseFilters(ApiExceptionFilter)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get(":roomId/state")
  getState(
    @Param("roomId", ParseIntPipe) roomId: number,
  ): ApiResponse<GameState> {
    return ok(this.gameService.getRoomState(roomId));
  }

  @Post("answer")
  @UseGuards(AuthGuard)
  submitAnswer(
    @Body() dto: SubmitAnswerDto,
    @CurrentUser() auth: AuthPayload,
  ): ApiResponse<SubmitAnswerResult> {
    return ok(this.gameService.submitAnswer(dto, auth.sub));
  }
}
