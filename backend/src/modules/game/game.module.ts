import { RoomsModule } from "@/modules/rooms/rooms.module";
import { Module } from "@nestjs/common";
import { AuthGuard } from "@/modules/auth/guards/auth.guard";
import { PrismaModule } from "@/prisma/prisma.module";
import { GameController } from "./game.controller";
import { GameService } from "./game.service";

@Module({
  imports: [RoomsModule, PrismaModule],
  controllers: [GameController],
  providers: [GameService, AuthGuard],
  exports: [GameService],
})
export class GameModule {}
