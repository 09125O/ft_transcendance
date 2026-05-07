import { useEffect, useRef, useState } from "react";
import Panel from "../Panel";
import PrimaryButton from "../PrimaryButton";
import SecondaryButton from "../SecondaryButton";

type ScoreEntry = {
  userId: number;
  username: string;
  avatarUrl: string | null;
  score: number;
};

type ResultsPanelProps = {
  roomName: string;
  scoreEntries: ScoreEntry[];
  chatMessages: Array<{
    userId: number;
    username: string;
    content: string;
    sentAt: string;
    isSelf: boolean;
  }>;
  chatError: string | null;
  onSendChatMessage: (content: string) => void;
  onLeaveRoom: () => void;
  onOpenRules: () => void;
};

export default function ResultsPanel({
  roomName,
  scoreEntries,
  chatMessages,
  chatError,
  onSendChatMessage,
  onLeaveRoom,
  onOpenRules,
}: ResultsPanelProps) {
  const [messageInput, setMessageInput] = useState("");
  const [mobileTab, setMobileTab] = useState<"podium" | "chat">("chat");
  const [lastReadChatCount, setLastReadChatCount] = useState(chatMessages.length);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const displayRoomName = roomName.replace(/\s-\s\d{2}:\d{2}$/, "").trim();
  const winner = scoreEntries[0] ?? null;
  const unreadChatCount = Math.max(0, chatMessages.length - lastReadChatCount);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [chatMessages]);

  useEffect(() => {
    if (mobileTab === "chat") {
      setLastReadChatCount(chatMessages.length);
    }
  }, [chatMessages.length, mobileTab]);

  const handleSendMessage = () => {
    const content = messageInput.trim();
    if (!content) {
      return;
    }

    onSendChatMessage(content);
    setMessageInput("");
  };

  const getPodiumColorRank = (index: number) => {
    if (index <= 0) {
      return 1;
    }

    const currentScore = scoreEntries[index]?.score;
    if (typeof currentScore !== "number") {
      return index + 1;
    }

    for (let previousIndex = index - 1; previousIndex >= 0; previousIndex -= 1) {
      if (scoreEntries[previousIndex]?.score !== currentScore) {
        return previousIndex + 2;
      }
    }

    return 1;
  };

  return (
    <div className="grid w-full gap-4 md:grid-cols-[minmax(16rem,18rem)_minmax(0,1fr)] xl:grid-cols-[minmax(16rem,18rem)_minmax(0,1fr)_minmax(21rem,24rem)]">
      <div className="md:hidden">
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-primary/20 bg-background/70 p-2">
          <button
            className={[
              "rounded-xl px-3 py-2 text-sm font-semibold transition duration-200",
              mobileTab === "podium"
                ? "bg-primary text-text"
                : "bg-background text-text/80 hover:bg-text/5",
            ].join(" ")}
            type="button"
            onClick={() => setMobileTab("podium")}
          >
            Podium
          </button>
          <button
            className={[
              "relative rounded-xl px-3 py-2 text-sm font-semibold transition duration-200",
              mobileTab === "chat"
                ? "bg-primary text-text"
                : "bg-background text-text/80 hover:bg-text/5",
            ].join(" ")}
            type="button"
            onClick={() => setMobileTab("chat")}
          >
            Chat
            {unreadChatCount > 0 && mobileTab !== "chat" ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-text shadow-[0_6px_16px_-8px_color-mix(in_srgb,var(--color-danger)_95%,transparent)]">
                {unreadChatCount > 99 ? "99+" : unreadChatCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      <Panel className={[
        "order-1 min-h-[20rem] overflow-hidden px-4 py-4 sm:px-5 sm:py-5 md:h-full md:min-h-0 xl:col-start-1 xl:row-start-1",
        mobileTab === "chat" ? "block" : "hidden md:block",
      ].join(" ")}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="m-0 inline-flex items-center gap-2 text-sm font-semibold text-text/80">
            <span>Chat de fin de partie</span>
            {unreadChatCount > 0 && mobileTab !== "chat" ? (
              <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-text shadow-[0_6px_16px_-8px_color-mix(in_srgb,var(--color-danger)_95%,transparent)]">
                {unreadChatCount > 99 ? "99+" : unreadChatCount}
              </span>
            ) : null}
          </p>
          <span className="rounded-full border border-primary/20 bg-background px-2.5 py-1 text-xs text-text/70">
            {chatMessages.length} message{chatMessages.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden md:h-[calc(100%-6.75rem)]">
          <div
            className="flex h-full flex-col gap-3 overflow-y-auto pr-1"
            ref={messagesContainerRef}
          >
            {chatMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 py-3 text-center text-sm text-text/65">
                Aucun message pour le moment.
              </div>
            ) : (
              chatMessages.map((message) => (
                <div
                  className={[
                    "w-fit max-w-[90%] rounded-xl px-3 py-2 text-sm",
                    message.isSelf ? "ml-auto bg-primary text-text" : "bg-background text-text",
                  ].join(" ")}
                  key={`${message.userId}-${message.sentAt}-${message.content}`}
                >
                  {!message.isSelf ? (
                    <p className="m-0 text-xs text-text/65">{message.username}</p>
                  ) : null}
                  <p className="m-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <form
          className="mt-3 flex items-center gap-2 px-1 py-2"
          onSubmit={(event) => {
            event.preventDefault();
            handleSendMessage();
          }}
        >
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text/50"
            type="text"
            placeholder="Écrire un message..."
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
          />
          <PrimaryButton className="shrink-0 px-3 py-1.5 text-xs" type="submit">
            Envoyer
          </PrimaryButton>
        </form>
        {chatError ? (
          <p className="mt-2 text-xs text-danger">{chatError}</p>
        ) : null}
      </Panel>

      <Panel className="order-2 relative overflow-hidden px-6 py-6 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--color-urgency)_24%,transparent),transparent_58%),radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--color-accent)_20%,transparent),transparent_42%)] before:content-[''] sm:px-8 sm:py-8 md:min-h-[80vh] xl:col-start-2 xl:row-start-1 xl:min-h-[80vh]">
        <div className="relative flex h-full flex-col justify-between gap-8">
          <div className="space-y-4">
            <span className="font-kicker uppercase tracking-[0.24em] inline-flex w-fit rounded-full border border-urgency/25 bg-urgency/10 px-3 py-1 text-xs font-semibold text-urgency">
              Fin de partie
            </span>
            <h1 className="m-0 text-3xl font-semibold leading-tight text-text sm:text-4xl">
              Résultats de {displayRoomName}
            </h1>
          </div>

          <div className="rounded-[24px] border border-primary/20 bg-background/75 px-5 py-5">
            <p className="font-kicker uppercase tracking-[0.24em] m-0 text-xs text-text/55">Vainqueur</p>
            <p className="m-0 mt-2 text-2xl font-semibold text-text">
              {winner?.username ?? "Aucun joueur"}
            </p>
            <p className="text-text-muted m-0 mt-2 text-sm">
              {winner
                ? `${winner.score} point${winner.score > 1 ? "s" : ""}`
                : "Le classement final n&apos;est pas disponible."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <PrimaryButton className="px-5 py-3 text-sm sm:text-base" onClick={onLeaveRoom}>
              Retour au lobby
            </PrimaryButton>
            <SecondaryButton
              className="px-5 py-3 text-sm sm:text-base"
              onClick={onOpenRules}
            >
              Revoir les règles
            </SecondaryButton>
          </div>
        </div>
      </Panel>

      <Panel className={[
        "order-3 px-5 py-5 sm:px-6 sm:py-6 md:col-span-2 xl:col-span-1 xl:col-start-3 xl:row-start-1 xl:min-h-[80vh]",
        mobileTab === "podium" ? "block" : "hidden md:block",
      ].join(" ")}>
        <div className="mb-5">
          <p className="font-kicker uppercase tracking-[0.24em] m-0 text-xs font-semibold text-text/55">Classement final</p>
          <p className="m-0 text-2xl font-semibold text-text">Podium</p>
        </div>

        <div className="mb-5 space-y-3">
          {scoreEntries.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-primary/25 bg-background/70 px-5 py-6 text-sm text-text/70">
              Aucun score à afficher.
            </div>
          ) : (
            scoreEntries.map((entry, index) => {
              const colorRank = getPodiumColorRank(index);

              return (
                <div
                  className="flex items-center justify-between gap-3 rounded-[22px] border border-primary/20 bg-background/80 px-4 py-3"
                  key={entry.userId}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={[
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                        colorRank === 1
                          ? "bg-urgency text-background"
                          : colorRank === 2
                            ? "bg-accent text-text"
                            : colorRank === 3
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
                    <p className="m-0 truncate font-medium text-text">{entry.username}</p>
                  </div>
                  <span className="text-lg font-semibold text-text">{entry.score}</span>
                </div>
              );
            })
          )}
        </div>
      </Panel>
    </div>
  );
}
