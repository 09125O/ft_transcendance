const DEFAULT_APP_PROTOCOL = "http";
const DEFAULT_FRONTEND_PORT = 3000;

function normalizeProtocol(value: string | undefined): "http" | "https" {
  return value?.toLowerCase() === "https" ? "https" : "http";
}

export function getAppProtocol(): "http" | "https" {
  const inferredProtocol = process.env.FRONTEND_ORIGIN?.startsWith("https://")
    ? "https"
    : DEFAULT_APP_PROTOCOL;
  return normalizeProtocol(process.env.APP_PROTOCOL || inferredProtocol);
}

export function getFrontendPort(): number {
  return Number(process.env.FRONTEND_PORT || DEFAULT_FRONTEND_PORT);
}

export function getFrontendOrigin(): string {
  return (
    process.env.FRONTEND_ORIGIN ||
    `${getAppProtocol()}://localhost:${getFrontendPort()}`
  );
}

function getConfiguredCorsOrigins(): string[] {
  return (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function allowLanOrigins(): boolean {
  const configured = process.env.ALLOW_LAN_ORIGINS?.toLowerCase();
  if (configured === "true") {
    return true;
  }

  if (configured === "false") {
    return false;
  }

  return getAppProtocol() === "http";
}

function getOriginPort(url: URL): string {
  if (url.port) {
    return url.port;
  }

  return url.protocol === "https:" ? "443" : "80";
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }

  const explicitOrigins = getConfiguredCorsOrigins();
  if (explicitOrigins.includes(origin)) {
    return true;
  }

  if (origin === getFrontendOrigin()) {
    return true;
  }

  if (!allowLanOrigins()) {
    return false;
  }

  try {
    const url = new URL(origin);
    if (url.protocol !== "http:") {
      return false;
    }

    return getOriginPort(url) === String(getFrontendPort());
  } catch {
    return false;
  }
}
