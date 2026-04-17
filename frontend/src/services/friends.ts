import { apiRequest } from "./api";

export type FriendListEntry = {
  userId: number;
  username: string;
  avatarUrl: string | null;
  status: "online" | "offline";
  friendshipId: number;
  friendsSince: string;
};

export type FriendRequestEntry = {
  id: number;
  senderUserId: number;
  receiverUserId: number;
  counterpartUserId: number;
  counterpartUsername: string;
  counterpartAvatarUrl: string | null;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  updatedAt: string;
};

export type FriendRequestLists = {
  incoming: FriendRequestEntry[];
  outgoing: FriendRequestEntry[];
};

export function listFriends(): Promise<FriendListEntry[]> {
  return apiRequest<FriendListEntry[]>("/friends");
}

export function listRequests(): Promise<FriendRequestLists> {
  return apiRequest<FriendRequestLists>("/friends/requests");
}

export function sendFriendRequest(receiverUserId: number) {
  return apiRequest("/friends/requests", {
    method: "POST",
    body: JSON.stringify({ receiverUserId }),
  });
}

export function acceptRequest(requestId: number) {
  return apiRequest(`/friends/requests/${requestId}/accept`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function declineRequest(requestId: number) {
  return apiRequest(`/friends/requests/${requestId}/decline`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function removeFriend(userId: number) {
  return apiRequest(`/friends/${userId}`, { method: "DELETE" });
}
