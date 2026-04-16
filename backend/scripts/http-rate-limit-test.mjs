#!/usr/bin/env node

const BACKEND_PORT = Number(process.env.BACKEND_PORT || 4000);
const BACKEND_HOST = process.env.BACKEND_HOST || "localhost";
const BACKEND_BASE_URL =
  process.env.WS_BASE_URL || `https://${BACKEND_HOST}:${BACKEND_PORT}`;

const ATTEMPTS = Number(process.env.RATE_LIMIT_ATTEMPTS || 75);
const TARGET_PATH = "/auth/login";

async function main() {
  const url = `${BACKEND_BASE_URL}${TARGET_PATH}`;
  let received429 = false;

  for (let i = 0; i < ATTEMPTS; i += 1) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: `ratelimit-${Date.now()}-${i}@test.com`,
        password: "invalid-password",
      }),
    });

    if (response.status === 429) {
      received429 = true;
      break;
    }
  }

  if (!received429) {
    throw new Error(
      `Rate limit not triggered on ${TARGET_PATH} after ${ATTEMPTS} attempts`,
    );
  }

  console.log("[OK] HTTP rate limit triggered on /auth/login");
}

void main();
