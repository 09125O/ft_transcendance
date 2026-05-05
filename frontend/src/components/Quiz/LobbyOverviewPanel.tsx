import { useEffect, useState } from "react";
import Panel from "../Panel";
import PrimaryButton from "../PrimaryButton";
import SecondaryButton from "../SecondaryButton";
import TypewriterWords from "../TypewriterWords";
import {
  decorateQuiz,
  getLaunchQuizzes,
} from "../../content/quizCatalog";
import { useQuizLibrary } from "../../hooks/useQuizLibrary";
import type { Room } from "../../services/quiz";
import type { Quiz } from "../../services/quizzes";

type LobbyOverviewPanelProps = {
  rooms: Room[];
  roomsLoading: boolean;
  roomsError: string | null;
  actionsDisabled: boolean;
  onGoToReadyQuizzes: () => void;
  onOpenQuizConfigurator: (quiz: Quiz) => void;
  onGoToCreateQuiz: () => void;
  onJoinRoom: (room: Room) => Promise<void>;
  onRequireAuth: () => void;
};

type LobbyQuizSlide = {
  id: string;
  badge: string;
  level: string;
  title: string;
  summary: string;
  meta: string[];
  accent: "primary" | "urgency";
  quiz?: Quiz;
  cardImageUrl?: string;
  cardImagePosition?: string;
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
        <p className="text-text-muted mt-3 max-w-3xl text-sm sm:text-base">
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
  onOpenQuizConfigurator,
  onGoToCreateQuiz,
  onJoinRoom,
  onRequireAuth,
}: LobbyOverviewPanelProps) {
  const { quizzes, quizzesLoading, quizzesError } = useQuizLibrary();
  const hasRooms = rooms.length > 0;
  const visibleRooms = rooms.slice(0, 6);
  const roomsMessage = roomsLoading
    ? "Chargement des parties..."
    : roomsError ?? null;
  const launchQuizSlides: LobbyQuizSlide[] = getLaunchQuizzes(quizzes)
    .map((quiz) => {
      const decoratedQuiz = decorateQuiz(quiz);

      return {
        id: `quiz-${quiz.id}`,
        badge: decoratedQuiz.category.title,
        level: decoratedQuiz.level,
        title: quiz.title,
        summary: decoratedQuiz.summary,
        meta: [],
        accent: "primary",
        quiz,
        cardImageUrl: decoratedQuiz.cardImageUrl,
        cardImagePosition: decoratedQuiz.cardImagePosition,
      };
    });
  const slides: LobbyQuizSlide[] = [
    ...launchQuizSlides,
    {
      id: "community",
      badge: "Communauté",
      level: "Ouvert",
      title: "Quiz créés par les Studs",
      summary:
        "Découvre les quiz de la communauté et trouve rapidement une idée de room à lancer.",
      meta: ["Créations joueurs", "Nouveautés live"],
      accent: "urgency",
    },
  ];
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  useEffect(() => {
    if (slides.length === 0) {
      setActiveSlideIndex(0);
      return;
    }

    setActiveSlideIndex((currentIndex) =>
      Math.min(currentIndex, slides.length - 1),
    );
  }, [slides.length]);

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

  const activeSlide = slides[activeSlideIndex] ?? null;

  const getCoverflowOffset = (index: number) => {
    const total = slides.length;

    if (total <= 1) {
      return 0;
    }

    let offset = index - activeSlideIndex;

    if (offset > total / 2) {
      offset -= total;
    } else if (offset < -total / 2) {
      offset += total;
    }

    return offset;
  };

  const moveCarousel = (direction: -1 | 1) => {
    if (slides.length === 0) {
      return;
    }

    setActiveSlideIndex((currentIndex) => {
      const nextIndex = currentIndex + direction;

      if (nextIndex < 0) {
        return slides.length - 1;
      }

      if (nextIndex >= slides.length) {
        return 0;
      }

      return nextIndex;
    });
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <Panel className="relative overflow-hidden px-6 py-6 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--color-accent)_26%,transparent),transparent_58%),radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--color-urgency)_18%,transparent),transparent_42%)] before:content-[''] sm:px-8 sm:py-8 lg:px-10">
        <div className="relative space-y-5">
          <div className="space-y-5">
            <span className="font-kicker uppercase tracking-[0.24em] inline-flex w-fit rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Univers 42
            </span>
            <div className="space-y-3">
              <h1 className="m-0 max-w-4xl text-4xl font-semibold leading-tight text-text sm:text-5xl">
                <span className="hero-title-stack">
                  <span className="hero-title-line">Live Quiz pour</span>
                  <span className="hero-typewriter-shell">
                    <TypewriterWords
                      className="hero-typewriter-word"
                      words={["codeurs", "gamers", "builders"]}
                    />
                  </span>
                </span>
              </h1>
              <p className="text-text-muted max-w-2xl text-sm sm:text-base">
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
              <SecondaryButton
                className="px-5 py-3 text-sm sm:text-base"
                onClick={handleCreateQuiz}
              >
                Créer un quiz
              </SecondaryButton>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel className="flex h-full flex-col px-6 py-6 sm:px-8">
          <div id="ready-to-play" />
          <SectionHeader title="Quiz prêts à lancer" />
          <div className="flex h-full flex-col gap-4">
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

            {!quizzesLoading && !quizzesError && slides.length > 0 ? (
              <div
                className="relative min-h-[32rem] overflow-hidden bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-surface)_24%,transparent)_0%,transparent_24%,color-mix(in_srgb,var(--color-background)_18%,transparent)_100%)] px-2 py-8 sm:px-4 sm:py-10"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    moveCarousel(-1);
                  }

                  if (event.key === "ArrowRight") {
                    event.preventDefault();
                    moveCarousel(1);
                  }
                }}
              >
                <div className="pointer-events-none absolute inset-x-[12%] top-8 h-16 rounded-full bg-primary/12 blur-3xl" />
                <div className="pointer-events-none absolute inset-x-[18%] bottom-8 h-10 rounded-full bg-[color:color-mix(in_srgb,var(--color-background)_28%,transparent)] blur-2xl" />
                <div className="pointer-events-none absolute left-[12%] top-0 h-full w-16 bg-gradient-to-r from-surface via-surface/55 to-transparent" />
                <div className="pointer-events-none absolute right-[12%] top-0 h-full w-16 bg-gradient-to-l from-surface via-surface/55 to-transparent" />

                <div className="relative h-[22rem] overflow-hidden px-10 [perspective:1200px] sm:h-[24rem] sm:px-12 lg:h-[25rem]">
                  <button
                    aria-label="Voir la carte précédente"
                    className="absolute left-1 top-1/2 z-30 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-primary/25 bg-background/84 text-xl text-text shadow-[0_20px_36px_-28px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] transition hover:-translate-y-[52%] hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:left-2"
                    type="button"
                    onClick={() => moveCarousel(-1)}
                  >
                    ‹
                  </button>

                  <button
                    aria-label="Voir la carte suivante"
                    className="absolute right-1 top-1/2 z-30 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-primary/25 bg-background/84 text-xl text-text shadow-[0_20px_36px_-28px_color-mix(in_srgb,var(--color-primary)_55%,transparent)] transition hover:-translate-y-[52%] hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:right-2"
                    type="button"
                    onClick={() => moveCarousel(1)}
                  >
                    ›
                  </button>

                  {slides.map((slide, index) => {
                    const offset = getCoverflowOffset(index);
                    const distance = Math.abs(offset);
                    const hidden = distance > 2;
                    const translateX = offset * 132;
                    const translateY = distance * 6;
                    const rotateY = offset * -18;
                    const scale = Math.max(0.82, 1 - distance * 0.09);
                    const opacity = Math.max(0.42, 1 - distance * 0.22);
                    const zIndex = slides.length - distance;
                    const isActive = offset === 0;

                    return (
                      <div
                        aria-current={isActive}
                        aria-label={`Afficher ${slide.title}`}
                        className={`absolute left-1/2 top-1/2 block h-[16.75rem] w-[15rem] max-w-[calc(100%-5rem)] cursor-pointer text-left transition-[transform,opacity,filter] duration-500 ease-out sm:h-[18rem] sm:w-[16rem] lg:h-[18.75rem] lg:w-[17.5rem] ${
                          isActive ? "" : "hover:brightness-105"
                        }`}
                        key={slide.id}
                        role="button"
                        style={{
                          filter: `brightness(${distance === 0 ? 1 : Math.max(0.82, 1 - distance * 0.08)}) saturate(${isActive ? 1 : 0.88})`,
                          opacity,
                          pointerEvents: hidden ? "none" : "auto",
                          transform: `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) rotateY(${rotateY}deg) scale(${scale})`,
                          transformOrigin: "center center",
                          zIndex,
                        }}
                        tabIndex={0}
                        onClick={() => {
                          if (isActive && slide.quiz) {
                            onOpenQuizConfigurator(slide.quiz);
                            return;
                          }
                          if (isActive) {
                            onGoToReadyQuizzes();
                            return;
                          }
                          setActiveSlideIndex(index);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            if (isActive && slide.quiz) {
                              onOpenQuizConfigurator(slide.quiz);
                              return;
                            }
                            if (isActive) {
                              onGoToReadyQuizzes();
                              return;
                            }
                            setActiveSlideIndex(index);
                          }
                        }}
                      >
                        <article
                          className={`relative flex h-full flex-col justify-between overflow-hidden rounded-[24px] border p-4 shadow-[0_38px_90px_-48px_color-mix(in_srgb,var(--color-primary)_60%,transparent)] transition duration-500 sm:p-5 ${
                            slide.accent === "urgency"
                              ? "border-urgency/35 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-background)_98%,white_2%),color-mix(in_srgb,var(--color-urgency)_10%,var(--color-background)_90%))]"
                              : "border-primary/30 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-background)_98%,white_2%),color-mix(in_srgb,var(--color-primary)_10%,var(--color-background)_90%))]"
                          } ${isActive ? "ring-1 ring-primary/35 shadow-[0_44px_95px_-55px_color-mix(in_srgb,var(--color-primary)_88%,transparent)]" : "ring-1 ring-black/5"}`}
                        >
                          {slide.cardImageUrl ? (
                            <>
                              <div
                                aria-hidden="true"
                                className="absolute inset-0 scale-[1.04] bg-cover opacity-72 brightness-[1.1] saturate-[1.08]"
                                style={{
                                  backgroundImage: `url(${slide.cardImageUrl})`,
                                  backgroundPosition:
                                    slide.cardImagePosition ?? "center",
                                }}
                              />
                              <div
                                aria-hidden="true"
                                className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-background)_18%,transparent)_0%,color-mix(in_srgb,var(--color-background)_34%,transparent)_24%,color-mix(in_srgb,var(--color-background)_62%,transparent)_54%,color-mix(in_srgb,var(--color-background)_90%,var(--color-surface))_82%,color-mix(in_srgb,var(--color-background)_96%,var(--color-surface))_100%)]"
                              />
                              <div
                                aria-hidden="true"
                                className="absolute inset-0 bg-[linear-gradient(120deg,color-mix(in_srgb,var(--color-background)_72%,transparent)_0%,color-mix(in_srgb,var(--color-background)_44%,transparent)_32%,transparent_62%)]"
                              />
                            </>
                          ) : null}

                          <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--color-primary)_10%,transparent),transparent_44%)]"
                          />

                          <div className="relative space-y-3">

                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${
                                  slide.accent === "urgency"
                                    ? "border border-urgency/30 bg-urgency/15 text-urgency"
                                    : "border border-primary/20 bg-primary/10 text-primary"
                                }`}
                              >
                                {slide.badge}
                              </span>
                              <span className="rounded-full border border-text/10 bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-text/70">
                                {slide.level}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <h3 className="m-0 text-lg font-semibold text-text sm:text-xl">
                                {slide.title}
                              </h3>
                              <p className="text-text-muted m-0 line-clamp-4 text-sm">
                                {slide.summary}
                              </p>
                            </div>
                          </div>

                          {slide.meta.length > 0 ? (
                            <div className="relative space-y-3">
                              <div className="flex flex-wrap gap-2 text-xs text-text/70">
                                {slide.meta.map((item) => (
                                  <span
                                    className="rounded-full border border-text/10 bg-background px-3 py-1"
                                    key={item}
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </article>
                      </div>
                    );
                  })}
                </div>

                <div className="relative mt-4 flex items-center justify-center gap-2">
                  {slides.map((slide, index) => {
                    const isActive = index === activeSlideIndex;

                    return (
                      <button
                        aria-label={`Aller à ${slide.title}`}
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          isActive ? "w-10 bg-primary" : "w-2.5 bg-text/20 hover:bg-text/35"
                        }`}
                        key={slide.id}
                        type="button"
                        onClick={() => {
                          setActiveSlideIndex(index);
                        }}
                      />
                    );
                  })}
                </div>

                {activeSlide ? (
                  <div className="relative mx-auto mt-6 max-w-3xl rounded-[24px] border border-primary/20 bg-background/72 px-5 py-5 shadow-[0_24px_64px_-44px_color-mix(in_srgb,var(--color-primary)_62%,transparent)] backdrop-blur-xl sm:px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div className="space-y-2">
                        <p className="font-kicker m-0 text-xs uppercase tracking-[0.24em] text-text/55">
                          Carte {activeSlideIndex + 1} / {slides.length}
                        </p>
                        <h3 className="m-0 text-2xl font-semibold text-text">
                          {activeSlide.title}
                        </h3>
                        <p className="text-text-muted m-0 max-w-2xl text-sm sm:text-base">
                          {activeSlide.summary}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:items-end">
                        {activeSlide.meta.length > 0 ? (
                          <div className="flex flex-wrap gap-2 text-xs text-text/70 sm:justify-end">
                            {activeSlide.meta.map((item) => (
                              <span
                                className="rounded-full border border-text/10 bg-background px-3 py-1"
                                key={item}
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <PrimaryButton
                          className="w-56 justify-center px-5 py-3 text-sm"
                          onClick={onGoToReadyQuizzes}
                        >
                          Ouvrir la bibliothèque
                        </PrimaryButton>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
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
                <p className="text-text-muted mt-3 text-sm">
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
                    <p className="text-text-muted mt-1 text-xs sm:text-sm">
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
              <p className="text-text-muted m-0 text-xs sm:text-sm">
                {rooms.length - visibleRooms.length} autres rooms actives non affichées.
              </p>
            ) : null}

            <div className="rounded-[22px] border border-primary/20 bg-background/75 px-5 py-5">
              <h3 className="m-0 text-xl font-semibold text-text">Créer ton propre quiz</h3>
              <p className="text-text-muted mt-2 text-sm sm:text-base">
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
