import Panel from "../Panel";
import PrimaryButton from "../PrimaryButton";

type ScoreEntry = {
  userId: number;
  username: string;
  score: number;
};

type ResultsPanelProps = {
  roomName: string;
  scoreEntries: ScoreEntry[];
  onLeaveRoom: () => void;
  onOpenRules: () => void;
};

export default function ResultsPanel({
  roomName,
  scoreEntries,
  onLeaveRoom,
  onOpenRules,
}: ResultsPanelProps) {
  const winner = scoreEntries[0] ?? null;

  return (
    <div className="grid w-full gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(21rem,24rem)]">
      <Panel className="relative overflow-hidden px-6 py-6 sm:px-8 sm:py-8 xl:min-h-[80vh]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.24),transparent_58%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.2),transparent_42%)]" />
        <div className="relative flex h-full flex-col justify-between gap-8">
          <div className="space-y-4">
            <span className="ui-kicker inline-flex w-fit rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">
              Fin de partie
            </span>
            <h1 className="m-0 text-3xl font-semibold leading-tight text-text sm:text-4xl">
              Résultats de {roomName}
            </h1>
            <p className="ui-muted m-0 max-w-2xl text-sm sm:text-base">
              L&apos;écran de résultat est volontairement séparé du live pour laisser une lecture claire du classement final.
            </p>
          </div>

          <div className="rounded-[24px] border border-primary/20 bg-background/75 px-5 py-5">
            <p className="ui-kicker m-0 text-xs text-text/55">Vainqueur</p>
            <p className="m-0 mt-2 text-2xl font-semibold text-text">
              {winner?.username ?? "Aucun joueur"}
            </p>
            <p className="ui-muted m-0 mt-2 text-sm">
              {winner
                ? `${winner.score} point${winner.score > 1 ? "s" : ""}`
                : "Le classement final n&apos;est pas disponible."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <PrimaryButton className="px-5 py-3 text-sm sm:text-base" onClick={onLeaveRoom}>
              Retour au lobby
            </PrimaryButton>
            <button
              className="ui-btn-secondary px-5 py-3 text-sm sm:text-base"
              type="button"
              onClick={onOpenRules}
            >
              Revoir les règles
            </button>
          </div>
        </div>
      </Panel>

      <Panel className="px-5 py-5 sm:px-6 sm:py-6 xl:min-h-[80vh]">
        <div className="mb-5">
          <p className="ui-kicker m-0 text-xs font-semibold text-text/55">Classement final</p>
          <p className="m-0 text-2xl font-semibold text-text">Podium</p>
        </div>

        <div className="space-y-3">
          {scoreEntries.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-primary/25 bg-background/70 px-5 py-6 text-sm text-text/70">
              Aucun score à afficher.
            </div>
          ) : (
            scoreEntries.map((entry, index) => (
              <div
                className="flex items-center justify-between gap-3 rounded-[22px] border border-primary/20 bg-background/80 px-4 py-3"
                key={entry.userId}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                      index === 0
                        ? "bg-amber-300 text-[#2a1701]"
                        : index === 1
                          ? "bg-slate-300 text-[#111827]"
                          : index === 2
                            ? "bg-orange-300 text-[#2a1201]"
                            : "bg-white/8 text-text/75",
                    ].join(" ")}
                  >
                    {index + 1}
                  </span>
                  <p className="m-0 truncate font-medium text-text">{entry.username}</p>
                </div>
                <span className="text-lg font-semibold text-text">{entry.score}</span>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
