import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GamePanel from "../components/Quiz/GamePanel";
import LobbyPanel from "../components/Quiz/LobbyPanel";
import PasswordModal from "../components/Quiz/PasswordModal";
import { useAuth } from "../providers/AuthProvider";
import { useRoomChat } from "../hooks/useRoomChat";
import { useRoomParticipants } from "../hooks/useRoomParticipants";
import { useRoomRealtime } from "../hooks/useRoomRealtime";
import RulesPanel from "../components/Quiz/RulesPanel";
import { useQuizLobby } from "../hooks/useQuizLobby";
import { emitWs } from "../services/ws";

type ActivePanel = "lobby" | "game";

export default function HomePage() {
  const navigate = useNavigate();
  const { roomId: roomIdParam } = useParams();
  const [isRulesOpen, setIsRulesOpen] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<{
    id: number;
    questionNumber: number;
    totalQuestions: number;
    text: string;
    options: string[];
  } | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [hasAnsweredCurrentQuestion, setHasAnsweredCurrentQuestion] = useState(false);
  const [isAnswerSubmitting, setIsAnswerSubmitting] = useState(false);
  const [gameFeedback, setGameFeedback] = useState<string | null>(null);
  const [gameError, setGameError] = useState<string | null>(null);
  const { user: sessionUser, isLoading: isSessionLoading } = useAuth();
  const {
    rooms,
    roomsLoading,
    roomsError,
    currentRoom,
    roomToJoin,
    isJoinModalOpen,
    joinPassword,
    joinError,
    isJoining,
    setJoinPassword,
    closeJoinModal,
    requestJoinRoom,
    confirmJoinRoom,
    createRoomAndJoin,
    loadCurrentRoom,
    clearCurrentRoom,
    syncCurrentRoom,
  } = useQuizLobby({ userId: sessionUser?.id ?? null });
  const requestedRoomId = roomIdParam ? Number(roomIdParam) : null;
  const currentRoomId = currentRoom?.id ?? null;
  const { chatMessages, chatError, resetChat, sendChatMessage } = useRoomChat({
    roomId: currentRoomId,
    userId: sessionUser?.id ?? null,
  });
  const { scoreEntries, applyLeaderboard } = useRoomParticipants(currentRoom);
  const activePanel: ActivePanel =
    requestedRoomId !== null && Number.isInteger(requestedRoomId) && requestedRoomId > 0
      ? "game"
      : "lobby";

  useEffect(() => {
    if (activePanel === "lobby") {
      clearCurrentRoom();
      setSelectedAnswer(null);
      setCurrentQuestion(null);
      setRemainingMs(null);
      setHasAnsweredCurrentQuestion(false);
      setIsAnswerSubmitting(false);
      setGameFeedback(null);
      setGameError(null);
      return;
    }

    if (requestedRoomId === null || !Number.isInteger(requestedRoomId) || requestedRoomId < 1) {
      navigate("/", { replace: true });
      return;
    }

    const restoreRoom = async () => {
      try {
        await loadCurrentRoom(requestedRoomId);
        setIsRulesOpen(false);
      } catch {
        clearCurrentRoom();
        navigate("/", { replace: true });
      }
    };

    void restoreRoom();
  }, [activePanel, clearCurrentRoom, loadCurrentRoom, navigate, requestedRoomId]);

  useEffect(() => {
    if (!currentRoom) {
      return;
    }

    if (currentRoom.status === "waiting") {
      setCurrentQuestion(null);
      setRemainingMs(null);
      setHasAnsweredCurrentQuestion(false);
      setIsAnswerSubmitting(false);
      setSelectedAnswer(null);
    }

    if (currentRoom.status === "finished") {
      setCurrentQuestion(null);
      setRemainingMs(null);
      setHasAnsweredCurrentQuestion(true);
      setIsAnswerSubmitting(false);
      setSelectedAnswer(null);
    }
  }, [currentRoom, setSelectedAnswer]);

  useRoomRealtime({
    requestedRoomId,
    currentRoomId,
    userId: sessionUser?.id ?? null,
    syncCurrentRoom,
    clearCurrentRoom,
    onRoomClosed: () => {
      navigate("/", { replace: true });
    },
    onRoomJoined: resetChat,
    onLeaderboard: applyLeaderboard,
    onQuestionStarted: (payload) => {
      setCurrentQuestion({
        id: payload.questionId,
        questionNumber: payload.questionNumber,
        totalQuestions: payload.totalQuestions,
        text: payload.question.text,
        options: payload.question.options,
      });
      setRemainingMs(payload.durationMs);
      setSelectedAnswer(null);
      setHasAnsweredCurrentQuestion(false);
      setIsAnswerSubmitting(false);
      setGameError(null);
      setGameFeedback(null);
    },
    onTimer: (payload) => {
      setRemainingMs(payload.remainingMs);
    },
    onQuestionTimeout: () => {
      setHasAnsweredCurrentQuestion(true);
      setIsAnswerSubmitting(false);
      setGameFeedback("Temps écoulé pour cette question.");
    },
    onAnswerResult: (payload) => {
      if (!sessionUser || payload.userId !== sessionUser.id) {
        return;
      }

      setHasAnsweredCurrentQuestion(true);
      setIsAnswerSubmitting(false);
      setGameFeedback(
        payload.isCorrect ? `Bonne réponse (+${payload.scoreDelta})` : "Mauvaise réponse.",
      );
    },
    onGameEnded: (payload) => {
      setCurrentQuestion(null);
      setRemainingMs(null);
      setHasAnsweredCurrentQuestion(true);
      setIsAnswerSubmitting(false);
      setSelectedAnswer(null);
      setGameFeedback(
        payload.winnerUserId === sessionUser?.id
          ? "Partie terminée, tu as gagné."
          : "Partie terminée.",
      );
    },
    onRealtimeError: (message) => {
      setGameError(message);
      setIsAnswerSubmitting(false);
    },
  });

  const isOwner = Boolean(
    sessionUser &&
      currentRoom &&
      typeof currentRoom.ownerUserId === "number" &&
      currentRoom.ownerUserId === sessionUser.id,
  );
  const canSubmitAnswer = Boolean(
    sessionUser &&
      currentRoom &&
      currentRoom.status === "playing" &&
      currentQuestion &&
      selectedAnswer !== null &&
      !hasAnsweredCurrentQuestion,
  );

  const chatEntries = chatMessages.map((message) => ({
    ...message,
    username:
      scoreEntries.find((entry) => entry.userId === message.userId)?.username ??
      `Joueur #${message.userId}`,
    isSelf: sessionUser?.id === message.userId,
  }));

  return (
    <main className="flex flex-1 px-[10%] py-6">
      {isRulesOpen ? (
        <div className="min-h-[80vh] w-full">
          <RulesPanel onClose={() => setIsRulesOpen(false)} />
        </div>
      ) : null}

      {!isRulesOpen && activePanel === "lobby" ? (
        <LobbyPanel
          onToggleRules={() => setIsRulesOpen((currentValue) => !currentValue)}
          onRequireAuth={() => navigate("/login")}
          rooms={rooms}
          roomsLoading={roomsLoading}
          roomsError={roomsError}
          actionsDisabled={isSessionLoading || sessionUser === null}
          onCreateRoom={async (payload) => {
            const room = await createRoomAndJoin(payload);
            setIsRulesOpen(false);
            navigate(`/room/${room.id}`);
          }}
          onJoinRoom={async (room) => {
            await requestJoinRoom(room);
            if (!room.isPrivate) {
              setIsRulesOpen(false);
              navigate(`/room/${room.id}`);
            }
          }}
        />
      ) : null}

      {!isRulesOpen && activePanel === "game" ? (
        <GamePanel
          roomName={currentRoom?.name ?? `Room #${requestedRoomId ?? ""}`}
          roomStatus={currentRoom?.status ?? "waiting"}
          isOwner={isOwner}
          onToggleRules={() => setIsRulesOpen((currentValue) => !currentValue)}
          onLeaveRoom={() => {
            if (currentRoom && sessionUser) {
              emitWs("room:leave", {
                roomId: currentRoom.id,
                userId: sessionUser.id,
              });
            }
            clearCurrentRoom();
            setSelectedAnswer(null);
            setCurrentQuestion(null);
            setRemainingMs(null);
            setHasAnsweredCurrentQuestion(false);
            setIsAnswerSubmitting(false);
            setGameFeedback(null);
            setGameError(null);
            setIsRulesOpen(false);
            navigate("/");
          }}
          onStartGame={() => {
            if (!currentRoom || !sessionUser) {
              return;
            }
            setGameError(null);
            setGameFeedback(null);
            emitWs("room:start", {
              roomId: currentRoom.id,
              userId: sessionUser.id,
            });
          }}
          onSubmitAnswer={() => {
            if (
              !currentRoom ||
              !sessionUser ||
              !currentQuestion ||
              selectedAnswer === null ||
              hasAnsweredCurrentQuestion
            ) {
              return;
            }
            setGameError(null);
            setGameFeedback(null);
            setIsAnswerSubmitting(true);
            emitWs("game:answer", {
              roomId: currentRoom.id,
              userId: sessionUser.id,
              questionId: currentQuestion.id,
              answerIndex: selectedAnswer,
            });
          }}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={setSelectedAnswer}
          canSubmitAnswer={canSubmitAnswer}
          isAnswerSubmitting={isAnswerSubmitting}
          currentQuestion={currentQuestion}
          remainingMs={remainingMs}
          gameFeedback={gameFeedback}
          gameError={gameError}
          scoreEntries={scoreEntries}
          chatMessages={chatEntries}
          chatError={chatError}
          onSendChatMessage={sendChatMessage}
        />
      ) : null}

      <PasswordModal
        isOpen={isJoinModalOpen}
        roomName={roomToJoin?.name ?? null}
        password={joinPassword}
        joinError={joinError}
        isJoining={isJoining}
        onPasswordChange={setJoinPassword}
        onClose={closeJoinModal}
        onConfirm={() => {
          void (async () => {
            const room = await confirmJoinRoom();
            setIsRulesOpen(false);
            if (room) {
              navigate(`/room/${room.id}`);
            }
          })();
        }}
      />
    </main>
  );
}
