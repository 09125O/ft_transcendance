import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Panel from "../components/Panel";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../providers/AuthProvider";
import { apiRequest } from "../services/api";
import type { SafeUser } from "../services/auth";
import {
  getUserMatchHistory,
  getUserScore,
  type MatchHistoryEntry,
  type UserScore,
} from "../services/scores";
import { getUserById } from "../services/users";

type UpdatePayload = {
  username?: string;
  avatar_url?: string | null;
};

function updateProfile(payload: UpdatePayload): Promise<SafeUser> {
  return apiRequest<SafeUser>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

function formatOpponents(entry: MatchHistoryEntry): string {
  if (entry.opponents.length === 0) {
    return "Solo";
  }

  return entry.opponents.map((opponent) => opponent.username).join(", ");
}

export default function ProfilePage() {
  const { userId: userIdParam } = useParams();
  const { user: currentUser, refreshSession } = useAuth();
  const [profile, setProfile] = useState<SafeUser | null>(null);
  const [stats, setStats] = useState<UserScore | null>(null);
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [avatarInput, setAvatarInput] = useState("");

  const targetUserId = useMemo(() => {
    if (userIdParam) {
      const parsed = Number(userIdParam);
      return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    }
    return currentUser?.id ?? null;
  }, [userIdParam, currentUser?.id]);

  const isSelf = targetUserId !== null && targetUserId === currentUser?.id;

  const loadProfile = useCallback(async () => {
    if (targetUserId === null) {
      setProfile(null);
      return;
    }
    try {
      if (isSelf) {
        const self = await apiRequest<SafeUser>("/users/me");
        setProfile(self);
        setUsernameInput(self.username);
        setAvatarInput(self.avatar_url ?? "");
      } else {
        const other = await getUserById(targetUserId);
        setProfile(other);
      }
      const [score, matchHistory] = await Promise.all([
        getUserScore(targetUserId),
        getUserMatchHistory(targetUserId, 6),
      ]);
      setStats(score);
      setHistory(matchHistory);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Erreur");
    }
  }, [isSelf, targetUserId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleSave() {
    if (!isSelf) return;
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload: UpdatePayload = {};
      if (usernameInput && usernameInput !== profile?.username) {
        payload.username = usernameInput;
      }
      const normalizedAvatar = avatarInput.trim() === "" ? null : avatarInput.trim();
      if (normalizedAvatar !== (profile?.avatar_url ?? null)) {
        payload.avatar_url = normalizedAvatar;
      }
      if (Object.keys(payload).length === 0) {
        setMessage("Rien à enregistrer");
        return;
      }
      const updated = await updateProfile(payload);
      setProfile(updated);
      setMessage("Profil mis à jour");
      await refreshSession();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Erreur");
    } finally {
      setIsSaving(false);
    }
  }

  if (!currentUser) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <Panel className="w-full max-w-lg p-8 text-center">
          <h1 className="m-0 text-2xl font-semibold text-text">Profil réservé aux joueurs connectés</h1>
          <p className="mt-3 text-sm text-text/70">
            Connecte-toi pour consulter les profils, ton historique et tes statistiques.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover sm:text-base"
              to="/login"
            >
              Se connecter
            </Link>
            <Link
              className="ui-btn-secondary inline-flex items-center justify-center px-5 py-3 text-sm sm:text-base"
              to="/register"
            >
              Créer un compte
            </Link>
          </div>
        </Panel>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex flex-1 items-center justify-center px-[10%] py-10">
        <Panel className="p-8 text-center">
          <p>Chargement…</p>
          {error && <p className="text-danger mt-3">{error}</p>}
        </Panel>
      </main>
    );
  }

  return (
    <main className="flex flex-1 justify-center px-[10%] py-10">
      <Panel className="w-full max-w-2xl gap-6 p-8">
        <header className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-white/10 bg-white/5">
            {profile.avatar_url ? (
              <img
                alt={profile.username}
                className="h-full w-full object-cover"
                src={profile.avatar_url}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold">
                {profile.username.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-semibold">{profile.username}</h1>
            <p className="text-sm text-white/60">
              {profile.status === "online" ? "En ligne" : "Hors ligne"}
              {" · "}
              Inscrit le {new Date(profile.createdAt).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/60">Score total</p>
            <p className="text-2xl font-semibold">{stats?.score ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/60">Rang</p>
            <p className="text-2xl font-semibold">
              {stats?.rank ? `#${stats.rank}` : "-"}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/60">Victoires</p>
            <p className="text-2xl font-semibold">{stats?.wins ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/60">Parties jouees</p>
            <p className="text-2xl font-semibold">{stats?.gamesPlayed ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/60">Defaites</p>
            <p className="text-2xl font-semibold">{stats?.losses ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/60">Niveau</p>
            <p className="text-2xl font-semibold">Lv.{stats?.level ?? 1}</p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">Historique recent</h2>
            <p className="mt-1 text-sm text-white/60">
              Dernieres parties terminees sur ce profil.
            </p>
          </div>

          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Aucune partie terminee pour le moment.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map((entry) => (
                <div
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                  key={`${entry.gameId}-${entry.playedAt}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{entry.quizTitle}</p>
                      <p className="mt-1 text-xs text-white/60">
                        {entry.roomName} • {new Date(entry.playedAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    <span
                      className={[
                        "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                        entry.isWinner
                          ? "border border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                          : "border border-amber-300/25 bg-amber-300/10 text-amber-200",
                      ].join(" ")}
                    >
                      {entry.isWinner ? "Victoire" : "Defaite"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-white/60">Score</p>
                      <p className="mt-1 font-semibold text-white">{entry.finalScore}</p>
                    </div>
                    <div>
                      <p className="text-white/60">Classement</p>
                      <p className="mt-1 font-semibold text-white">
                        {entry.rank ? `${entry.rank}/${entry.totalPlayers}` : `-/${entry.totalPlayers}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60">Opposants</p>
                      <p className="mt-1 font-semibold text-white">
                        {formatOpponents(entry)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {isSelf && (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Modifier mon profil</h2>
            <label className="flex flex-col gap-1 text-sm">
              <span>Nom d&apos;utilisateur</span>
              <input
                className="rounded-md border border-white/10 bg-background px-3 py-2"
                maxLength={32}
                minLength={2}
                onChange={(event) => setUsernameInput(event.target.value)}
                value={usernameInput}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>URL de l&apos;avatar (optionnel)</span>
              <input
                className="rounded-md border border-white/10 bg-background px-3 py-2"
                onChange={(event) => setAvatarInput(event.target.value)}
                placeholder="https://..."
                type="url"
                value={avatarInput}
              />
            </label>
            <div className="flex items-center gap-3">
              <PrimaryButton
                className="px-5 py-2 text-sm"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? "Enregistrement…" : "Enregistrer"}
              </PrimaryButton>
              {message && <span className="text-sm text-white/70">{message}</span>}
              {error && <span className="text-sm text-danger">{error}</span>}
            </div>
          </section>
        )}
      </Panel>
    </main>
  );
}
