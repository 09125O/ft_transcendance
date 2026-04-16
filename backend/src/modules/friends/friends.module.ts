import { PrismaModule } from "@/prisma/prisma.module";
import { RealtimeModule } from "@/modules/realtime/realtime.module";
import { Module } from "@nestjs/common";
import { AuthGuard } from "../auth/guards/auth.guard";
import { FriendsController } from "./friends.controller";
import { FriendsService } from "./friends.service";

@Module({
  imports: [PrismaModule, RealtimeModule],
  controllers: [FriendsController],
  providers: [FriendsService, AuthGuard],
  exports: [FriendsService],
})
export class FriendsModule {}
