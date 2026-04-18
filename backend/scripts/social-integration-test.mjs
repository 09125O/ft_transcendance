#!/usr/bin/env node

import {
  connectAuthenticatedSocket,
  createAuthenticatedSession,
  fail,
  pass,
  safeDisconnect,
  waitForEvent,
} from "./ws-smoke-helpers.mjs";

const BACKEND_PORT = Number(process.env.BACKEND_PORT || 4000);
const BACKEND_HOST = process.env.BACKEND_HOST || "localhost";
const BASE_URL = process.env.WS_BASE_URL || `https://${BACKEND_HOST}:${BACKEND_PORT}`;
const WS_NAMESPACE = `${BASE_URL}/ws`;

async function requestJson(path, { method = "GET", cookieHeader, body } = {}) {
  const headers = {
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    ...(body ? { "Content-Type": "application/json" } : {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let json;
  try {
    json = await response.json();
  } catch {
    // Ignore non-JSON responses to preserve the HTTP status for assertions.
  }

  return {
    status: response.status,
    json,
    headers: response.headers,
  };
}

async function getSessionUserId(cookieHeader, label) {
  const response = await requestJson("/auth/session", { cookieHeader });
  if (response.status !== 200 || response?.json?.success !== true) {
    fail(`Failed to resolve session for ${label} (${response.status})`);
  }

  const userId = response?.json?.data?.id;
  if (typeof userId !== "number") {
    fail(`Missing session user id for ${label}`);
  }

  return userId;
}

function isFriendRequestConflict(result) {
  if (result.status !== "fulfilled") {
    return false;
  }

  const response = result.value;
  return response.status === 409;
}

function isFriendRequestSuccess(result) {
  if (result.status !== "fulfilled") {
    return false;
  }

  const response = result.value;
  return response.status >= 200 && response.status < 300 && response?.json?.success === true;
}

async function main() {
  const senderSession = await createAuthenticatedSession(BASE_URL, "social-sender");
  const receiverSession = await createAuthenticatedSession(BASE_URL, "social-receiver");

  const senderUserId = await getSessionUserId(senderSession.cookieHeader, "sender");
  const receiverUserId = await getSessionUserId(receiverSession.cookieHeader, "receiver");

  // Verify anti-race behavior with opposite concurrent requests.
  const raceResults = await Promise.allSettled([
    requestJson("/friends/requests", {
      method: "POST",
      cookieHeader: senderSession.cookieHeader,
      body: { receiverUserId },
    }),
    requestJson("/friends/requests", {
      method: "POST",
      cookieHeader: receiverSession.cookieHeader,
      body: { receiverUserId: senderUserId },
    }),
  ]);

  const successCount = raceResults.filter(isFriendRequestSuccess).length;
  const conflictCount = raceResults.filter(isFriendRequestConflict).length;

  if (successCount !== 1 || conflictCount !== 1) {
    fail("Friend request anti-race failed (expected one success and one 409 conflict)");
  }

  pass("Friend request anti-race OK");

  const notificationsBeforeRead = await requestJson("/notifications?limit=10", {
    cookieHeader: receiverSession.cookieHeader,
  });

  if (notificationsBeforeRead.status !== 200 || notificationsBeforeRead?.json?.success !== true) {
    fail(`Failed to fetch notifications (${notificationsBeforeRead.status})`);
  }

  const firstNotification = notificationsBeforeRead?.json?.data?.items?.[0];
  if (!firstNotification || firstNotification.type !== "FRIEND_REQUEST_RECEIVED") {
    fail("Missing FRIEND_REQUEST_RECEIVED notification");
  }

  if (firstNotification.read !== false) {
    fail("Notification should be unread before markRead");
  }

  const markRead = await requestJson(`/notifications/${firstNotification.id}/read`, {
    method: "PATCH",
    cookieHeader: receiverSession.cookieHeader,
  });

  if (markRead.status !== 200 || markRead?.json?.success !== true) {
    fail(`Failed to mark notification as read (${markRead.status})`);
  }

  const notificationsAfterRead = await requestJson("/notifications?limit=10", {
    cookieHeader: receiverSession.cookieHeader,
  });

  if (notificationsAfterRead?.json?.data?.items?.[0]?.read !== true) {
    fail("Notification should be read after markRead");
  }

  pass("Notifications read state persistence OK");

  const deletePendingNotification = await requestJson(
    `/notifications/${firstNotification.id}`,
    {
      method: "DELETE",
      cookieHeader: receiverSession.cookieHeader,
    },
  );

  if (deletePendingNotification.status !== 200 || deletePendingNotification?.json?.success !== true) {
    fail(`Failed to delete pending notification (${deletePendingNotification.status})`);
  }

  const notificationsAfterDelete = await requestJson("/notifications?limit=10", {
    cookieHeader: receiverSession.cookieHeader,
  });

  const deletedPendingStillVisible = notificationsAfterDelete?.json?.data?.items?.some(
    (entry) => entry.id === firstNotification.id,
  );

  if (deletedPendingStillVisible) {
    fail("Pending notification should disappear after delete");
  }

  pass("Pending notifications can be deleted without removing the request");

  const requestLists = await requestJson("/friends/requests", {
    cookieHeader: receiverSession.cookieHeader,
  });

  const pendingRequest = requestLists?.json?.data?.received?.find(
    (entry) => entry.userId === senderUserId,
  );
  if (!pendingRequest) {
    fail("Pending friend request not found for receiver");
  }

  const acceptResponse = await requestJson(
    `/friends/requests/${pendingRequest.requestId}/accept`,
    {
      method: "POST",
      cookieHeader: receiverSession.cookieHeader,
    },
  );

  if (acceptResponse.status !== 201 && acceptResponse.status !== 200) {
    fail(`Failed to accept friend request (${acceptResponse.status})`);
  }

  const senderFriends = await requestJson("/friends", {
    cookieHeader: senderSession.cookieHeader,
  });
  const receiverFriends = await requestJson("/friends", {
    cookieHeader: receiverSession.cookieHeader,
  });

  const senderHasReceiver = senderFriends?.json?.data?.some(
    (entry) => entry.userId === receiverUserId,
  );
  const receiverHasSender = receiverFriends?.json?.data?.some(
    (entry) => entry.userId === senderUserId,
  );

  if (!senderHasReceiver || !receiverHasSender) {
    fail("Friend relation missing after accept");
  }

  pass("Friends acceptance flow OK");

  const senderNotifications = await requestJson("/notifications?limit=10", {
    cookieHeader: senderSession.cookieHeader,
  });

  const acceptedNotification = senderNotifications?.json?.data?.items?.find(
    (entry) => entry.type === "FRIEND_REQUEST_ACCEPTED",
  );

  if (!acceptedNotification) {
    fail("Missing FRIEND_REQUEST_ACCEPTED notification for sender");
  }

  const deleteAcceptedNotification = await requestJson(
    `/notifications/${acceptedNotification.id}`,
    {
      method: "DELETE",
      cookieHeader: senderSession.cookieHeader,
    },
  );

  if (
    deleteAcceptedNotification.status !== 200 ||
    deleteAcceptedNotification?.json?.success !== true
  ) {
    fail(
      `Failed to delete accepted notification (${deleteAcceptedNotification.status})`,
    );
  }

  pass("Persisted notifications can be deleted after accept");

  const roomCreate = await requestJson("/rooms", {
    method: "POST",
    cookieHeader: senderSession.cookieHeader,
    body: {
      name: `Spectator Test ${Date.now()}`,
      rounds: 3,
      isPrivate: false,
    },
  });

  if (roomCreate.status !== 201 || roomCreate?.json?.success !== true) {
    fail(`Failed to create room for spectator scenario (${roomCreate.status})`);
  }

  const roomId = roomCreate?.json?.data?.id;
  if (typeof roomId !== "number") {
    fail("Missing roomId in room create response");
  }

  const { socket } = await connectAuthenticatedSocket(
    WS_NAMESPACE,
    receiverSession.cookieHeader,
  );

  try {
    const spectatedPromise = waitForEvent(
      socket,
      "room:spectated",
      (payload) => payload?.success === true && payload?.data?.roomId === roomId,
    );
    const spectatorsUpdatePromise = waitForEvent(
      socket,
      "room:spectators:update",
      (payload) => payload?.success === true && payload?.data?.roomId === roomId,
    );

    socket.emit("room:spectate", { roomId, userId: receiverUserId });

    await spectatedPromise;
    await spectatorsUpdatePromise;

    const startErrorPromise = waitForEvent(
      socket,
      "room:start:error",
      (payload) => payload?.success === false && payload?.error?.code === "UNAUTHORIZED",
    );

    socket.emit("room:start", { roomId, userId: receiverUserId });
    await startErrorPromise;

    pass("Spectator restrictions over WS OK");
  } finally {
    safeDisconnect(socket);
  }
}

main()
  .then(() => {
    console.log("[OK] Social integration flow validated");
  })
  .catch((error) => {
    console.error(`[KO] ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
