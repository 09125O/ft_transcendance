-- Persist rooms/game/scores in database instead of runtime JSON files

ALTER TABLE "Room" DROP CONSTRAINT "Room_ownerId_fkey";

ALTER TABLE "Room"
ALTER COLUMN "ownerId" DROP NOT NULL,
ADD COLUMN "rounds" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "passwordHash" TEXT;

ALTER TABLE "Room"
ADD CONSTRAINT "Room_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "RoomGameState" (
    "roomId" INTEGER NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'waiting',
    "currentQuestionId" INTEGER,
    "currentQuestionNumber" INTEGER NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 1,
    "questionDurationMs" INTEGER,
    "questionStartedAt" TIMESTAMP(3),
    "questionEndsAt" TIMESTAMP(3),
    "answersForCurrentQuestion" INTEGER NOT NULL DEFAULT 0,
    "totalAnswers" INTEGER NOT NULL DEFAULT 0,
    "winnerUserId" INTEGER,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "answeredByQuestion" JSONB,
    "scoresByUser" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomGameState_pkey" PRIMARY KEY ("roomId")
);

CREATE TABLE "UserAggregateScore" (
    "userId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAggregateScore_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "RoomGameState"
ADD CONSTRAINT "RoomGameState_roomId_fkey"
FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserAggregateScore"
ADD CONSTRAINT "UserAggregateScore_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
