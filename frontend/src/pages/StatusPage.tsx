import { useEffect, useState } from "react";
import Panel from "../components/Panel";
import { getHealthStatus, type HealthStatus } from "../services/health";

type HealthViewState =
  | {
      status: "loading";
    }
  | {
      status: "ready";
      health: HealthStatus;
      checkedAt: string;
    }
  | {
      status: "error";
      message: string;
      checkedAt: string;
    };

function StatusBadge({
  label,
  ok,
}: {
  label: string;
  ok: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        ok
          ? "border border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
          : "border border-amber-300/25 bg-amber-300/10 text-amber-200",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function formatDateValue(value?: string) {
  if (!value) {
    return "n/a";
  }

  return new Date(value).toLocaleString("fr-FR");
}

export default function StatusPage() {
  const [viewState, setViewState] = useState<HealthViewState>({
    status: "loading",
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const health = await getHealthStatus();
        if (!mounted) {
          return;
        }

        setViewState({
          status: "ready",
          health,
          checkedAt: new Date().toISOString(),
        });
      } catch (error) {
        if (!mounted) {
          return;
        }

        setViewState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Impossible de récupérer l'état du backend.",
          checkedAt: new Date().toISOString(),
        });
      }
    };

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 30_000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const health = viewState.status === "ready" ? viewState.health : null;
  const checkedAt = viewState.status === "loading" ? null : viewState.checkedAt;
  const backendOk = health?.ok ?? false;
  const databaseConfigured = health?.database.configured ?? false;
  const databaseOk = health?.database.ok ?? false;
  const backup = health?.backup;
  const backupConfigured = backup?.configured ?? false;
  const backupOk = backup?.ok ?? false;

  return (
    <main className="flex flex-1 px-4 py-6 sm:px-6 lg:px-[8%]">
      <div className="flex w-full flex-col gap-6">
        <Panel className="relative overflow-hidden px-6 py-6 sm:px-8 sm:py-8 lg:px-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.22),transparent_58%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.18),transparent_42%)]" />
          <div className="relative space-y-4">
            <span className="ui-kicker inline-flex w-fit rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              Santé système
            </span>
            <h1 className="m-0 max-w-4xl text-3xl font-semibold leading-tight text-text sm:text-4xl">
              Statut de la stack locale et des dépendances critiques
            </h1>
            <p className="ui-muted max-w-3xl text-sm sm:text-base">
              Cette page donne un état lisible du frontend, du backend et de la base de données.
              Elle s'appuie sur le endpoint backend <code>/health</code> et se rafraîchit automatiquement.
            </p>
            {checkedAt ? (
              <p className="m-0 text-xs text-text/55">
                Dernière vérification : {new Date(checkedAt).toLocaleString("fr-FR")}
              </p>
            ) : null}
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-3">
          <Panel className="px-6 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="ui-kicker m-0 text-xs text-text/55">Frontend</p>
                <h2 className="m-0 mt-2 text-2xl font-semibold text-text">Interface</h2>
              </div>
              <StatusBadge label="Actif" ok />
            </div>
            <p className="mt-4 text-sm text-text/70">
              La page est rendue côté client. Si tu lis cet écran, le frontend répond.
            </p>
            <div className="mt-5 rounded-[20px] border border-white/10 bg-background/70 px-4 py-4 text-sm text-text/70">
              <p className="m-0">Origine : {window.location.origin}</p>
              <p className="m-0 mt-2">Route : /status</p>
            </div>
          </Panel>

          <Panel className="px-6 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="ui-kicker m-0 text-xs text-text/55">Backend</p>
                <h2 className="m-0 mt-2 text-2xl font-semibold text-text">API NestJS</h2>
              </div>
              <StatusBadge
                label={viewState.status === "loading" ? "Vérification" : backendOk ? "OK" : "Incident"}
                ok={viewState.status === "loading" ? true : backendOk}
              />
            </div>
            {viewState.status === "loading" ? (
              <p className="mt-4 text-sm text-text/70">Lecture de /health en cours...</p>
            ) : null}
            {viewState.status === "error" ? (
              <div className="mt-5 rounded-[20px] border border-amber-300/25 bg-amber-300/10 px-4 py-4 text-sm text-amber-100">
                {viewState.message}
              </div>
            ) : null}
            {health ? (
              <div className="mt-5 rounded-[20px] border border-white/10 bg-background/70 px-4 py-4 text-sm text-text/70">
                <p className="m-0">Service : {health.service}</p>
                <p className="m-0 mt-2">Framework : {health.framework}</p>
                <p className="m-0 mt-2">Horodatage backend : {new Date(health.timestamp).toLocaleString("fr-FR")}</p>
              </div>
            ) : null}
          </Panel>

          <Panel className="px-6 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="ui-kicker m-0 text-xs text-text/55">Database</p>
                <h2 className="m-0 mt-2 text-2xl font-semibold text-text">PostgreSQL</h2>
              </div>
              <StatusBadge
                label={
                  viewState.status === "loading"
                    ? "Vérification"
                    : databaseConfigured && databaseOk
                      ? "OK"
                      : "Attention"
                }
                ok={viewState.status === "loading" ? true : databaseConfigured && databaseOk}
              />
            </div>
            <div className="mt-5 rounded-[20px] border border-white/10 bg-background/70 px-4 py-4 text-sm text-text/70">
              <p className="m-0">Configurée : {databaseConfigured ? "oui" : "non"}</p>
              <p className="m-0 mt-2">Joignable : {databaseOk ? "oui" : "non"}</p>
              {health?.database.error ? (
                <p className="m-0 mt-2 text-amber-200">Erreur : {health.database.error}</p>
              ) : null}
            </div>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="flex flex-col gap-6">
            <Panel className="px-6 py-6 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="ui-kicker m-0 text-xs text-text/55">Backup</p>
                  <h2 className="m-0 mt-2 text-2xl font-semibold text-text">Sauvegarde automatisée</h2>
                </div>
                <StatusBadge
                  label={
                    viewState.status === "loading"
                      ? "Vérification"
                      : backupConfigured && backupOk
                        ? "OK"
                        : backupConfigured
                          ? "Attention"
                          : "Non configuré"
                  }
                  ok={viewState.status === "loading" ? true : backupConfigured && backupOk}
                />
              </div>
              <div className="mt-5 rounded-[20px] border border-white/10 bg-background/70 px-4 py-4 text-sm text-text/70">
                <p className="m-0">Automatisée : {backupConfigured ? "oui" : "non"}</p>
                <p className="m-0 mt-2">Intervalle : {backup?.intervalSeconds ? `${backup.intervalSeconds}s` : "n/a"}</p>
                <p className="m-0 mt-2">Rétention : {backup?.retentionCount ? `${backup.retentionCount} dumps` : "n/a"}</p>
                <p className="m-0 mt-2">Dernier succès : {formatDateValue(backup?.lastSuccessAt)}</p>
                <p className="m-0 mt-2">Dernier dump : {backup?.latestFile ?? "n/a"}</p>
                {backup?.error ? (
                  <p className="m-0 mt-2 text-amber-200">Erreur : {backup.error}</p>
                ) : null}
                {backup?.message ? (
                  <p className="m-0 mt-2 text-text/60">{backup.message}</p>
                ) : null}
              </div>
            </Panel>

            <Panel className="px-6 py-6 sm:px-8">
              <div>
                <p className="ui-kicker m-0 text-xs text-text/55">Runbook</p>
                <h2 className="m-0 mt-2 text-2xl font-semibold text-text">Commandes utiles</h2>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] border border-white/10 bg-background/75 px-4 py-4">
                  <p className="m-0 text-sm font-semibold text-text">Vérifier la stack</p>
                  <code className="mt-3 block text-sm text-text/70">make test-stack</code>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-background/75 px-4 py-4">
                  <p className="m-0 text-sm font-semibold text-text">Smoke global</p>
                  <code className="mt-3 block text-sm text-text/70">make smoke-test</code>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-background/75 px-4 py-4">
                  <p className="m-0 text-sm font-semibold text-text">Backup manuel</p>
                  <code className="mt-3 block text-sm text-text/70">make backup-db</code>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-background/75 px-4 py-4">
                  <p className="m-0 text-sm font-semibold text-text">Restaurer la DB</p>
                  <code className="mt-3 block text-sm text-text/70">make restore-db file=backups/...</code>
                </div>
              </div>
            </Panel>
          </div>

          <Panel className="px-6 py-6 sm:px-8">
            <div>
              <p className="ui-kicker m-0 text-xs text-text/55">Interprétation</p>
              <h2 className="m-0 mt-2 text-2xl font-semibold text-text">Lecture rapide</h2>
            </div>
            <div className="mt-5 space-y-3 text-sm text-text/70">
              <p className="m-0 rounded-[20px] border border-white/10 bg-background/75 px-4 py-4">
                Si le frontend est affiché mais que le backend est en incident, l'interface tourne mais l'API ne répond pas correctement.
              </p>
              <p className="m-0 rounded-[20px] border border-white/10 bg-background/75 px-4 py-4">
                Si le backend répond mais que la base n'est pas joignable, la plupart des flux applicatifs seront dégradés ou bloqués.
              </p>
              <p className="m-0 rounded-[20px] border border-white/10 bg-background/75 px-4 py-4">
                Si la sauvegarde automatique est en attention, l'application reste utilisable mais le module backup/recovery n'est plus dans un état défendable.
              </p>
              <p className="m-0 rounded-[20px] border border-white/10 bg-background/75 px-4 py-4">
                La procédure détaillée de sauvegarde et de reprise est documentée dans <code>docs/ops-status-backup-recovery.md</code>.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
