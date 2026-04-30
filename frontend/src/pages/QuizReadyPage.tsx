import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Panel from "../components/Panel";
import PrimaryButton from "../components/PrimaryButton";
import TypewriterWords from "../components/TypewriterWords";
import RoomCreateFromQuizPanel from "../components/Quiz/RoomCreateFromQuizPanel";
import {
  decorateQuiz,
  getCommunityQuizzes,
  getLaunchQuizzes,
} from "../content/quizCatalog";
import { useQuizLibrary } from "../hooks/useQuizLibrary";
import { useAuth } from "../providers/AuthProvider";
import { createRoom, type CreateRoomPayload } from "../services/quiz";
import type { Quiz } from "../services/quizzes";

export default function QuizReadyPage() {
  const navigate = useNavigate();
  const { user: sessionUser, isLoading: isSessionLoading } = useAuth();
  const { quizzes, quizzesLoading, quizzesError } = useQuizLibrary();
  const launchQuizzes = getLaunchQuizzes(quizzes);
  const communityQuizzes = getCommunityQuizzes(quizzes);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const handleOpenRoomConfigurator = (quiz: Quiz) => {
    if (isSessionLoading) {
      return;
    }

    if (!sessionUser) {
      navigate("/login");
      return;
    }

    setSelectedQuiz(quiz);
  };

  const handleCreateRoomFromQuiz = async (payload: CreateRoomPayload) => {
    if (!sessionUser) {
      navigate("/login");
      throw new Error("Authentification requise.");
    }

    setIsCreatingRoom(true);
    try {
      const createdRoom = await createRoom(payload);
      navigate(`/room/${createdRoom.id}`);
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Impossible de créer la room depuis ce quiz.");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const renderQuizCard = (quiz: Quiz) => {
    const decoratedQuiz = decorateQuiz(quiz);

    return (
      <article
        className="flex h-full w-full flex-col justify-between rounded-[22px] border border-primary/20 bg-background/78 p-4 text-left shadow-[0_24px_56px_-40px_color-mix(in_srgb,var(--color-background)_90%,transparent)] transition duration-300"
        key={quiz.id}
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            {decoratedQuiz.category.title}
          </span>
          <span className="rounded-full border border-text/10 bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-text/70">
            {decoratedQuiz.level}
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="m-0 text-lg font-semibold text-text sm:text-xl">
            {quiz.title}
          </h2>
          <p className="text-text-muted mt-1 text-sm">{decoratedQuiz.summary}</p>
          {quiz.activeRoomCount > 0 ? (
            <div className="flex flex-wrap gap-2 text-xs text-text/70">
              <span className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-success">
                {quiz.activeRoomCount} room{quiz.activeRoomCount > 1 ? "s" : ""} active{quiz.activeRoomCount > 1 ? "s" : ""}
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div />
          <PrimaryButton
            className="px-4 py-2 text-sm"
            disabled={isCreatingRoom}
            onClick={() => {
              handleOpenRoomConfigurator(quiz);
            }}
          >
            Lancer
          </PrimaryButton>
        </div>
      </article>
    );
  };

  if (selectedQuiz) {
    return (
      <main className="flex flex-1 px-4 py-6 sm:px-6 lg:px-[8%]">
        <RoomCreateFromQuizPanel
          quiz={selectedQuiz}
          onBack={() => setSelectedQuiz(null)}
          onCreateRoom={handleCreateRoomFromQuiz}
        />
      </main>
    );
  }

  return (
    <main className="flex flex-1 px-4 py-6 sm:px-6 lg:px-[8%]">
      <div className="flex w-full flex-col gap-6">
        <Panel className="relative overflow-hidden px-6 py-6 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--color-accent)_26%,transparent),transparent_58%),radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--color-urgency)_18%,transparent),transparent_42%)] before:content-[''] sm:px-8 sm:py-8 lg:px-10">
          <div className="relative space-y-4">
            <span className="font-kicker uppercase tracking-[0.24em] inline-flex w-fit rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Quiz prêts à lancer
            </span>
            <h1 className="m-0 max-w-4xl text-3xl font-semibold leading-tight text-text sm:text-4xl">
              <span className="hero-title-stack">
                <span className="hero-title-line">Tous les quiz live pour</span>
                <span className="hero-typewriter-shell">
                  <TypewriterWords
                    className="hero-typewriter-word"
                    words={["codeurs", "gamers", "builders"]}
                  />
                </span>
              </span>
            </h1>
            <p className="text-text-muted max-w-3xl text-sm sm:text-base">
              Ici tu retrouves les quiz à jouer dans l&apos;univers 42.
            </p>
            <div>
              <PrimaryButton
                className="px-5 py-3 text-sm sm:text-base"
                onClick={() => navigate("/")}
              >
                Retour à l&apos;accueil
              </PrimaryButton>
            </div>
          </div>
        </Panel>

        <Panel className="px-6 py-6 sm:px-8">
          {quizzesLoading ? (
            <p className="m-0 rounded-[22px] border border-primary/25 bg-background px-4 py-4 text-sm text-text/80">
              Chargement des quiz...
            </p>
          ) : null}

          {quizzesError ? (
            <p className="m-0 rounded-[22px] border border-primary/25 bg-background px-4 py-4 text-sm text-text/80">
              {quizzesError}
            </p>
          ) : null}

          {!quizzesLoading && !quizzesError && launchQuizzes.length === 0 && communityQuizzes.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-primary/30 bg-background/70 px-6 py-8 text-center">
              <p className="m-0 text-xl font-semibold text-text">
                Aucun quiz n&apos;est encore disponible.
              </p>
              <p className="text-text-muted mt-3 text-sm">
                Reviens plus tard ou crée un quiz depuis la page dédiée.
              </p>
            </div>
          ) : null}

          {launchQuizzes.length > 0 ? (
            <section className="space-y-4 rounded-[24px] border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-4 sm:p-5">
              <div className="space-y-2">
                <span className="font-kicker uppercase tracking-[0.24em] inline-flex w-fit rounded-full border border-primary/25 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                  Sélection officielle
                </span>
                <h2 className="m-0 text-2xl font-semibold leading-tight text-text sm:text-3xl">
                  Quiz prêts à lancer
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {launchQuizzes.map((quiz) => renderQuizCard(quiz))}
              </div>
            </section>
          ) : null}

          {communityQuizzes.length > 0 ? (
            <section
              className="mt-6 space-y-4 rounded-[24px] border border-urgency/20 bg-gradient-to-br from-urgency/10 to-transparent p-4 sm:p-5"
              id="community-quizzes"
            >
              <div className="space-y-2">
                <span className="font-kicker uppercase tracking-[0.24em] inline-flex w-fit rounded-full border border-urgency/30 bg-urgency/15 px-3 py-1 text-xs font-semibold text-urgency">
                  Sélection des joueurs
                </span>
                <h2 className="m-0 text-2xl font-semibold leading-tight text-text sm:text-3xl">
                  Quiz créés par les Studs
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {communityQuizzes.map((quiz) => renderQuizCard(quiz))}
              </div>
            </section>
          ) : null}
        </Panel>
      </div>
    </main>
  );
}
