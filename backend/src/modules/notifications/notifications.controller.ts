import { ApiExceptionFilter } from "@/common/http/api-exception.filter";
import { ok, type ApiResponse } from "@/common/http/api-response";
import { CurrentUser } from "@/modules/auth/decorators/current-user.decorator";
import { AuthGuard } from "@/modules/auth/guards/auth.guard";
import { AuthPayload } from "@/modules/auth/types/auth-payload.type";
import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import {
  NotificationList,
  NotificationsService,
} from "./notifications.service";

@Controller("notifications")
@UseFilters(ApiExceptionFilter)
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() auth: AuthPayload,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("cursor") cursor?: string,
  ): Promise<ApiResponse<NotificationList>> {
    return ok(await this.notificationsService.list(auth.sub, limit, cursor));
  }

  @Patch(":id/read")
  async markRead(
    @CurrentUser() auth: AuthPayload,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<ApiResponse<{ read: true }>> {
    return ok(await this.notificationsService.markRead(auth.sub, id));
  }

  @Patch("read-all")
  async markAllRead(
    @CurrentUser() auth: AuthPayload,
  ): Promise<ApiResponse<{ readAll: true }>> {
    return ok(await this.notificationsService.markAllRead(auth.sub));
  }
}
