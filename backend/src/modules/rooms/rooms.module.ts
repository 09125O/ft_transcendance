import { Module } from "@nestjs/common";
import { AuthGuard } from "@/modules/auth/guards/auth.guard";
import { RoomsController } from "./rooms.controller";
import { RoomsService } from "./rooms.service";

@Module({
  controllers: [RoomsController],
  providers: [RoomsService, AuthGuard],
  exports: [RoomsService],
})
export class RoomsModule {}
