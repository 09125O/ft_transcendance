import { Module } from "@nestjs/common";
import { AuthGuard } from "@/modules/auth/guards/auth.guard";
import { PrismaModule } from "@/prisma/prisma.module";
import { RoomsController } from "./rooms.controller";
import { RoomsService } from "./rooms.service";

@Module({
  imports: [PrismaModule],
  controllers: [RoomsController],
  providers: [RoomsService, AuthGuard],
  exports: [RoomsService],
})
export class RoomsModule {}
