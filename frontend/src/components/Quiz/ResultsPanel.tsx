import { useEffect, useRef, useState } from "react";
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
              Résultats de {displayRoomName}
            </h1>
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
        <div className="mb-4 xl:hidden">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-primary/20 bg-background/70 p-2">
            <button
              className={[
                "rounded-xl px-3 py-2 text-sm font-semibold transition duration-200",
                mobileTab === "podium"
                  ? "bg-primary text-[#04111e]"
                  : "bg-background text-text/80 hover:bg-white/5",
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
                  ? "bg-primary text-[#04111e]"
                  : "bg-background text-text/80 hover:bg-white/5",
              ].join(" ")}
              type="button"
              onClick={() => setMobileTab("chat")}
            >
              Chat
              {unreadChatCount > 0 && mobileTab !== "chat" ? (
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-[0_6px_16px_-8px_rgba(239,68,68,0.95)]">
                  {unreadChatCount > 99 ? "99+" : unreadChatCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div className="mb-5">
          <p className="ui-kicker m-0 text-xs font-semibold text-text/55">Classement final</p>
          <p className="m-0 text-2xl font-semibold text-text">Podium</p>
        </div>

        <div
          className={[
            "mb-5 space-y-3",
            mobileTab === "podium" ? "block" : "hidden xl:block",
          ].join(" ")}
        >
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

        <div
          className={[
            "rounded-[22px] border border-primary/20 bg-background/70 p-4",
            mobileTab === "chat" ? "block" : "hidden xl:block",
          ].join(" ")}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="m-0 inline-flex items-center gap-2 text-sm font-semibold text-text/80">
              <span>Chat de fin de partie</span>
              {unreadChatCount > 0 && mobileTab !== "chat" ? (
                <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-[0_6px_16px_-8px_rgba(239,68,68,0.95)]">
                  {unreadChatCount > 99 ? "99+" : unreadChatCount}
                </span>
              ) : null}
            </p>
            <span className="rounded-full border border-primary/20 bg-background px-2.5 py-1 text-xs text-text/70">
              {chatMessages.length} message{chatMessages.length > 1 ? "s" : ""}
            </span>
          </div>

          <div
            className="max-h-56 min-h-32 space-y-2 overflow-y-auto pr-1"
            ref={messagesContainerRef}
          >
            {chatMessages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-primary/25 bg-background/70 px-4 py-3 text-sm text-text/65">
                Aucun message pour le moment.
              </div>
            ) : (
              chatMessages.map((message) => (
                <div
                  className={[
                    "max-w-[90%] rounded-xl px-3 py-2 text-sm",
                    message.isSelf ? "ml-auto bg-primary text-[#03111e]" : "bg-background text-text",
                  ].join(" ")}
                  key={`${message.userId}-${message.sentAt}-${message.content}`}
                >
                  {!message.isSelf ? (
                    <p className="m-0 text-xs text-text/65">{message.username}</p>
                  ) : null}
                  <p className="m-0">{message.content}</p>
                </div>
              ))
            )}
          </div>

          <form
            className="mt-3 flex items-center gap-2 rounded-xl bg-background px-3 py-2"
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
            <p className="mt-2 text-xs text-red-300">{chatError}</p>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
