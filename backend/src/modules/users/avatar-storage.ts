import { basename, join } from "path";

export const PUBLIC_UPLOADS_PREFIX = "/uploads";
export const AVATAR_PUBLIC_PREFIX = `${PUBLIC_UPLOADS_PREFIX}/avatars`;
export const UPLOADS_ROOT_DIR = join(process.cwd(), ".runtime", "uploads");
export const AVATAR_UPLOADS_DIR = join(UPLOADS_ROOT_DIR, "avatars");

export const MAX_AVATAR_FILE_SIZE_BYTES = 2 * 1024 * 1024;

export const ALLOWED_AVATAR_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function isManagedAvatarUrl(value: string | null | undefined): value is string {
  return typeof value === "string" && value.startsWith(`${AVATAR_PUBLIC_PREFIX}/`);
}

export function resolveManagedAvatarPath(value: string): string {
  return join(AVATAR_UPLOADS_DIR, basename(value));
}
