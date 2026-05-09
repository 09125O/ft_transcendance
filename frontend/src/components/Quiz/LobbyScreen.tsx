import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuizLobby } from "../../hooks/useQuizLobby";
import { useAuth } from "../../providers/AuthProvider";
import { createRoom, type CreateRoomPayload } from "../../services/quiz";
import type { Quiz } from "../../services/quizzes";
import LobbyOverviewPanel from "./LobbyOverviewPanel";
import PasswordModal from "./PasswordModal";
import RoomCreateFromQuizPanel from "./RoomCreateFromQuizPanel";

export default function LobbyScreen() {
  const navigate = useNavigate();
  const { user: sessionUser, isLoading: isSessionLoading } = useAuth();
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const {
    rooms,
    roomsLoading,
    roomsError,
    roomToJoin,
    isJoinModalOpen,
    joinPassword,
    joinError,
    isJoining,
    setJoinPassword,
    closeJoinModal,
    requestJoinRoom,
    confirmJoinRoom,
  } = useQuizLobby({ userId: sessionUser?.id ?? null });
  const actionsDisabled = isSessionLoading || sessionUser === null;

  const requireAuth = () => {
    navigate("/login");
  };

  const handleOpenQuizConfigurator = (quiz: Quiz) => {
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

    const createdRoom = await createRoom(payload);
    navigate(`/room/${createdRoom.id}`);
  };

  if (selectedQuiz) {
    return (
      <RoomCreateFromQuizPanel
        quiz={selectedQuiz}
        onBack={() => setSelectedQuiz(null)}
        onCreateRoom={handleCreateRoomFromQuiz}
      />
    );
  }

  return (
    <>
      <LobbyOverviewPanel
        rooms={rooms}
        roomsLoading={roomsLoading}
        roomsError={roomsError}
        actionsDisabled={actionsDisabled}
        onGoToReadyQuizzes={() => navigate("/quiz-ready")}
        onOpenQuizConfigurator={handleOpenQuizConfigurator}
        onGoToCreateQuiz={() => navigate("/quiz-create")}
        onJoinRoom={async (room) => {
          await requestJoinRoom(room);
          if (!room.isPrivate) {
            navigate(`/room/${room.id}`);
          }
        }}
        onRequireAuth={requireAuth}
      />

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
            try {
              const room = await confirmJoinRoom();
              if (room) {
                navigate(`/room/${room.id}`);
              }
            } catch {
              // The hook keeps the modal open and exposes the join error.
            }
          })();
        }}
      />
    </>
  );
}
