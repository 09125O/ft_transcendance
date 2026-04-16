-- Persist notification read state for friend-request notifications

ALTER TABLE "FriendRequests"
ADD COLUMN "receiverReadAt" TIMESTAMP(3);
