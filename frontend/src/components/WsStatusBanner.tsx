import type { WsConnectionState } from "../services/ws";
import { useRealtime } from "../providers/RealtimeProvider";

const LABELS: Record<WsConnectionState, { label: string; tone: string } | null> = {
  idle: null,
  connected: null,
  connecting: { label: "Connexion au serveur temps réel…", tone: "bg-white/10" },
  reconnecting: { label: "Reconnexion en cours…", tone: "bg-yellow-500/20" },
  disconnected: {
    label: "Connexion perdue. Vérifiez votre réseau.",
    tone: "bg-danger/30",
  },
};

export default function WsStatusBanner() {
  const { connectionState: state } = useRealtime();

  const meta = LABELS[state];
  if (!meta) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm text-white shadow-lg ${meta.tone}`}
      role="status"
    >
      {meta.label}
    </div>
  );
}
