import { useParams } from "react-router-dom";
import LobbyScreen from "../components/Quiz/LobbyScreen";
import RoomScreen from "../components/Quiz/RoomScreen";

export default function HomePage() {
  const { roomId: roomIdParam } = useParams();
  const requestedRoomId = roomIdParam ? Number(roomIdParam) : null;
  const isRoomRoute =
    requestedRoomId !== null && Number.isInteger(requestedRoomId) && requestedRoomId > 0;

  return (
    <main
      className={[
        "flex flex-1",
        isRoomRoute
          ? "px-4 py-4 sm:px-6 lg:px-10 xl:px-12"
          : "px-4 py-6 sm:px-6 lg:px-10 xl:px-16",
      ].join(" ")}
    >
      {isRoomRoute ? (
        <RoomScreen requestedRoomId={requestedRoomId} />
      ) : (
        <LobbyScreen />
      )}
    </main>
  );
}
