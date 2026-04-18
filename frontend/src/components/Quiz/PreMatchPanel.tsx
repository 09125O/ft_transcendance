import Panel from "../Panel";
import PrimaryButton from "../PrimaryButton";

type ScoreEntry = {
  userId: number;
  username: string;
  score: number;
};

type PreMatchPanelProps = {
  roomName: string;
  rounds: number;
  scoreEntries: ScoreEntry[];
  canStartRoom: boolean;
  onStartRoom: () => void;
  onLeaveRoom: () => void;
  onOpenRules: () => void;
};

function stripGeneratedTimeSuffix(roomName: string): string {
  return roomName.replace(/\s-\s\d{2}:\d{2}$/, "").trim();
}

export default function PreMatchPanel({
  roomName,
  rounds,
  scoreEntries,
  canStartRoom,
  onStartRoom,
  onLeaveRoom,
  onOpenRules,
}: PreMatchPanelProps) {
  const displayRoomName = stripGeneratedTimeSuffix(roomName);

  return (
    <div className="grid w-full gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,23rem)]">
      <Panel className="relative overflow-hidden px-6 py-6 sm:px-8 sm:py-8 xl:min-h-[80vh]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.24),transparent_58%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_42%)]" />
        <div className="relative flex h-full flex-col justify-between gap-8">
          <div className="space-y-4">
            <span className="ui-kicker inline-flex w-fit rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Pré-match
            </span>
            <h1 className="m-0 text-3xl font-semibold leading-tight text-text sm:text-4xl">
              {displayRoomName}
            </h1>
            <p className="ui-muted m-0 max-w-2xl text-sm sm:text-base">
              Les joueurs sont en salle. Lance la partie quand tout le monde est prêt.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[20px] border border-primary/20 bg-background/75 px-4 py-4">
              <p className="ui-kicker m-0 text-xs text-text/55">Joueurs</p>
              <p className="m-0 mt-2 text-2xl font-semibold text-text">{scoreEntries.length}</p>
            </div>
            <div className="rounded-[20px] border border-primary/20 bg-background/75 px-4 py-4">
              <p className="ui-kicker m-0 text-xs text-text/55">Manches</p>
              <p className="m-0 mt-2 text-2xl font-semibold text-text">{rounds}</p>
            </div>
            <div className="rounded-[20px] border border-primary/20 bg-background/75 px-4 py-4">
              <p className="ui-kicker m-0 text-xs text-text/55">Etat</p>
              <p className="m-0 mt-2 text-base font-semibold text-text">En attente du départ</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {canStartRoom ? (
              <PrimaryButton className="px-5 py-3 text-sm sm:text-base" onClick={onStartRoom}>
                Démarrer la partie
              </PrimaryButton>
            ) : null}
            <button
              className="ui-btn-secondary px-5 py-3 text-sm sm:text-base"
              type="button"
              onClick={onOpenRules}
            >
              Voir les règles
            </button>
            <button
              className="ui-btn-danger px-5 py-3 text-sm sm:text-base"
              type="button"
              onClick={onLeaveRoom}
            >
              Quitter la room
            </button>
          </div>
        </div>
      </Panel>

      <Panel className="px-5 py-5 sm:px-6 sm:py-6 xl:min-h-[80vh]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="ui-kicker m-0 text-xs font-semibold text-text/55">Participants</p>
            <p className="m-0 text-2xl font-semibold text-text">Salle d&apos;attente</p>
          </div>
          <span className="rounded-full border border-primary/20 bg-background px-3 py-1 text-xs text-text/75">
            {scoreEntries.length} joueur{scoreEntries.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="space-y-3">
          {scoreEntries.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-primary/25 bg-background/70 px-5 py-6 text-sm text-text/70">
              En attente de joueurs...
            </div>
          ) : (
            scoreEntries.map((entry) => (
              <div
                className="flex items-center justify-between gap-3 rounded-[22px] border border-primary/20 bg-background/80 px-4 py-3"
                key={entry.userId}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-sm font-semibold text-text/75">
                    {entry.username.charAt(0).toUpperCase()}
                  </span>
                  <p className="m-0 truncate font-medium text-text">{entry.username}</p>
                </div>
                <span className="text-xs text-text/60">Prêt</span>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
