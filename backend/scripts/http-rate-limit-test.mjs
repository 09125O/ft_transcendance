#!/usr/bin/env node

const BACKEND_PORT = Number(process.env.BACKEND_PORT || 4000);
const BACKEND_HOST = process.env.BACKEND_HOST || "localhost";
const BACKEND_BASE_URL =
  process.env.WS_BASE_URL || `https://${BACKEND_HOST}:${BACKEND_PORT}`;

const LOGIN_ATTEMPTS = Number(process.env.RATE_LIMIT_ATTEMPTS || 75);
const QUIZ_ATTEMPTS = Number(process.env.QUIZ_RATE_LIMIT_ATTEMPTS || 20);

async function main() {
  await assertLoginRateLimit();
  await assertQuizCreationRateLimit();
}

async function assertLoginRateLimit() {
  let received429 = false;

  for (let i = 0; i < LOGIN_ATTEMPTS; i += 1) {
    const response = await fetch(`${BACKEND_BASE_URL}/auth/login`, {
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
      `Rate limit not triggered on /auth/login after ${LOGIN_ATTEMPTS} attempts`,
    );
  }

  console.log("[OK] HTTP rate limit triggered on /auth/login");
}

async function assertQuizCreationRateLimit() {
  const session = await createAuthenticatedSession("ratelimit-quiz");
  let received429 = false;

  for (let i = 0; i < QUIZ_ATTEMPTS; i += 1) {
    const response = await fetch(`${BACKEND_BASE_URL}/quizzes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: session.cookieHeader,
      },
      body: JSON.stringify({
        title: `Rate Limit Quiz ${Date.now()}-${i}`,
        questions: [
          {
            questionText: `Question ${i}`,
            answers: ["A", "B"],
            correctAnswerIndex: 0,
            points: 1,
          },
        ],
      }),
    });

    if (response.status === 429) {
      received429 = true;
      break;
    }
  }

  if (!received429) {
    throw new Error(
      `Rate limit not triggered on /quizzes after ${QUIZ_ATTEMPTS} attempts`,
    );
  }

  console.log("[OK] HTTP rate limit triggered on /quizzes");
}

async function createAuthenticatedSession(label) {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const email = `${label}-${suffix}@test.com`;
  const password = "longsecuredpassword123!";

  const registerResponse = await fetch(`${BACKEND_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      username: `${label}_${Math.floor(Math.random() * 1000)}`,
      password,
    }),
  });

  const cookieHeader = extractAccessTokenCookie(registerResponse);
  if (
    registerResponse.status < 200 ||
    registerResponse.status >= 300 ||
    !cookieHeader
  ) {
    throw new Error(`Failed to create authenticated session for ${label}`);
  }

  return { cookieHeader };
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

void main();
