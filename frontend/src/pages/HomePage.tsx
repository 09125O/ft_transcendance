import { Suspense, lazy } from "react";
import { useParams } from "react-router-dom";

const LobbyScreen = lazy(() => import("../components/Quiz/LobbyScreen"));
const RoomScreen = lazy(() => import("../components/Quiz/RoomScreen"));

function ScreenFallback() {
  return (
    <section className="flex w-full items-center justify-center py-14 text-sm text-text/70">
      Chargement...
    </section>
  );
}

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
          ? "px-4 py-4 sm:px-6 lg:px-[6%]"
          : "px-4 py-6 sm:px-6 lg:px-[8%]",
      ].join(" ")}
    >
      <Suspense fallback={<ScreenFallback />}>
        {isRoomRoute ? (
          <RoomScreen requestedRoomId={requestedRoomId} />
        ) : (
          <LobbyScreen />
        )}
      </Suspense>
    </main>
  );
}
