-- Add dismissible friend-request notifications and generic persisted notifications

ALTER TABLE "FriendRequests"
ADD COLUMN "receiverDeletedAt" TIMESTAMP(3);

CREATE TYPE "NotificationType" AS ENUM (
  'FRIEND_REQUEST_ACCEPTED',
  'FRIEND_REQUEST_DECLINED',
  'FRIEND_REMOVED'
);

CREATE TABLE "Notification" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_createdAt_idx"
ON "Notification"("userId", "createdAt");

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
