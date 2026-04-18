import { ApiExceptionFilter } from "@/common/http/api-exception.filter";
import { ok, type ApiResponse } from "@/common/http/api-response";
import { CurrentUser } from "@/modules/auth/decorators/current-user.decorator";
import { AuthGuard } from "@/modules/auth/guards/auth.guard";
import { AuthPayload } from "@/modules/auth/types/auth-payload.type";
import { RealtimeNotifierService } from "@/modules/realtime/services/realtime-notifier.service";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import { CreateFriendRequestDto } from "./dto/create-friend-request.dto";
import {
  FriendRequestRecord,
  FriendListEntry,
  FriendRequestCreated,
  FriendRequestLists,
  FriendRequestUpdated,
  FriendsService,
} from "./friends.service";

@Controller("friends")
@UseFilters(ApiExceptionFilter)
@UseGuards(AuthGuard)
export class FriendsController {
  constructor(
    private readonly friendsService: FriendsService,
    private readonly notifier: RealtimeNotifierService,
  ) {}

  @Get()
  async listFriends(
    @CurrentUser() auth: AuthPayload,
  ): Promise<ApiResponse<FriendListEntry[]>> {
    return ok(await this.friendsService.listFriends(auth.sub));
  }

  @Get("requests")
  async listRequests(
    @CurrentUser() auth: AuthPayload,
  ): Promise<ApiResponse<FriendRequestLists>> {
    return ok(await this.friendsService.listRequests(auth.sub));
  }

  @Post("requests")
  async createRequest(
    @CurrentUser() auth: AuthPayload,
    @Body() dto: CreateFriendRequestDto,
  ): Promise<ApiResponse<FriendRequestCreated>> {
    const created = await this.friendsService.sendRequest(auth.sub, dto.receiverUserId);

    this.notifier.emitOkToUser(created.receiverUserId, "notification:new", {
      id: created.requestId,
      type: "FRIEND_REQUEST_RECEIVED",
      title: "Nouvelle demande d'ami",
      payload: {
        requestId: created.requestId,
        fromUserId: created.senderUserId,
        fromUsername: created.senderUsername,
      },
      read: false,
      createdAt: created.createdAt,
    });

    const syncPayload = {
      reason: "request_created",
      requestId: created.requestId,
      actorUserId: auth.sub,
    };

    this.notifier.emitOkToUser(created.receiverUserId, "friends:sync", syncPayload);
    this.notifier.emitOkToUser(auth.sub, "friends:sync", syncPayload);

    return ok(created);
  }

  @Post("requests/:requestId/accept")
  async acceptRequest(
    @CurrentUser() auth: AuthPayload,
    @Param("requestId", ParseIntPipe) requestId: number,
  ): Promise<ApiResponse<FriendRequestUpdated>> {
    const request = await this.friendsService.getRequestOrThrow(requestId);
    const updated = await this.friendsService.acceptRequest(auth.sub, requestId);
    this.emitFriendSyncToParticipants(request, "request_accepted", auth.sub);
    return ok(updated);
  }

  @Post("requests/:requestId/decline")
  async declineRequest(
    @CurrentUser() auth: AuthPayload,
    @Param("requestId", ParseIntPipe) requestId: number,
  ): Promise<ApiResponse<FriendRequestUpdated>> {
    const request = await this.friendsService.getRequestOrThrow(requestId);
    const updated = await this.friendsService.declineRequest(auth.sub, requestId);
    this.emitFriendSyncToParticipants(request, "request_declined", auth.sub);
    return ok(updated);
  }

  @Delete(":userId")
  async removeFriend(
    @CurrentUser() auth: AuthPayload,
    @Param("userId", ParseIntPipe) userId: number,
  ): Promise<ApiResponse<{ removed: true }>> {
    await this.friendsService.removeFriend(auth.sub, userId);
    const syncPayload = {
      reason: "friend_removed",
      actorUserId: auth.sub,
    };
    this.notifier.emitOkToUser(auth.sub, "friends:sync", syncPayload);
    this.notifier.emitOkToUser(userId, "friends:sync", syncPayload);
    return ok({ removed: true });
  }

  private emitFriendSyncToParticipants(
    request: FriendRequestRecord,
    reason: "request_accepted" | "request_declined",
    actorUserId: number,
  ): void {
    const payload = {
      reason,
      requestId: request.id,
      actorUserId,
    };

    this.notifier.emitOkToUser(request.senderId, "friends:sync", payload);
    this.notifier.emitOkToUser(request.receiverId, "friends:sync", payload);
  }
}
