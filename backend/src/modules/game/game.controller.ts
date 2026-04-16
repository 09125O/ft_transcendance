import { ApiExceptionFilter } from "@/common/http/api-exception.filter";
import { ok, type ApiResponse } from "@/common/http/api-response";
import { CurrentUser } from "@/modules/auth/decorators/current-user.decorator";
import { AuthGuard } from "@/modules/auth/guards/auth.guard";
import { AuthPayload } from "@/modules/auth/types/auth-payload.type";
import { RoomsService } from "@/modules/rooms/rooms.service";
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UnauthorizedException,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import { SubmitAnswerDto } from "./dto/submit-answer.dto";
import { GameService, GameState, SubmitAnswerResult } from "./game.service";

@Controller("game")
@UseFilters(ApiExceptionFilter)
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly roomsService: RoomsService,
  ) {}

  @Get(":roomId/state")
  @UseGuards(AuthGuard)
  async getState(
    @Param("roomId", ParseIntPipe) roomId: number,
    @CurrentUser() auth: AuthPayload,
  ): Promise<ApiResponse<GameState>> {
    const room = await this.roomsService.getById(roomId);
    const isRoomMember = room.players.some((player) => player.userId === auth.sub);

    if (!isRoomMember) {
      throw new UnauthorizedException("User is not in this room");
    }

    return ok(await this.gameService.getRoomState(roomId));
  }

  @Post("answer")
  @UseGuards(AuthGuard)
  async submitAnswer(
    @Body() dto: SubmitAnswerDto,
    @CurrentUser() auth: AuthPayload,
  ): Promise<ApiResponse<SubmitAnswerResult>> {
    return ok(await this.gameService.submitAnswer(dto, auth.sub));
  }
}
