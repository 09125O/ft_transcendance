const DEFAULT_APP_PROTOCOL = "http";
const DEFAULT_FRONTEND_PORT = 3000;

function normalizeProtocol(value: string | undefined): "http" | "https" {
  return value?.toLowerCase() === "https" ? "https" : "http";
}

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizeOriginValue(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = trimTrailingSlashes(value.trim());
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
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
    normalizeOriginValue(process.env.FRONTEND_ORIGIN) ||
    `${getAppProtocol()}://localhost:${getFrontendPort()}`
  );
}

function getConfiguredCorsOrigins(): string[] {
  return (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => normalizeOriginValue(value))
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
  const normalizedOrigin = normalizeOriginValue(origin);

  if (!normalizedOrigin) {
    return true;
  }

  const explicitOrigins = getConfiguredCorsOrigins();
  if (explicitOrigins.includes(normalizedOrigin)) {
    return true;
  }

  if (normalizedOrigin === getFrontendOrigin()) {
    return true;
  }

  if (!allowLanOrigins()) {
    return false;
  }

  try {
    const url = new URL(normalizedOrigin);
    if (url.protocol !== "http:") {
      return false;
    }

    return getOriginPort(url) === String(getFrontendPort());
  } catch {
    return false;
  }
}

function getHeaderValue(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function resolveFrontendOriginFromRequest(headers: {
  origin?: string | string[];
  referer?: string | string[];
  referrer?: string | string[];
}): string {
  const origin = normalizeOriginValue(getHeaderValue(headers.origin));
  if (origin && isOriginAllowed(origin)) {
    return origin;
  }

  const referer =
    getHeaderValue(headers.referer) || getHeaderValue(headers.referrer);
  const refererOrigin = normalizeOriginValue(referer);
  if (refererOrigin && isOriginAllowed(refererOrigin)) {
    return refererOrigin;
  }

  return getFrontendOrigin();
}
