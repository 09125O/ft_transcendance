import { Injectable } from "@nestjs/common";
import { readFile } from "node:fs/promises";
import { PrismaService } from "./prisma/prisma.service";

type BackupRuntimeStatus = {
  ok?: boolean;
  automated?: boolean;
  checkedAt?: string;
  directory?: string;
  intervalSeconds?: number;
  retentionCount?: number;
  latestFile?: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  message?: string;
  error?: string;
};

type HealthStatus = {
  service: "backend";
  framework: "nestjs";
  ok: boolean;
  timestamp: string;
  database: {
    configured: boolean;
    ok: boolean;
    error?: string;
  };
  backup: {
    configured: boolean;
    automated: boolean;
    ok: boolean;
    statusFile: string;
    directory?: string;
    intervalSeconds?: number;
    retentionCount?: number;
    checkedAt?: string;
    latestFile?: string;
    lastSuccessAt?: string;
    lastFailureAt?: string;
    message?: string;
    error?: string;
  };
};

@Injectable()
export class AppService {
  constructor(private readonly prismaService: PrismaService) {}

  private readonly backupStatusFile =
    process.env.BACKUP_STATUS_FILE ?? "/app/.runtime/backup-status.json";

  async getHealth(): Promise<HealthStatus> {
    const backupConfigured =
      typeof process.env.BACKUP_INTERVAL_SECONDS === "string" &&
      process.env.BACKUP_INTERVAL_SECONDS.length > 0 &&
      typeof process.env.BACKUP_RETENTION_COUNT === "string" &&
      process.env.BACKUP_RETENTION_COUNT.length > 0;
    const status: HealthStatus = {
      service: "backend",
      framework: "nestjs",
      ok: true,
      timestamp: new Date().toISOString(),
      database: {
        configured: this.prismaService.isConfigured,
        ok: false,
      },
      backup: {
        configured: backupConfigured,
        automated: backupConfigured,
        ok: false,
        statusFile: this.backupStatusFile,
      },
    };

    if (backupConfigured) {
      try {
        const raw = await readFile(this.backupStatusFile, "utf8");
        const backupStatus = JSON.parse(raw) as BackupRuntimeStatus;
        status.backup.automated = backupStatus.automated ?? true;
        status.backup.ok = backupStatus.ok === true;
        status.backup.directory = backupStatus.directory;
        status.backup.intervalSeconds = backupStatus.intervalSeconds;
        status.backup.retentionCount = backupStatus.retentionCount;
        status.backup.checkedAt = backupStatus.checkedAt;
        status.backup.latestFile = backupStatus.latestFile;
        status.backup.lastSuccessAt = backupStatus.lastSuccessAt;
        status.backup.lastFailureAt = backupStatus.lastFailureAt;
        status.backup.message = backupStatus.message;
        status.backup.error = backupStatus.error;
      } catch (error) {
        status.backup.error =
          error instanceof Error
            ? error.message
            : "Backup status unavailable";
        status.backup.message =
          "La sauvegarde automatisee n'a pas encore publie d'etat lisible.";
      }
    }

    if (!this.prismaService.isConfigured) {
      return status;
    }

    try {
      await this.prismaService.ping();
      status.database.ok = true;
      return status;
    } catch (error) {
      status.ok = false;
      status.database.error =
        error instanceof Error ? error.message : "Unknown database error";
      return status;
    }
  }

  getApi() {
    return {
      name: "ft_transcendance starter",
      framework: "nestjs",
      language: "typescript",
      orm: "prisma",
      message: "Backend NestJS accessible.",
      endpoints: [
        "/health",
        "/api",
        "/auth/register",
        "/auth/login",
        "/auth/guest",
        "/auth/42/start",
        "/auth/42/callback",
        "/auth/logout",
        "/auth/session",
        "/users/me",
        "/users/:id",
        "/rooms",
        "/rooms/:roomId",
        "/rooms/:roomId/join",
        "/game/:roomId/state",
        "/game/answer",
        "/scores/leaderboard",
        "/scores/users/:userId",
      ],
      realtime: {
        namespace: "/ws",
        inboundEvents: [
          "room:list",
          "room:create",
          "room:join",
          "room:leave",
          "room:start",
          "game:answer",
          "chat:message",
        ],
        outboundEvents: [
          "ws:connected",
          "ws:auth:error",
          "room:list",
          "room:list-updated",
          "room:created",
          "room:joined",
          "room:left",
          "room:state",
          "room:started",
          "room:closed",
          "game:started",
          "game:question:started",
          "game:timer",
          "game:question:timeout",
          "game:state",
          "game:answer:result",
          "game:leaderboard",
          "game:ended",
          "chat:message",
          "room:create:error",
          "room:join:error",
          "room:leave:error",
          "room:start:error",
          "game:answer:error",
          "chat:message:error",
        ],
      },
    };
  }
}
