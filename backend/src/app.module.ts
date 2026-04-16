import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { HttpThrottlerGuard } from "./common/http/http-throttler.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { GameModule } from "./modules/game/game.module";
import { QuizzesModule } from "./modules/quizzes/quizzes.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";
import { RoomsModule } from "./modules/rooms/rooms.module";
import { ScoresModule } from "./modules/scores/scores.module";
import { UsersModule } from "./modules/users/users.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    AuthModule,
    UsersModule,
    PrismaModule,
    RoomsModule,
    GameModule,
    QuizzesModule,
    ScoresModule,
    RealtimeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: HttpThrottlerGuard,
    },
  ],
})
export class AppModule {}
