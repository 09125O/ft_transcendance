import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthProvider";
import type { WsConnectionState } from "../services/ws";

type RealtimeProviderProps = {
  children: ReactNode;
};

type RealtimeContextValue = {
  connectionState: WsConnectionState;
};

type WsModule = typeof import("../services/ws");

const RealtimeContext = createContext<RealtimeContextValue>({
  connectionState: "idle",
});

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { user, isLoading } = useAuth();
  const [connectionState, setConnectionState] = useState<WsConnectionState>("idle");
  const wsModuleRef = useRef<WsModule | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    let unsubscribe = () => {};
    let active = true;

    if (user === null) {
      if (wsModuleRef.current) {
        wsModuleRef.current.disconnectWs();
      }
      setConnectionState("idle");
      return;
    }

    void (async () => {
      const wsModule = wsModuleRef.current ?? await import("../services/ws");
      if (!active) {
        return;
      }

      wsModuleRef.current = wsModule;
      unsubscribe = wsModule.subscribeWsConnection(setConnectionState);
      wsModule.connectWs();
    })();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [isLoading, user]);

  return (
    <RealtimeContext.Provider value={{ connectionState }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeContextValue {
  return useContext(RealtimeContext);
}
