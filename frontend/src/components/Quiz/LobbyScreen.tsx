import { useNavigate } from "react-router-dom";
import { useQuizLobby } from "../../hooks/useQuizLobby";
import { useAuth } from "../../providers/AuthProvider";
import LobbyOverviewPanel from "./LobbyOverviewPanel";
import PasswordModal from "./PasswordModal";

export default function LobbyScreen() {
  const navigate = useNavigate();
  const { user: sessionUser, isLoading: isSessionLoading } = useAuth();
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

  return (
    <>
      <LobbyOverviewPanel
        rooms={rooms}
        roomsLoading={roomsLoading}
        roomsError={roomsError}
        actionsDisabled={actionsDisabled}
        onGoToReadyQuizzes={() => navigate("/quiz-ready")}
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
            const room = await confirmJoinRoom();
            if (room) {
              navigate(`/room/${room.id}`);
            }
          })();
        }}
      />
    </>
  );
}
