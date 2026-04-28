import { useEffect, useRef, useState } from "react";
import Panel from "../Panel";
import DangerButton from "../DangerButton";
import PrimaryButton from "../PrimaryButton";
import SecondaryButton from "../SecondaryButton";
import type { PublicQuestion } from "../../types/game";

type ScoreEntry = {
  userId: number;
  username: string;
  avatarUrl: string | null;
  score: number;
};

type ChatEntry = {
  userId: number;
  username: string;
  content: string;
  sentAt: string;
  isSelf: boolean;
};

type GamePanelProps = {
  onToggleRules: () => void;
  onLeaveRoom: () => void;
  onStartRoom: () => void;
  canStartRoom: boolean;
  roomStatus: "waiting" | "playing" | "finished" | null;
  selectedAnswer: number | null;
  correctAnswerIndex: number | null;
  answerFeedback: "correct" | "incorrect" | null;
  timerDurationMs: number | null;
  timerRemainingMs: number | null;
  onSelectAnswer: (answerIndex: number) => void;
  currentQuestion: PublicQuestion | null;
  scoreEntries: ScoreEntry[];
  chatMessages: ChatEntry[];
  chatError: string | null;
  onSendChatMessage: (content: string) => void;
};

export default function GamePanel({
  onToggleRules,
  onLeaveRoom,
  onStartRoom,
  canStartRoom,
  roomStatus,
  selectedAnswer,
  correctAnswerIndex,
  answerFeedback,
  timerDurationMs,
  timerRemainingMs,
  onSelectAnswer,
  currentQuestion,
  scoreEntries,
  chatMessages,
  chatError,
  onSendChatMessage,
}: GamePanelProps) {
  const [messageInput, setMessageInput] = useState("");
  const [mobileTab, setMobileTab] = useState<"stage" | "score" | "chat">("stage");
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const hasQuestion = currentQuestion !== null;
  const isFinished = roomStatus === "finished";
  const leader = scoreEntries[0] ?? null;
  const timerProgress =
    timerDurationMs && timerDurationMs > 0 && typeof timerRemainingMs === "number"
      ? Math.max(0, Math.min(100, (timerRemainingMs / timerDurationMs) * 100))
      : null;

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [chatMessages]);

  const handleSendMessage = () => {
    const content = messageInput.trim();
    if (!content) {
      return;
    }
    onSendChatMessage(content);
    setMessageInput("");
  };

  return (
    <div className="grid w-full gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,22rem)]">
      <div className="xl:hidden">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-primary/20 bg-background/70 p-2">
          <button
            className={[
              "rounded-xl px-3 py-2 text-sm font-semibold transition duration-200",
              mobileTab === "stage"
                ? "bg-primary text-text"
                : "bg-background text-text/80 hover:bg-text/5",
            ].join(" ")}
            type="button"
            onClick={() => setMobileTab("stage")}
          >
            Question
          </button>
          <button
            className={[
              "rounded-xl px-3 py-2 text-sm font-semibold transition duration-200",
              mobileTab === "score"
                ? "bg-primary text-text"
                : "bg-background text-text/80 hover:bg-text/5",
            ].join(" ")}
            type="button"
            onClick={() => setMobileTab("score")}
          >
            Classement
          </button>
          <button
            className={[
              "rounded-xl px-3 py-2 text-sm font-semibold transition duration-200",
              mobileTab === "chat"
                ? "bg-primary text-text"
                : "bg-background text-text/80 hover:bg-text/5",
            ].join(" ")}
            type="button"
            onClick={() => setMobileTab("chat")}
          >
            Chat
          </button>
        </div>
      </div>

      <Panel className={[
        "order-1 relative overflow-hidden px-5 py-5 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--color-accent)_24%,transparent),transparent_58%),radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--color-urgency)_16%,transparent),transparent_42%)] before:content-[''] sm:px-7 sm:py-6 xl:min-h-[80vh]",
        mobileTab === "stage" ? "block" : "hidden xl:block",
      ].join(" ")}>
        <div className="relative flex h-full flex-col">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-3xl space-y-3">
              <span className="font-kicker uppercase tracking-[0.24em] inline-flex w-fit rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {isFinished
                  ? "Partie terminee"
                  : hasQuestion
                    ? "Question active"
                    : roomStatus === "playing"
                      ? "Transition"
                      : "Salon en attente"}
              </span>
              <div className="space-y-2">
                <p className="font-kicker uppercase tracking-[0.24em] m-0 text-sm text-text/55">
                  Table de jeu
                </p>
                <p className="m-0 text-balance text-3xl font-semibold leading-tight text-text sm:text-4xl">
                  {currentQuestion?.text ??
                    (isFinished
                      ? "Le quiz est termine."
                      : "Le salon est prêt. Lance la partie quand tout le monde est installé.")}
                </p>
              </div>
              {!hasQuestion ? (
                <p className="text-text-muted m-0 max-w-2xl text-sm sm:text-base">
                  {isFinished
                    ? "La partie est finie. Consulte le classement final ou quitte la room."
                    : "Le panneau principal sert maintenant d’espace focal. Dès qu’une question démarre, les propositions prennent tout le premier rôle."}
                </p>
              ) : null}
              {selectedAnswer !== null ? (
                <p
                  className={[
                    "m-0 text-sm font-semibold",
                    answerFeedback === "correct"
                      ? "text-success"
                      : answerFeedback === "incorrect"
                        ? "text-danger"
                        : "text-text/70",
                  ].join(" ")}
                >
                  {answerFeedback === "correct"
                    ? "Bonne reponse"
                    : answerFeedback === "incorrect"
                      ? `Mauvaise reponse${correctAnswerIndex !== null ? ` - la bonne etait la reponse ${correctAnswerIndex + 1}` : ""}`
                      : "Reponse envoyee..."}
                </p>
              ) : null}
              {hasQuestion && timerProgress !== null ? (
                <div className="mt-2 max-w-2xl space-y-2">
                  <div className="h-2.5 overflow-hidden rounded-full bg-text/10">
                    <div
                      className={[
                        "h-full rounded-full transition-[width,background-color] duration-100 ease-linear",
                        timerProgress <= 25
                          ? "bg-danger"
                          : timerProgress <= 50
                            ? "bg-urgency"
                            : "bg-accent",
                      ].join(" ")}
                      style={{ width: `${timerProgress}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 self-start">
              {canStartRoom ? (
                <PrimaryButton
                  className="px-4 py-2.5 text-sm"
                  onClick={onStartRoom}
                >
                  Démarrer
                </PrimaryButton>
              ) : null}
              <SecondaryButton
                className="px-4 py-2.5 text-sm"
                onClick={onToggleRules}
              >
                Règles
              </SecondaryButton>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center">
            {currentQuestion ? (
              <div className="grid gap-3 md:grid-cols-2">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrectOption = correctAnswerIndex === index;
                  const showAnswerState = selectedAnswer !== null && answerFeedback !== null;

                  return (
                    <button
                      className={[
                        "group flex min-h-28 flex-col justify-between rounded-[24px] border px-5 py-4 text-left transition duration-200",
                        showAnswerState && isCorrectOption
                          ? "border-success/75 bg-success/22 shadow-[0_28px_48px_-32px_color-mix(in_srgb,var(--color-success)_88%,transparent)]"
                          : showAnswerState && isSelected && answerFeedback === "incorrect"
                            ? "border-danger/75 bg-danger/20 shadow-[0_28px_48px_-32px_color-mix(in_srgb,var(--color-danger)_86%,transparent)]"
                            : isSelected
                              ? "border-primary bg-primary text-text shadow-[0_28px_48px_-32px_color-mix(in_srgb,var(--color-primary)_88%,transparent)]"
                              : "border-primary/20 bg-background/85 hover:border-primary/55 hover:bg-text/5",
                      ].join(" ")}
                      key={`${currentQuestion.id}-${index}-${option}`}
                      type="button"
                      disabled={selectedAnswer !== null}
                      onClick={() => onSelectAnswer(index)}
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-text/55">
                        Réponse {index + 1}
                      </span>
                      <span className="text-lg font-medium">
                        {option}
                      </span>
                      {showAnswerState && isSelected ? (
                        <span
                          className={[
                            "mt-2 inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold",
                            answerFeedback === "correct"
                              ? "bg-success/25 text-success"
                              : "bg-danger/25 text-danger",
                          ].join(" ")}
                        >
                          {answerFeedback === "correct" ? "Ton choix est correct" : "Ton choix est incorrect"}
                        </span>
                      ) : null}
                      {showAnswerState && answerFeedback === "incorrect" && isCorrectOption && !isSelected ? (
                        <span className="mt-2 inline-flex w-fit rounded-full bg-success/25 px-2.5 py-1 text-xs font-semibold text-success">
                          Bonne réponse
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-primary/25 bg-background/70 px-6 py-10 text-center">
                <p className="font-kicker uppercase tracking-[0.24em] m-0 text-sm text-text/55">
                  {isFinished ? "Partie terminee" : "Prêt à jouer"}
                </p>
                <p className="text-text-muted mt-3 text-lg">
                  {isFinished
                    ? "Le quiz est terminé. Le classement final reste visible dans le panneau de droite."
                    : "Le chat et le classement restent disponibles, mais l’espace central attend le top départ."}
                </p>
              </div>
            )}
          </div>
        </div>
      </Panel>

      <div className="order-2 grid gap-4 xl:h-[80vh] xl:grid-rows-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Panel className={[
          "px-4 py-4 sm:px-5 sm:py-5 xl:h-full xl:min-h-0",
          mobileTab === "score" ? "block" : "hidden xl:block",
        ].join(" ")}>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="font-kicker uppercase tracking-[0.24em] m-0 text-xs font-semibold text-text/55">
                Classement
              </p>
              <p className="m-0 text-2xl font-semibold text-text">Points</p>
            </div>
            <DangerButton
              className="px-4 py-2.5 text-sm"
              onClick={onLeaveRoom}
            >
              Quitter
            </DangerButton>
          </div>

          <div className="mb-4 rounded-[22px] border border-primary/20 bg-background/80 px-4 py-4">
            <p className="font-kicker uppercase tracking-[0.24em] m-0 text-xs font-semibold text-text/55">
              Leader actuel
            </p>
            <p className="mt-2 text-lg font-semibold text-text">
              {leader?.username ?? "Aucun joueur"}
            </p>
            <p className="text-text-muted m-0 text-sm">
              {leader
                ? `${leader.score} point${leader.score > 1 ? "s" : ""} en tête`
                : "Le tableau se remplira dès les premières réponses."}
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {scoreEntries.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-primary/25 bg-background/70 px-5 py-6 text-sm text-text/70">
                Aucun score à afficher pour l’instant.
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
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        index === 0
                          ? "bg-primary text-text"
                          : "bg-text/8 text-text/75",
                      ].join(" ")}
                    >
                      {index + 1}
                    </span>
                    {entry.avatarUrl ? (
                      <img
                        alt={`Avatar de ${entry.username}`}
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                        src={entry.avatarUrl}
                      />
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-text/8 text-sm font-semibold text-text/75">
                        {entry.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="m-0 truncate font-medium text-text">
                        {entry.username}
                      </p>
                      <p className="m-0 text-xs text-text/55">
                        {index === 0 || !leader
                          ? "En tête"
                          : `${leader.score - entry.score} point${leader.score - entry.score > 1 ? "s" : ""} de retard`}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-semibold text-text">
                    {entry.score}
                  </span>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel className={[
          "min-h-[20rem] overflow-hidden px-4 py-4 sm:px-5 sm:py-5 xl:h-full xl:min-h-0",
          mobileTab === "chat" ? "block" : "hidden xl:block",
        ].join(" ")}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-kicker uppercase tracking-[0.24em] m-0 text-xs font-semibold text-text/55">
                Conversation
              </p>
              <p className="m-0 text-2xl font-semibold text-text">Chat</p>
            </div>
            <span className="rounded-full border border-primary/20 bg-background px-3 py-1 text-xs text-text/75">
              {chatMessages.length} message{chatMessages.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <div
              className="flex h-full flex-col gap-3 overflow-y-auto pr-2"
              ref={messagesContainerRef}
            >
              {chatMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-[22px] border border-dashed border-primary/25 bg-background/70 px-6 text-center text-sm text-text/70">
                  La conversation s&apos;ouvrira dès que les joueurs commenceront à échanger.
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    className={[
                      "max-w-[85%] rounded-2xl px-4 py-3 shadow-[0_18px_45px_-34px_color-mix(in_srgb,var(--color-background)_80%,transparent)]",
                      message.isSelf ? "self-end bg-primary text-text" : "bg-background",
                    ].join(" ")}
                    key={`${message.userId}-${message.sentAt}-${message.content}`}
                  >
                    {!message.isSelf ? (
                      <p className="m-0 text-sm text-text/70">{message.username}</p>
                    ) : null}
                    <p className="m-0 text-base text-text">{message.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <form
            className="mt-4 flex shrink-0 items-center gap-3 rounded-2xl bg-background px-4 py-3"
            onSubmit={(event) => {
              event.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              className="min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-text/50"
              type="text"
              placeholder="Écrire un message..."
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
            />
            <PrimaryButton className="shrink-0 px-4 py-2 text-sm" type="submit">
              Envoyer
            </PrimaryButton>
          </form>
          {chatError ? (
            <p className="mt-3 text-sm text-danger">{chatError}</p>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
