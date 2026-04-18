import { PrismaModule } from "@/prisma/prisma.module";
import { Module } from "@nestjs/common";
import { AuthGuard } from "../auth/guards/auth.guard";
import { QuizzesController } from "./quizzes.controller";
import { QuizzesService } from "./quizzes.service";

@Module({
  imports: [PrismaModule],
  controllers: [QuizzesController],
  providers: [QuizzesService, AuthGuard],
  exports: [QuizzesService],
})
export class QuizzesModule {}
