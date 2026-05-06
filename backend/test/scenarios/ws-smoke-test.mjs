#!/usr/bin/env node
import {
  connectAuthenticatedSocket,
  createAuthenticatedSession,
  createSocket,
  fail,
  pass,
  safeDisconnect,
  waitForEvent,
} from "./ws-smoke-helpers.mjs";

const BACKEND_PORT = Number(process.env.BACKEND_PORT || 4000);
const BACKEND_HOST = process.env.BACKEND_HOST || "localhost";
const APP_PROTOCOL =
  process.env.APP_PROTOCOL === "https" ||
  process.env.FRONTEND_ORIGIN?.startsWith("https://")
    ? "https"
    : "http";
const WS_BASE_URL =
  process.env.WS_BASE_URL || `${APP_PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;
const WS_NAMESPACE_URL = `${WS_BASE_URL}/ws`;
const TEST_QUIZ_ANSWER_INDEX = 1;
const WS_SMOKE_QUIZ_TITLE = "__WS_SMOKE_DO_NOT_USE__";
const ROOM_RECONNECT_GRACE_MS = Number(process.env.ROOM_RECONNECT_GRACE_MS || 10000);
const DISCONNECT_EVENT_TIMEOUT_MS = Math.max(25000, ROOM_RECONNECT_GRACE_MS + 12000);

function section(title) {
  console.log(`\n== ${title} ==`);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printTestCatalog() {
  console.log("\nTypologies de test executees:");
  console.log(" - test websocket auth");
  console.log(" - test websocket room lifecycle");
  console.log(" - test websocket room private rest/ws coherence");
  console.log(" - test websocket game flow");
  console.log(" - test websocket rest coherence");
  console.log(" - test websocket disconnect cleanup");
}

async function run() {
  console.log("== WS smoke test Back 3 ==");
  console.log(`Namespace: ${WS_NAMESPACE_URL}`);
  printTestCatalog();
  const sockets = [];
  try {
    section("test websocket auth");
    const anonymous = createSocket(WS_NAMESPACE_URL);
    try {
      const authErrorPromise = Promise.race([
        waitForEvent(
          anonymous,
          "ws:auth:error",
          (payload) =>
            payload?.success === false &&
            payload?.error?.code === "UNAUTHORIZED",
        ),
        waitForEvent(anonymous, "connect_error", () => true),
      ]);
      anonymous.connect();
      await authErrorPromise;
      pass("Connexion anonyme refusee");
    } finally {
      safeDisconnect(anonymous);
    }
    const ownerSession = await createAuthenticatedSession(WS_BASE_URL, "owner");
    const guestSession = await createAuthenticatedSession(WS_BASE_URL, "guest");
    const thirdSession = await createAuthenticatedSession(WS_BASE_URL, "third");
    const outsiderSession = await createAuthenticatedSession(WS_BASE_URL, "outsider");
    const owner = await connectAuthenticatedSocket(WS_NAMESPACE_URL, ownerSession.cookieHeader);
    pass(`Connexion WS OK (owner, userId=${owner.userId})`);
    const guest = await connectAuthenticatedSocket(WS_NAMESPACE_URL, guestSession.cookieHeader);
    pass(`Connexion WS OK (guest, userId=${guest.userId})`);
    const third = await connectAuthenticatedSocket(WS_NAMESPACE_URL, thirdSession.cookieHeader);
    pass(`Connexion WS OK (third, userId=${third.userId})`);
    const outsider = await connectAuthenticatedSocket(
      WS_NAMESPACE_URL,
      outsiderSession.cookieHeader,
    );
    pass(`Connexion WS OK (outsider, userId=${outsider.userId})`);
    const quizId = await ensureQuizId(WS_BASE_URL, ownerSession.cookieHeader);

    section("test websocket room lifecycle");
    sockets.push(owner.socket, guest.socket, third.socket, outsider.socket);
    const roomId = await createRoomWithOwner(owner, quizId);
    await assertOutsiderCannotChat(outsider, roomId);
    await joinRoomAsGuest(guest, roomId);
    await joinRoomAsGuest(third, roomId);
    await assertGuestCannotStartRoom(guest, roomId);

    section("test websocket room private rest/ws coherence");
    await ensurePrivateRoomFriendship(
      WS_BASE_URL,
      owner.userId,
      guest.userId,
      ownerSession.cookieHeader,
      guestSession.cookieHeader,
    );
    await assertPrivateRoomRestJoinThenWsChat(
      owner,
      guest,
      quizId,
      WS_BASE_URL,
      guestSession.cookieHeader,
    );

    section("test websocket game flow");
    const questionId = await startRoomAsOwnerAndGetQuestion(owner, roomId);
    await submitAndValidateAnswer(guest, roomId, questionId);
    await assertDuplicateAnswerConflict(guest, roomId, questionId);
    await assertTimerCompletesGame(guest, roomId);

    section("test websocket rest coherence");
    await assertScoresLeaderboard(WS_BASE_URL, guest.userId);

    section("test websocket disconnect cleanup");
    await assertDisconnectUpdatesRoomState(owner, guest, roomId);
    safeDisconnect(third.socket);
    await assertRoomClosedAfterLastDisconnect(guest, outsider, roomId);
    pass("WS smoke test termine avec succes");
  } finally {
    for (const socket of sockets) safeDisconnect(socket);
  }
}

async function createRoomWithOwner(owner, quizId) {
  const roomCreatedPromise = waitForEvent(
    owner.socket,
    "room:created",
    (payload) => payload?.success === true && typeof payload?.data?.id === "number",
  );
  const roomCreateErrorPromise = waitForEvent(
    owner.socket,
    "room:create:error",
    (payload) => payload?.success === false,
  );
  owner.socket.emit("room:create", {
    quizId,
    name: `WS Smoke ${Date.now()}`,
    rounds: 1,
    isPrivate: false,
  });
  const roomCreated = await Promise.race([
    roomCreatedPromise,
    roomCreateErrorPromise.then((payload) => {
      const code = payload?.error?.code ?? "UNKNOWN";
      const message = payload?.error?.message ?? "Unknown room:create error";
      fail(`room:create failed (${code}) ${message}`);
    }),
  ]);
  const roomId = roomCreated?.data?.id;
  if (typeof roomId !== "number") fail("room:created payload missing room id");
  if (roomCreated?.data?.ownerUserId !== owner.userId) fail("room owner mismatch");
  pass(`Room creee par owner (id=${roomId})`);
  return roomId;
}

async function assertOutsiderCannotChat(outsider, roomId) {
  const chatErrorPromise = waitForEvent(
    outsider.socket,
    "chat:message:error",
    (payload) => payload?.success === false && payload?.error?.code === "UNAUTHORIZED",
  );
  outsider.socket.emit("chat:message", {
    roomId,
    userId: outsider.userId,
    content: "intrusion",
  });
  await chatErrorPromise;
  pass("Membership chat protege (outsider refuse)");
}

async function joinRoomAsGuest(guest, roomId) {
  const joinPromise = waitForEvent(
    guest.socket,
    "room:joined",
    (payload) => payload?.success === true && payload?.data?.id === roomId,
  );
  guest.socket.emit("room:join", { roomId, userId: guest.userId });
  await joinPromise;
  pass("Guest rejoint la room");
}

async function assertGuestCannotStartRoom(guest, roomId) {
  const startErrorPromise = waitForEvent(
    guest.socket,
    "room:start:error",
    (payload) => payload?.success === false && payload?.error?.code === "UNAUTHORIZED",
  );
  guest.socket.emit("room:start", { roomId, userId: guest.userId });
  await startErrorPromise;
  pass("Droit owner sur room:start valide");
}

async function assertPrivateRoomRestJoinThenWsChat(
  owner,
  guest,
  quizId,
  baseUrl,
  guestCookieHeader,
) {
  const password = "secret-private-room";
  const roomCreatedPromise = waitForEvent(
    owner.socket,
    "room:created",
    (payload) => payload?.success === true && payload?.data?.isPrivate === true,
  );
  const roomCreateErrorPromise = waitForEvent(
    owner.socket,
    "room:create:error",
    (payload) => payload?.success === false,
  );
  owner.socket.emit("room:create", {
    quizId,
    name: `Private WS Smoke ${Date.now()}`,
    rounds: 1,
    isPrivate: true,
    password,
  });

  const roomCreated = await Promise.race([
    roomCreatedPromise,
    roomCreateErrorPromise.then((payload) => {
      const code = payload?.error?.code ?? "UNKNOWN";
      const message = payload?.error?.message ?? "Unknown room:create error";
      fail(`private room:create failed (${code}) ${message}`);
    }),
  ]);
  const roomId = roomCreated?.data?.id;
  if (typeof roomId !== "number") {
    fail("Private room creation failed");
  }

  const joinResponse = await fetch(`${baseUrl}/rooms/${roomId}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: guestCookieHeader,
    },
    body: JSON.stringify({
      password,
    }),
  });
  if (!joinResponse.ok) {
    fail(`REST private room join failed (${joinResponse.status})`);
  }

  const wsJoinPromise = waitForEvent(
    guest.socket,
    "room:joined",
    (payload) => payload?.success === true && payload?.data?.id === roomId,
  );
  guest.socket.emit("room:join", { roomId, userId: guest.userId });
  await wsJoinPromise;

  const chatPromise = waitForEvent(
    guest.socket,
    "chat:message",
    (payload) =>
      payload?.success === true &&
      payload?.data?.roomId === roomId &&
      payload?.data?.userId === owner.userId &&
      payload?.data?.content === "owner->guest private",
  );

  owner.socket.emit("chat:message", {
    roomId,
    userId: owner.userId,
    content: "owner->guest private",
  });
  await chatPromise;
  pass("Room privee: join REST + attach WS + chat OK");
}

async function ensurePrivateRoomFriendship(
  baseUrl,
  ownerUserId,
  guestUserId,
  ownerCookieHeader,
  guestCookieHeader,
) {
  const createResponse = await fetch(`${baseUrl}/friends/requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: ownerCookieHeader,
    },
    body: JSON.stringify({
      receiverUserId: guestUserId,
    }),
  });

  if (createResponse.status === 409) {
    const payload = await safeJson(createResponse);
    if (payload?.error?.message === "Users are already friends") {
      pass("Precondition friends deja satisfaite pour room privee");
      return;
    }

    fail(
      `Friend request precondition failed (${createResponse.status}) ${payload?.error?.message ?? "unknown conflict"}`,
    );
  }

  if (!createResponse.ok) {
    fail(`Friend request creation failed (${createResponse.status})`);
  }

  const createPayload = await safeJson(createResponse);
  const requestId = createPayload?.data?.requestId;
  if (typeof requestId !== "number") {
    fail("Friend request response missing requestId");
  }

  const acceptResponse = await fetch(`${baseUrl}/friends/requests/${requestId}/accept`, {
    method: "POST",
    headers: {
      Cookie: guestCookieHeader,
    },
  });

  if (!acceptResponse.ok) {
    fail(`Friend request accept failed (${acceptResponse.status})`);
  }

  const acceptPayload = await safeJson(acceptResponse);
  if (acceptPayload?.data?.status !== "accepted") {
    fail("Friend request accept payload missing accepted status");
  }

  pass(`Friendship precondition OK (${ownerUserId}<->${guestUserId})`);
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// Always create a dedicated quiz so the smoke test controls the expected answer.
async function ensureQuizId(baseUrl, cookieHeader) {
  const quizzesResponse = await fetch(`${baseUrl}/quizzes`, {
    headers: {
      Cookie: cookieHeader,
    },
  });
  if (quizzesResponse.ok) {
    const quizzesPayload = await quizzesResponse.json();
    const existingQuiz = Array.isArray(quizzesPayload?.data)
      ? quizzesPayload.data.find(
          (quiz) =>
            quiz?.title === WS_SMOKE_QUIZ_TITLE &&
            typeof quiz?.id === "number" &&
            typeof quiz?.questionCount === "number" &&
            quiz.questionCount >= 1,
        )
      : null;

    if (existingQuiz) {
      return existingQuiz.id;
    }
  }

  const createResponse = await fetch(`${baseUrl}/quizzes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      title: WS_SMOKE_QUIZ_TITLE,
      questions: [
        {
          questionText: "Question smoke test",
          answers: ["A", "B", "C", "D"],
          correctAnswerIndex: TEST_QUIZ_ANSWER_INDEX,
          points: 1,
        },
      ],
    }),
  });
  if (!createResponse.ok) {
    fail(`Quiz creation failed (${createResponse.status})`);
  }
  const createPayload = await createResponse.json();
  const createdQuizId = createPayload?.data?.id;
  if (typeof createdQuizId !== "number") {
    fail("Quiz creation response missing quiz id");
  }
  return createdQuizId;
}

async function startRoomAsOwnerAndGetQuestion(owner, roomId) {
  const roomStartedPromise = waitForEvent(
    owner.socket,
    "room:started",
    (payload) => payload?.success === true && payload?.data?.id === roomId,
  );
  const questionPromise = waitForEvent(
    owner.socket,
    "game:question:started",
    (payload) => payload?.success === true && payload?.data?.roomId === roomId,
  );
  const timerPromise = waitForEvent(
    owner.socket,
    "game:timer",
    (payload) =>
      payload?.success === true &&
      payload?.data?.roomId === roomId &&
      typeof payload?.data?.remainingMs === "number",
  );
  owner.socket.emit("room:start", { roomId, userId: owner.userId });
  await roomStartedPromise;
  const question = await questionPromise;
  const timer = await timerPromise;
  if (typeof question?.data?.question?.text !== "string") fail("Missing question text");
  if (!Array.isArray(question?.data?.question?.options)) fail("Missing question options");
  if (typeof timer?.data?.remainingMs !== "number" || timer.data.remainingMs <= 0) {
    fail("Missing first timer tick");
  }
  pass("Start + question payload front-ready OK");
  return question.data.questionId;
}

async function submitAndValidateAnswer(guest, roomId, questionId) {
  const answerPromise = waitForEvent(
    guest.socket,
    "game:answer:result",
    (payload) => payload?.success === true && payload?.data?.userId === guest.userId,
  );
  guest.socket.emit("game:answer", {
    roomId,
    userId: guest.userId,
    questionId,
    answerIndex: TEST_QUIZ_ANSWER_INDEX,
  });
  const answer = await answerPromise;
  if (typeof answer?.data?.userTotalScore !== "number") fail("Missing userTotalScore");
  pass("Reponse + scoring OK");
}

async function assertDuplicateAnswerConflict(guest, roomId, questionId) {
  const duplicateErrorPromise = waitForEvent(
    guest.socket,
    "game:answer:error",
    (payload) => payload?.success === false && payload?.error?.code === "CONFLICT",
  );
  guest.socket.emit("game:answer", {
    roomId,
    userId: guest.userId,
    questionId,
    answerIndex: TEST_QUIZ_ANSWER_INDEX,
  });
  await duplicateErrorPromise;
  pass("Anti double-reponse OK");
}

async function assertTimerCompletesGame(guest, roomId) {
  const timeoutPromise = waitForEvent(
    guest.socket,
    "game:question:timeout",
    (payload) => payload?.success === true && payload?.data?.roomId === roomId,
    15000,
  );
  const endedPromise = waitForEvent(
    guest.socket,
    "game:ended",
    (payload) =>
      payload?.success === true &&
      payload?.data?.roomId === roomId &&
      Array.isArray(payload?.data?.leaderboard),
    15000,
  );
  const statePromise = waitForEvent(
    guest.socket,
    "game:state",
    (payload) =>
      payload?.success === true &&
      payload?.data?.roomId === roomId &&
      payload?.data?.status === "finished",
    15000,
  );

  await timeoutPromise;
  const ended = await endedPromise;
  await statePromise;

  if (ended?.data?.winnerUserId !== guest.userId) {
    fail("Unexpected winner after timer completion");
  }

  pass("Timer + fin de partie OK");
}

async function assertScoresLeaderboard(baseUrl, userId) {
  const leaderboardResponse = await fetch(`${baseUrl}/scores/leaderboard?limit=5`);
  if (!leaderboardResponse.ok) {
    fail(`Leaderboard endpoint failed (${leaderboardResponse.status})`);
  }

  const leaderboardPayload = await leaderboardResponse.json();
  if (!Array.isArray(leaderboardPayload?.data)) {
    fail("Scores leaderboard payload is malformed");
  }

  const userScoreResponse = await fetch(`${baseUrl}/scores/users/${userId}`);
  if (!userScoreResponse.ok) {
    fail(`User score endpoint failed (${userScoreResponse.status})`);
  }

  const userScorePayload = await userScoreResponse.json();
  const entry = userScorePayload?.data;
  if (!entry || entry.userId !== userId) {
    fail("Missing finished game result in user score endpoint");
  }

  if (typeof entry.score !== "number" || entry.score < 0 || entry.wins < 1) {
    fail("Scores REST endpoints did not aggregate game result");
  }

  pass("Scores REST coherent avec la fin de partie WS");
}

async function assertDisconnectUpdatesRoomState(owner, guest, roomId) {
  const roomStatePromise = waitForEvent(
    guest.socket,
    "room:state",
    (payload) =>
      payload?.success === true &&
      payload?.data?.id === roomId &&
      !payload?.data?.players?.some((p) => p.userId === owner.userId),
    DISCONNECT_EVENT_TIMEOUT_MS,
  );
  safeDisconnect(owner.socket);
  await assertNoImmediateOwnerRemoval(guest, roomId, owner.userId);
  await roomStatePromise;
  pass("Disconnect owner -> room mise a jour apres delai de grace");
}

async function assertRoomClosedAfterLastDisconnect(guest, outsider, roomId) {
  const roomRemovedPromise = waitForEvent(
    outsider.socket,
    "room:list-updated",
    (payload) =>
      payload?.success === true &&
      Array.isArray(payload?.data) &&
      !payload.data.some((room) => room.id === roomId),
    DISCONNECT_EVENT_TIMEOUT_MS,
  );
  safeDisconnect(guest.socket);
  await roomRemovedPromise;
  pass("Disconnect dernier joueur -> room fermee apres delai de grace");
}

async function assertNoImmediateOwnerRemoval(guest, roomId, ownerUserId) {
  if (ROOM_RECONNECT_GRACE_MS <= 0) {
    return;
  }

  const immediateWindowMs = Math.max(
    250,
    Math.min(2000, Math.floor(ROOM_RECONNECT_GRACE_MS / 2)),
  );
  let ownerRemovedTooEarly = false;

  const onRoomState = (payload) => {
    if (
      payload?.success === true &&
      payload?.data?.id === roomId &&
      !payload?.data?.players?.some((player) => player.userId === ownerUserId)
    ) {
      ownerRemovedTooEarly = true;
    }
  };

  guest.socket.on("room:state", onRoomState);
  await wait(immediateWindowMs);
  guest.socket.off("room:state", onRoomState);

  if (ownerRemovedTooEarly) {
    fail("Owner removed before reconnect grace period elapsed");
  }

  pass("Disconnect transitoire: pas de sortie immediate");
}

run().catch((error) => {
  console.error(`[KO] ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exit(1);
});
