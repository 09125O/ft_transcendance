import { io } from "socket.io-client";

export const EVENT_TIMEOUT_MS = Number(process.env.WS_SMOKE_TIMEOUT_MS || 12000);
const SOCKET_TRANSPORTS = (
  process.env.WS_SMOKE_TRANSPORTS || "polling,websocket"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export function pass(message) {
  console.log(`[OK] ${message}`);
}

export function fail(message) {
  throw new Error(message);
}

export function createSocket(namespaceUrl, cookieHeader) {
  const allowInsecureTls = process.env.WS_TLS_INSECURE === "1";
  const extraHeaders = {
    Origin:
      process.env.WS_SMOKE_ORIGIN ||
      process.env.FRONTEND_ORIGIN ||
      "https://localhost:3000",
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  };

  return io(namespaceUrl, {
    autoConnect: false,
    reconnection: false,
    timeout: EVENT_TIMEOUT_MS,
    transports: SOCKET_TRANSPORTS,
    extraHeaders,
    ...(allowInsecureTls ? { rejectUnauthorized: false } : {}),
  });
}

export function safeDisconnect(socket) {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}

export function waitForEvent(
  socket,
  eventName,
  predicate,
  timeoutMs = EVENT_TIMEOUT_MS,
) {
  return new Promise((resolve, reject) => {
    let lastConnectErrorMessage = null;

    const onConnectError = (error) => {
      lastConnectErrorMessage = error?.message || "unknown error";
    };

    const onEvent = (payload) => {
      if (!predicate(payload)) {
        return;
      }

      cleanup();
      resolve(payload);
    };

    const cleanup = () => {
      clearTimeout(timer);
      socket.off(eventName, onEvent);
      socket.off("connect_error", onConnectError);
    };

    const timer = setTimeout(() => {
      cleanup();
      const suffix = lastConnectErrorMessage
        ? ` (last connect_error: ${lastConnectErrorMessage})`
        : "";
      reject(new Error(`Timeout waiting for event "${eventName}" after ${timeoutMs}ms${suffix}`));
    }, timeoutMs);

    socket.on(eventName, onEvent);
    socket.on("connect_error", onConnectError);
  });
}

export async function connectAuthenticatedSocket(namespaceUrl, cookieHeader) {
  const socket = createSocket(namespaceUrl, cookieHeader);
  const connectedPromise = waitForEvent(
    socket,
    "ws:connected",
    (payload) =>
      payload?.success === true && typeof payload?.data?.userId === "number",
  );

  socket.connect();
  const connected = await connectedPromise;
  const userId = connected?.data?.userId;
  if (typeof userId !== "number") {
    fail("Missing userId in ws:connected");
  }

  return { socket, userId };
}

export async function createAuthenticatedSession(baseUrl, label) {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const email = `ws-smoke-${label}-${suffix}@test.com`;
  const password = "longsecuredpassword123!";

  const registerResponse = await requestJson(
    baseUrl,
    "/auth/register",
    {
      email,
      username: `ws_${label}_${Math.floor(Math.random() * 1000)}`,
      password,
    },
  );
  if (registerResponse.status < 200 || registerResponse.status >= 300) {
    fail(`Register failed for ${label} (${registerResponse.status})`);
  }

  // Register already creates an authenticated cookie in this app.
  // Reuse it first to avoid hitting auth rate limits in CI test chains.
  const registerCookie = extractAccessTokenCookie(registerResponse);
  if (registerCookie) {
    return { email, cookieHeader: registerCookie };
  }

  const loginResponse = await requestJson(baseUrl, "/auth/login", {
    email,
    password,
  });
  if (loginResponse.status < 200 || loginResponse.status >= 300) {
    fail(`Login failed for ${label} (${loginResponse.status})`);
  }

  const cookieHeader = extractAccessTokenCookie(loginResponse);
  if (!cookieHeader) {
    fail(`Missing access_token cookie for ${label}`);
  }

  return { email, cookieHeader };
}

async function requestJson(baseUrl, path, payload) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let json;
  try {
    json = await response.json();
  } catch {
    // Some auth failures may return an empty body; the caller still needs the status.
  }

  return {
    status: response.status,
    json,
    headers: response.headers,
  };
}

function extractAccessTokenCookie(response) {
  if (typeof response.headers.getSetCookie === "function") {
    const tokenCookie = response.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .find((value) => value.startsWith("access_token="));

    if (tokenCookie) return tokenCookie;
  }

  const singleHeader = response.headers.get("set-cookie");
  if (!singleHeader) {
    return null;
  }

  const tokenCookie = singleHeader
    .split(/,(?=\s*[A-Za-z0-9_-]+=)/)
    .map((value) => value.trim().split(";")[0])
    .find((value) => value.startsWith("access_token="));

  return tokenCookie || null;
}
