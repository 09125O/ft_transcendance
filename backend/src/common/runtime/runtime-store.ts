import { existsSync, readFileSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
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
  const nextPayload = JSON.stringify(payload, null, 2);
  enqueueRuntimeWrite(filePath, nextPayload);
}

const writeQueues = new Map<string, Promise<void>>();

function enqueueRuntimeWrite(filePath: string, payload: string): void {
  const previous = writeQueues.get(filePath) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(async () => {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, payload, "utf8");
    })
    .catch((error) => {
      const message =
        error instanceof Error ? error.message : "Unknown runtime write error";
      console.error(
        `[runtime-store] failed to persist ${filePath}: ${message}`,
      );
    })
    .finally(() => {
      if (writeQueues.get(filePath) === next) {
        writeQueues.delete(filePath);
      }
    });

  writeQueues.set(filePath, next);
}
