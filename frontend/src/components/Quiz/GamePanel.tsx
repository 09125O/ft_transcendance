import { useEffect, useRef, useState } from "react";
import Panel from "../Panel";
import PrimaryButton from "../PrimaryButton";
import type { PublicQuestion } from "../../types/game";

type ScoreEntry = {
  userId: number;
  username: string;
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
  selectedAnswer: number | null;
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
  selectedAnswer,
  onSelectAnswer,
  currentQuestion,
  scoreEntries,
  chatMessages,
  chatError,
  onSendChatMessage,
}: GamePanelProps) {
  const [messageInput, setMessageInput] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const hasQuestion = currentQuestion !== null;
  const leader = scoreEntries[0] ?? null;

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
    <div className="grid w-full gap-4 xl:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)_minmax(16rem,20rem)]">
      <Panel className="order-3 min-h-[24rem] overflow-hidden px-4 py-4 sm:px-5 sm:py-5 xl:order-1 xl:h-[80vh]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em] text-text/45">
              Conversation
            </p>
            <p className="m-0 text-2xl font-semibold text-text">Chat</p>
          </div>
          <span className="rounded-full border border-white/10 bg-background px-3 py-1 text-xs text-text/65">
            {chatMessages.length} message{chatMessages.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <div
            className="flex h-full flex-col gap-3 overflow-y-auto pr-2"
            ref={messagesContainerRef}
          >
            {chatMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-[22px] border border-dashed border-white/10 bg-background/70 px-6 text-center text-sm text-text/60">
                La conversation s&apos;ouvrira dès que les joueurs commenceront à échanger.
              </div>
            ) : (
              chatMessages.map((message) => (
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-4 py-3 shadow-[0_18px_45px_-34px_rgba(0,0,0,0.8)]",
                    message.isSelf ? "self-end bg-primary" : "bg-background",
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
          <p className="mt-3 text-sm text-red-300">{chatError}</p>
        ) : null}
      </Panel>

      <Panel className="order-1 relative overflow-hidden px-5 py-5 sm:px-7 sm:py-6 xl:order-2 xl:min-h-[80vh]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.24),transparent_58%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_42%)]" />
        <div className="relative flex h-full flex-col">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-3xl space-y-3">
              <span className="inline-flex w-fit rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                {hasQuestion ? "Question active" : "Salon en attente"}
              </span>
              <div className="space-y-2">
                <p className="m-0 text-sm uppercase tracking-[0.24em] text-text/50">
                  Table de jeu
                </p>
                <p className="m-0 text-balance text-3xl font-semibold leading-tight text-text sm:text-4xl">
                  {currentQuestion?.text ?? "Le salon est prêt. Lance la partie quand tout le monde est installé."}
                </p>
              </div>
              <p className="m-0 max-w-2xl text-sm text-text/65 sm:text-base">
                {hasQuestion
                  ? "Choisis rapidement une réponse. Le centre de l’écran porte toute l’action, les panneaux latéraux restent utilitaires."
                  : "Le panneau principal sert maintenant d’espace focal. Dès qu’une question démarre, les propositions prennent tout le premier rôle."}
              </p>
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
              <button
                className="rounded-xl border border-white/10 bg-background px-4 py-2.5 text-sm font-semibold text-text transition hover:border-primary/50 hover:bg-white/5"
                type="button"
                onClick={onToggleRules}
              >
                Règles
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center">
            {currentQuestion ? (
              <div className="grid gap-3 md:grid-cols-2">
                {currentQuestion.options.map((option, index) => (
                  <button
                    className={[
                      "group flex min-h-28 flex-col justify-between rounded-[24px] border px-5 py-4 text-left transition",
                      selectedAnswer === index
                        ? "border-primary bg-primary shadow-[0_28px_48px_-32px_rgba(124,58,237,0.95)]"
                        : "border-white/10 bg-background/85 hover:border-primary/50 hover:bg-white/5",
                    ].join(" ")}
                    key={`${currentQuestion.id}-${index}-${option}`}
                    type="button"
                    onClick={() => onSelectAnswer(index)}
                  >
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-text/55">
                      Réponse {index + 1}
                    </span>
                    <span className="text-lg font-medium text-text">
                      {option}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/10 bg-background/70 px-6 py-10 text-center">
                <p className="m-0 text-sm uppercase tracking-[0.24em] text-text/45">
                  Prêt à jouer
                </p>
                <p className="mt-3 text-lg text-text/75">
                  Le chat et le classement restent disponibles, mais l’espace central attend le top départ.
                </p>
              </div>
            )}
          </div>
        </div>
      </Panel>

      <Panel className="order-2 px-4 py-4 sm:px-5 sm:py-5 xl:order-3 xl:min-h-[80vh]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em] text-text/45">
              Classement
            </p>
            <p className="m-0 text-2xl font-semibold text-text">Points</p>
          </div>
          <button
            className="rounded-xl border border-white/10 bg-background px-4 py-2.5 text-sm font-semibold text-text transition hover:border-red-300/35 hover:bg-red-400/10"
            type="button"
            onClick={onLeaveRoom}
          >
            Quitter
          </button>
        </div>

        <div className="mb-4 rounded-[22px] border border-white/10 bg-background/80 px-4 py-4">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.22em] text-text/45">
            Leader actuel
          </p>
          <p className="mt-2 text-lg font-semibold text-text">
            {leader?.username ?? "Aucun joueur"}
          </p>
          <p className="m-0 text-sm text-text/65">
            {leader
              ? `${leader.score} point${leader.score > 1 ? "s" : ""} en tête`
              : "Le tableau se remplira dès les premières réponses."}
          </p>
        </div>

        <div className="space-y-3">
          {scoreEntries.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-white/10 bg-background/70 px-5 py-6 text-sm text-text/60">
              Aucun score à afficher pour l’instant.
            </div>
          ) : (
            scoreEntries.map((entry, index) => (
              <div
                className="flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-background/80 px-4 py-3"
                key={entry.userId}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      index === 0
                        ? "bg-primary text-text"
                        : "bg-white/8 text-text/75",
                    ].join(" ")}
                  >
                    {index + 1}
                  </span>
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
    </div>
  );
}
