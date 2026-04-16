import { PrismaModule } from "@/prisma/prisma.module";
import { Module } from "@nestjs/common";
import { ScoresController } from "./scores.controller";
import { ScoresService } from "./scores.service";

@Module({
  imports: [PrismaModule],
  controllers: [ScoresController],
  providers: [ScoresService],
  exports: [ScoresService],
})
export class ScoresModule {}
