import Panel from "../Panel";
import PrimaryButton from "../PrimaryButton";
import { QUIZ_CATEGORIES } from "../../content/quizCatalog";
import type { Room } from "../../services/quiz";

type LobbyOverviewPanelProps = {
  rooms: Room[];
  roomsLoading: boolean;
  roomsError: string | null;
  actionsDisabled: boolean;
  onGoToReadyQuizzes: () => void;
  onGoToCreateQuiz: () => void;
  onJoinRoom: (room: Room) => Promise<void>;
  onRequireAuth: () => void;
};

const categoryPitchById: Record<string, string> = {
  "code-algo": "Muscle ta logique sur des défis code proches des vraies reviews.",
  gaming: "Montre que ta culture gaming est aussi solide que ton shell.",
  "startup-tech": "Passe de l'idée au MVP avec des questions orientées builder.",
  career: "Prépare stage, alternance et entretiens avec les bons réflexes tech.",
};

function stripGeneratedTimeSuffix(value: string): string {
  return value.replace(/\s-\s\d{2}:\d{2}$/, "").trim();
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="m-0 text-2xl font-semibold leading-tight text-text sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="ui-muted mt-3 max-w-3xl text-sm sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export default function LobbyOverviewPanel({
  rooms,
  roomsLoading,
  roomsError,
  actionsDisabled,
  onGoToReadyQuizzes,
  onGoToCreateQuiz,
  onJoinRoom,
  onRequireAuth,
}: LobbyOverviewPanelProps) {
  const hasRooms = rooms.length > 0;
  const visibleRooms = rooms.slice(0, 6);
  const roomsMessage = roomsLoading
    ? "Chargement des parties..."
    : roomsError ?? null;

  const handleCreateQuiz = () => {
    onGoToCreateQuiz();
  };

  const handleJoinRoom = (room: Room) => {
    if (actionsDisabled) {
      onRequireAuth();
      return;
    }
    void onJoinRoom(room);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <Panel className="relative overflow-hidden px-6 py-6 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.26),transparent_58%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_42%)] before:content-[''] sm:px-8 sm:py-8 lg:px-10">
        <div className="relative space-y-5">
          <div className="space-y-5">
            <span className="ui-kicker inline-flex w-fit rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Univers 42
            </span>
            <div className="space-y-3">
              <h1 className="m-0 max-w-4xl text-4xl font-semibold leading-tight text-text sm:text-5xl">
                Quiz live pour codeurs, gamers et builders
              </h1>
              <p className="ui-muted max-w-2xl text-sm sm:text-base">
                Choisis un quiz, ouvre une room et joue en temps réel. Code, gaming, startup et carrière dans l’univers 42.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <PrimaryButton
                className="px-5 py-3 text-sm sm:text-base"
                onClick={onGoToReadyQuizzes}
              >
                Jouer maintenant
              </PrimaryButton>
              <button
                className="ui-btn-secondary px-5 py-3 text-sm sm:text-base"
                onClick={handleCreateQuiz}
                type="button"
              >
                Créer un quiz
              </button>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel className="px-6 py-6 sm:px-8">
          <div id="ready-to-play" />
          <SectionHeader title="Quiz prêts à lancer" />
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {QUIZ_CATEGORIES.map((category) => (
                <button
                  className="flex h-full cursor-pointer flex-col gap-3 rounded-[22px] border border-primary/20 bg-background/78 p-4 text-left shadow-[0_24px_56px_-40px_rgba(2,6,23,0.9)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/35"
                  key={category.id}
                  onClick={onGoToReadyQuizzes}
                  type="button"
                >
                  <span className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                    {category.title}
                  </span>
                  <p className="m-0 text-base font-semibold text-text sm:text-lg">
                    {category.description}
                  </p>
                  <p className="ui-muted m-0 text-sm">
                    {categoryPitchById[category.id] ?? "Monte une room et lance ton prochain défi en live."}
                  </p>
                </button>
              ))}
              <div className="md:col-span-2 flex justify-center">
                <button
                  className="flex h-full w-full cursor-pointer flex-col gap-3 rounded-[22px] border border-amber-300/25 bg-gradient-to-br from-amber-300/10 to-background/75 p-4 text-left shadow-[0_24px_56px_-40px_rgba(2,6,23,0.9)] transition duration-200 hover:-translate-y-0.5 hover:border-amber-300/45 md:max-w-[28rem]"
                  onClick={onGoToReadyQuizzes}
                  type="button"
                >
                  <span className="w-fit rounded-full border border-amber-300/30 bg-amber-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
                    Communauté
                  </span>
                  <p className="m-0 text-base font-semibold text-text sm:text-lg">
                    Quiz créés par les Studs
                  </p>
                  <p className="ui-muted m-0 text-sm">
                    Découvre les quiz de la communauté, jouables instantanément en room live.
                  </p>
                </button>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="px-6 py-6 sm:px-8">
          <SectionHeader
            title="Rooms actives"
            description="Rejoins directement une room existante."
          />
          <div className="space-y-4">
            {roomsMessage ? (
              <p className="m-0 rounded-[22px] border border-primary/25 bg-background px-4 py-4 text-sm text-text/80">
                {roomsMessage}
              </p>
            ) : null}
            {!roomsLoading && !roomsError && !hasRooms ? (
              <div className="rounded-[24px] border border-dashed border-primary/30 bg-background/70 px-6 py-8 text-center">
                <p className="m-0 text-xl font-semibold text-text">
                  Aucune partie en attente pour le moment.
                </p>
                <p className="ui-muted mt-3 text-sm">
                  Crée une room depuis un quiz pour lancer la prochaine partie.
                </p>
              </div>
            ) : null}

            <div className="max-h-[24rem] space-y-3 overflow-y-auto pr-1">
              {visibleRooms.map((room) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-[22px] border border-primary/20 bg-background/78 px-4 py-4"
                  key={room.id}
                >
                  <div className="min-w-0">
                    <p className="m-0 text-base font-semibold text-text sm:text-lg">
                      {stripGeneratedTimeSuffix(room.name)}
                    </p>
                    <p className="ui-muted mt-1 text-xs sm:text-sm">
                      {room.players.length} joueur{room.players.length > 1 ? "s" : ""} • {room.rounds} manches • {Math.round(room.questionDurationMs / 1000)}s/question
                    </p>
                  </div>
                  <PrimaryButton
                    className="shrink-0 px-4 py-2 text-sm"
                    onClick={() => handleJoinRoom(room)}
                  >
                    Rejoindre
                  </PrimaryButton>
                </div>
              ))}
            </div>

            {rooms.length > visibleRooms.length ? (
              <p className="ui-muted m-0 text-xs sm:text-sm">
                {rooms.length - visibleRooms.length} autres rooms actives non affichées.
              </p>
            ) : null}

            <div className="rounded-[22px] border border-primary/20 bg-background/75 px-5 py-5">
              <h3 className="m-0 text-xl font-semibold text-text">Créer ton propre quiz</h3>
              <p className="ui-muted mt-2 text-sm sm:text-base">
                Prépare un quiz sur ton sujet, challenge ton cluster ou lance une room entre pote.
              </p>
              <div className="mt-4">
                <PrimaryButton
                  className="w-full justify-center px-5 py-3 text-sm sm:text-base"
                  onClick={handleCreateQuiz}
                >
                  Créer un quiz
                </PrimaryButton>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
