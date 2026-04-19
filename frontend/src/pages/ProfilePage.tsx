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
import { getUserById, uploadAvatar } from "../services/users";

type UpdatePayload = {
  username?: string;
  avatar_url?: string | null;
};

type AvatarMode = "url" | "upload";

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const MANAGED_AVATAR_PREFIX = "/uploads/avatars/";

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

function isManagedAvatarUrl(value: string | null | undefined): value is string {
  return typeof value === "string" && value.startsWith(MANAGED_AVATAR_PREFIX);
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
  const [avatarMode, setAvatarMode] = useState<AvatarMode>("url");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [shouldClearAvatar, setShouldClearAvatar] = useState(false);
  const [avatarImageBroken, setAvatarImageBroken] = useState(false);

  const targetUserId = useMemo(() => {
    if (userIdParam) {
      const parsed = Number(userIdParam);
      return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    }
    return currentUser?.id ?? null;
  }, [userIdParam, currentUser?.id]);

  const isSelf = targetUserId !== null && targetUserId === currentUser?.id;

  useEffect(() => {
    if (!selectedAvatarFile) {
      setAvatarPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedAvatarFile);
    setAvatarPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedAvatarFile]);

  useEffect(() => {
    setAvatarImageBroken(false);
  }, [avatarPreviewUrl, profile?.avatar_url]);

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
        setAvatarInput(isManagedAvatarUrl(self.avatar_url) ? "" : (self.avatar_url ?? ""));
        setAvatarMode("url");
        setSelectedAvatarFile(null);
        setShouldClearAvatar(false);
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
      setAvatarImageBroken(false);
      setError(null);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Erreur");
    }
  }, [isSelf, targetUserId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleSave() {
    if (!isSelf || !profile) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      let nextProfile = profile;

      if (avatarMode === "upload" && selectedAvatarFile) {
        nextProfile = await uploadAvatar(selectedAvatarFile);
        setProfile(nextProfile);
        setSelectedAvatarFile(null);
        setAvatarMode("url");
        setAvatarInput("");
      }

      const payload: UpdatePayload = {};

      if (usernameInput && usernameInput !== nextProfile.username) {
        payload.username = usernameInput;
      }

      if (shouldClearAvatar && nextProfile.avatar_url !== null) {
        payload.avatar_url = null;
      } else if (avatarMode === "url") {
        const editableAvatarValue = isManagedAvatarUrl(nextProfile.avatar_url)
          ? ""
          : (nextProfile.avatar_url ?? "");
        const normalizedAvatarInput = avatarInput.trim();
        if (normalizedAvatarInput !== editableAvatarValue) {
          payload.avatar_url = normalizedAvatarInput === "" ? null : normalizedAvatarInput;
        }
      }

      if (Object.keys(payload).length > 0) {
        nextProfile = await updateProfile(payload);
        setProfile(nextProfile);
      }

      setAvatarInput(
        isManagedAvatarUrl(nextProfile.avatar_url) ? "" : (nextProfile.avatar_url ?? ""),
      );
      setShouldClearAvatar(false);
      setMessage("Profil mis à jour");
      await refreshSession();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Erreur");
    } finally {
      setIsSaving(false);
    }
  }

  function handleAvatarFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    if (!nextFile) {
      return;
    }

    if (nextFile.size > MAX_AVATAR_SIZE_BYTES) {
      setError("L'avatar doit faire 2 Mo maximum.");
      event.target.value = "";
      return;
    }

    setError(null);
    setMessage(null);
    setSelectedAvatarFile(nextFile);
    setAvatarMode("upload");
    setShouldClearAvatar(false);
  }

  function handleAvatarUrlChange(value: string) {
    setAvatarInput(value);
    setAvatarMode("url");
    setSelectedAvatarFile(null);
    setShouldClearAvatar(false);
    setMessage(null);
  }

  function handleResetAvatar() {
    setAvatarMode("url");
    setSelectedAvatarFile(null);
    setAvatarInput("");
    setShouldClearAvatar(true);
    setMessage(null);
    setError(null);
  }

  const displayedAvatarUrl =
    !avatarImageBroken && (avatarPreviewUrl ?? profile?.avatar_url) ? avatarPreviewUrl ?? profile?.avatar_url : null;

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
          {error && <p className="mt-3 text-danger">{error}</p>}
        </Panel>
      </main>
    );
  }

  return (
    <main className="flex flex-1 justify-center px-[10%] py-10">
      <Panel className="w-full max-w-2xl gap-6 p-8">
        <header className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-white/10 bg-white/5">
            {displayedAvatarUrl ? (
              <img
                alt={profile.username}
                className="h-full w-full object-cover"
                onError={() => setAvatarImageBroken(true)}
                src={displayedAvatarUrl}
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
            <p className="text-white/60">Parties jouées</p>
            <p className="text-2xl font-semibold">{stats?.gamesPlayed ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/60">Défaites</p>
            <p className="text-2xl font-semibold">{stats?.losses ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/60">Niveau</p>
            <p className="text-2xl font-semibold">Lv.{stats?.level ?? 1}</p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">Historique récent</h2>
            <p className="mt-1 text-sm text-white/60">
              Dernières parties terminées sur ce profil.
            </p>
          </div>

          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Aucune partie terminée pour le moment.
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
                      {entry.isWinner ? "Victoire" : "Défaite"}
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

        {isSelf ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Modifier mon profil</h2>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="m-0 text-sm font-medium text-text">Avatar</p>
              <p className="mt-1 text-sm text-white/60">
                Importe une image ou garde l&apos;avatar par défaut si tu n&apos;en fournis pas.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-text transition hover:border-white/30 hover:bg-white/10">
                  Choisir un fichier
                  <input
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={handleAvatarFileChange}
                    type="file"
                  />
                </label>
                <button
                  className="w-fit rounded-full border border-white/12 px-4 py-2 text-sm text-text/75 transition hover:border-white/30 hover:text-text"
                  onClick={handleResetAvatar}
                  type="button"
                >
                  Revenir à l&apos;avatar par défaut
                </button>
              </div>
              <p className="mt-3 text-xs text-white/55">
                Formats acceptés : JPG, PNG, WebP, GIF. Taille max : 2 Mo.
              </p>
              {selectedAvatarFile ? (
                <p className="mt-2 text-sm text-primary">
                  Fichier prêt à envoyer : {selectedAvatarFile.name}
                </p>
              ) : null}
              {shouldClearAvatar ? (
                <p className="mt-2 text-sm text-white/70">
                  L&apos;avatar actuel sera supprimé à l&apos;enregistrement.
                </p>
              ) : null}
            </div>

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
                onChange={(event) => handleAvatarUrlChange(event.target.value)}
                placeholder="https://..."
                type="url"
                value={avatarInput}
              />
              <span className="text-xs text-white/55">
                Si tu renseignes une URL, elle remplace le fichier local sélectionné.
              </span>
            </label>

            <div className="flex items-center gap-3">
              <PrimaryButton
                className="px-5 py-2 text-sm"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? "Enregistrement…" : "Enregistrer"}
              </PrimaryButton>
              {message ? <span className="text-sm text-white/70">{message}</span> : null}
              {error ? <span className="text-sm text-danger">{error}</span> : null}
            </div>
          </section>
        ) : null}
      </Panel>
    </main>
  );
}
