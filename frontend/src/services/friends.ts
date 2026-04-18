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
  counterpartUserId: number;
  counterpartUsername: string;
  counterpartAvatarUrl: string | null;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
};

export type FriendRequestLists = {
  incoming: FriendRequestEntry[];
  outgoing: FriendRequestEntry[];
};

type RawFriendListEntry = {
  userId: number;
  username: string;
  avatar_url: string | null;
  status: "online" | "offline";
  since: string;
};

type RawFriendRequestEntry = {
  requestId: number;
  userId: number;
  username: string;
  avatar_url: string | null;
  status: "online" | "offline";
  createdAt: string;
};

type RawFriendRequestLists = {
  received: RawFriendRequestEntry[];
  sent: RawFriendRequestEntry[];
};

function mapFriend(rawFriend: RawFriendListEntry): FriendListEntry {
  return {
    userId: rawFriend.userId,
    username: rawFriend.username,
    avatarUrl: rawFriend.avatar_url,
    status: rawFriend.status,
    friendshipId: rawFriend.userId,
    friendsSince: rawFriend.since,
  };
}

function mapFriendRequest(rawRequest: RawFriendRequestEntry): FriendRequestEntry {
  return {
    id: rawRequest.requestId,
    counterpartUserId: rawRequest.userId,
    counterpartUsername: rawRequest.username,
    counterpartAvatarUrl: rawRequest.avatar_url,
    status: "pending",
    createdAt: rawRequest.createdAt,
  };
}

export async function listFriends(): Promise<FriendListEntry[]> {
  const friends = await apiRequest<RawFriendListEntry[]>("/friends");
  return friends.map(mapFriend);
}

export async function listRequests(): Promise<FriendRequestLists> {
  const requests = await apiRequest<RawFriendRequestLists>("/friends/requests");
  return {
    incoming: requests.received.map(mapFriendRequest),
    outgoing: requests.sent.map(mapFriendRequest),
  };
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
