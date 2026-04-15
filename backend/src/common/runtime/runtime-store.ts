import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";

function getRuntimeRootPath(): string {
  if (process.env.RUNTIME_DIR) {
    return resolve(process.env.RUNTIME_DIR);
  }

  return resolve(process.cwd(), ".runtime");
}

export function getRuntimeFilePath(filename: string): string {
  return resolve(getRuntimeRootPath(), filename);
}

export function readRuntimeJson<T>(filePath: string, fallback: T): T {
  try {
    if (!existsSync(filePath)) {
      return fallback;
    }

    const raw = readFileSync(filePath, "utf8");
    if (!raw.trim()) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeRuntimeJson<T>(filePath: string, payload: T): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
}
