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
import { CreateRoomDto } from "./dto/create-room.dto";
import { JoinRoomDto } from "./dto/join-room.dto";
import { Room, RoomsService } from "./rooms.service";

@Controller("rooms")
@UseFilters(ApiExceptionFilter)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  async list(): Promise<ApiResponse<Array<Omit<Room, "passwordHash">>>> {
    return ok(await this.roomsService.list());
  }

  @Get(":roomId")
  async getById(
    @Param("roomId", ParseIntPipe) roomId: number,
  ): Promise<ApiResponse<Omit<Room, "passwordHash">>> {
    return ok(await this.roomsService.getById(roomId));
  }

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Body() dto: CreateRoomDto,
    @CurrentUser() auth: AuthPayload,
  ): Promise<ApiResponse<Omit<Room, "passwordHash">>> {
    return ok(
      await this.roomsService.create({
        ...dto,
        ownerUserId: auth.sub,
      }),
    );
  }

  @Post(":roomId/join")
  @UseGuards(AuthGuard)
  async join(
    @Param("roomId", ParseIntPipe) roomId: number,
    @Body() dto: JoinRoomDto,
    @CurrentUser() auth: AuthPayload,
  ): Promise<ApiResponse<Omit<Room, "passwordHash">>> {
    return ok(await this.roomsService.join(roomId, auth.sub, dto.password));
  }
}
