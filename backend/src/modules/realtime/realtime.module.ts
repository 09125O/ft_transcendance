import { GameModule } from "@/modules/game/game.module";
import { RoomsModule } from "@/modules/rooms/rooms.module";
import { ScoresModule } from "@/modules/scores/scores.module";
import { UsersModule } from "@/modules/users/users.module";
import { Module } from "@nestjs/common";
import { RealtimeGateway } from "./realtime.gateway";
import { RealtimeGameEventsService } from "./services/realtime-game-events.service";
import { RealtimeGameRuntimeService } from "./services/realtime-game-runtime.service";
import { RealtimeAuthService } from "./services/realtime-auth.service";
import { RealtimePresenceService } from "./services/realtime-presence.service";
import { RealtimeResponseService } from "./services/realtime-response.service";
import { RealtimeRoomEventsService } from "./services/realtime-room-events.service";
import { RealtimeNotifierService } from "./services/realtime-notifier.service";
import { RealtimeValidationService } from "./services/realtime-validation.service";

@Module({
  imports: [RoomsModule, GameModule, ScoresModule, UsersModule],
  providers: [
    RealtimeGateway,
    RealtimeAuthService,
    RealtimeResponseService,
    RealtimeValidationService,
    RealtimePresenceService,
    RealtimeNotifierService,
    RealtimeGameRuntimeService,
    RealtimeGameEventsService,
    RealtimeRoomEventsService,
  ],
  exports: [RealtimeNotifierService, RealtimePresenceService],
})
export class RealtimeModule {}
