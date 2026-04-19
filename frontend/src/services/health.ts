export type HealthStatus = {
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

export async function getHealthStatus(): Promise<HealthStatus> {
  const response = await fetch("/health", {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  try {
    return (await response.json()) as HealthStatus;
  } catch {
    throw new Error(`Réponse health invalide (${response.status})`);
  }
}
