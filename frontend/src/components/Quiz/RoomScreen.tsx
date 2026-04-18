import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuizLobby } from "../../hooks/useQuizLobby";
import { useRoomChat } from "../../hooks/useRoomChat";
import { useRoomParticipants } from "../../hooks/useRoomParticipants";
import { useRoomRealtime } from "../../hooks/useRoomRealtime";
import { useAuth } from "../../providers/AuthProvider";
import type { PublicQuestion } from "../../types/game";
import { emitWs } from "../../services/ws";
import GamePanel from "./GamePanel";
import PreMatchPanel from "./PreMatchPanel";
import ResultsPanel from "./ResultsPanel";
import RulesPanel from "./RulesPanel";

type RoomScreenProps = {
  requestedRoomId: number | null;
};

export default function RoomScreen({ requestedRoomId }: RoomScreenProps) {
  const navigate = useNavigate();
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<PublicQuestion | null>(null);
  const { user: sessionUser } = useAuth();
  const {
    currentRoom,
    loadCurrentRoom,
    clearCurrentRoom,
    syncCurrentRoom,
  } = useQuizLobby({ userId: sessionUser?.id ?? null });
  const currentRoomId = currentRoom?.id ?? null;
  const { chatMessages, chatError, resetChat, sendChatMessage } = useRoomChat({
    roomId: currentRoomId,
    userId: sessionUser?.id ?? null,
  });
  const { scoreEntries, applyLeaderboard } = useRoomParticipants(currentRoom);

  useEffect(() => {
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
  }, [clearCurrentRoom, loadCurrentRoom, navigate, requestedRoomId]);

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
    onQuestionStarted: (question) => {
      setCurrentQuestion(question);
      setSelectedAnswer(null);
      setAnswerFeedback(null);
    },
    onGameEnded: () => {
      setCurrentQuestion(null);
      setSelectedAnswer(null);
      setAnswerFeedback(null);
    },
    onAnswerResult: (payload) => {
      if (sessionUser?.id !== payload.userId) {
        return;
      }
      if (currentQuestion?.id !== payload.questionId) {
        return;
      }

      setSelectedAnswer(payload.selectedAnswerIndex);
      setAnswerFeedback(payload.isCorrect ? "correct" : "incorrect");
    },
  });

  const chatEntries = chatMessages.map((message) => ({
    ...message,
    username:
      scoreEntries.find((entry) => entry.userId === message.userId)?.username ??
      `Joueur #${message.userId}`,
    isSelf: sessionUser?.id === message.userId,
  }));

  const handleLeaveRoom = () => {
    if (currentRoom && sessionUser) {
      emitWs("room:leave", {
        roomId: currentRoom.id,
        userId: sessionUser.id,
      });
    }
    clearCurrentRoom();
    setSelectedAnswer(null);
    setAnswerFeedback(null);
    navigate("/");
  };

  const handleStartRoom = () => {
    if (currentRoom && sessionUser) {
      emitWs("room:start", {
        roomId: currentRoom.id,
        userId: sessionUser.id,
      });
    }
  };

  if (isRulesOpen) {
    return (
      <div className="min-h-[80vh] w-full">
        <RulesPanel onClose={() => setIsRulesOpen(false)} />
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="flex min-h-[80vh] w-full items-center justify-center">
        <div className="w-full max-w-2xl rounded-[24px] border border-white/10 bg-surface/90 px-6 py-8 text-center text-sm text-text/70 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.85)] backdrop-blur">
          Chargement de la room...
        </div>
      </div>
    );
  }

  if (currentRoom.status === "waiting") {
    return (
      <PreMatchPanel
        roomName={currentRoom.name}
        rounds={currentRoom.rounds}
        scoreEntries={scoreEntries}
        canStartRoom={currentRoom.status === "waiting"}
        onStartRoom={handleStartRoom}
        onLeaveRoom={handleLeaveRoom}
        onOpenRules={() => setIsRulesOpen(true)}
      />
    );
  }

  if (currentRoom.status === "finished") {
    return (
      <ResultsPanel
        roomName={currentRoom.name}
        scoreEntries={scoreEntries}
        onLeaveRoom={handleLeaveRoom}
        onOpenRules={() => setIsRulesOpen(true)}
      />
    );
  }

  return (
    <GamePanel
      onToggleRules={() => setIsRulesOpen((currentValue) => !currentValue)}
      canStartRoom={false}
      roomStatus={currentRoom.status}
      onStartRoom={handleStartRoom}
      onLeaveRoom={handleLeaveRoom}
      selectedAnswer={selectedAnswer}
      answerFeedback={answerFeedback}
      onSelectAnswer={(answerIndex) => {
        if (selectedAnswer !== null) {
          return;
        }

        setSelectedAnswer(answerIndex);
        if (currentRoom && sessionUser && currentQuestion) {
          emitWs("game:answer", {
            roomId: currentRoom.id,
            userId: sessionUser.id,
            questionId: currentQuestion.id,
            answerIndex,
          });
        }
      }}
      currentQuestion={currentQuestion}
      scoreEntries={scoreEntries}
      chatMessages={chatEntries}
      chatError={chatError}
      onSendChatMessage={sendChatMessage}
    />
  );
}
