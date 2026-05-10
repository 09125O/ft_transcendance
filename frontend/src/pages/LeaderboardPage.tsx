import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Panel from "../components/Panel";
import { useAuth } from "../providers/AuthProvider";
import {
  getLeaderboard,
  getUserMatchHistory,
  getUserScore,
  type MatchHistoryEntry,
  type UserScore,
} from "../services/scores";

type Achievement = {
  label: string;
  description: string;
  unlocked: boolean;
};

function buildAchievements(stats: UserScore | null): Achievement[] {
  const safeStats = stats ?? {
    wins: 0,
    score: 0,
    gamesPlayed: 0,
    level: 1,
  };

  return [
    {
      label: "Premier duel",
      description: "Disputer au moins une partie.",
      unlocked: safeStats.gamesPlayed >= 1,
    },
    {
      label: "Top scorer",
      description: "Atteindre 100 points cumulés.",
      unlocked: safeStats.score >= 100,
    },
    {
      label: "Série gagnante",
      description: "Remporter 3 parties ou plus.",
      unlocked: safeStats.wins >= 3,
    },
    {
      label: "Vétéran",
      description: "Jouer 10 parties ou plus.",
      unlocked: safeStats.gamesPlayed >= 10,
    },
  ];
}

function getLevelProgress(stats: UserScore | null): {
  currentLevel: number;
  currentFloor: number;
  nextLevelScore: number;
  percent: number;
} {
  const score = stats?.score ?? 0;
  const currentLevel = stats?.level ?? 1;
  const currentFloor = (currentLevel - 1) * 100;
  const nextLevelScore = currentFloor + 100;
  const percent = Math.max(
    0,
    Math.min(100, ((score - currentFloor) / 100) * 100),
  );

  return {
    currentLevel,
    currentFloor,
    nextLevelScore,
    percent,
  };
}

function formatOpponents(entry: MatchHistoryEntry): string {
  if (entry.opponents.length === 0) {
    return "Solo";
  }

  return entry.opponents.map((opponent) => opponent.username).join(", ");
}

export default function LeaderboardPage() {
  const { user: currentUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState<UserScore[]>([]);
  const [currentUserStats, setCurrentUserStats] = useState<UserScore | null>(null);
  const [currentUserHistory, setCurrentUserHistory] = useState<MatchHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [globalLeaderboard, stats, history] = await Promise.all([
          getLeaderboard(20),
          currentUser ? getUserScore(currentUser.id) : Promise.resolve(null),
          currentUser ? getUserMatchHistory(currentUser.id, 8) : Promise.resolve([]),
        ]);

        if (!isMounted) {
          return;
        }

        setLeaderboard(globalLeaderboard);
        setCurrentUserStats(stats);
        setCurrentUserHistory(history);
      } catch (exception) {
        if (!isMounted) {
          return;
        }

        setError(exception instanceof Error ? exception.message : "Erreur de chargement");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const achievements = useMemo(
    () => buildAchievements(currentUserStats),
    [currentUserStats],
  );
  const levelProgress = useMemo(
    () => getLevelProgress(currentUserStats),
    [currentUserStats],
  );

  return (
    <main className="flex flex-1 px-4 py-6 sm:px-6 lg:px-[8%]">
      <div className="flex w-full flex-col gap-6">
        <Panel className="relative overflow-hidden px-6 py-6 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--color-urgency)_22%,transparent),transparent_56%),radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--color-accent)_24%,transparent),transparent_48%)] before:content-[''] sm:px-8 sm:py-8 lg:px-10">
          <div className="relative space-y-4">
            <span className="font-kicker uppercase tracking-[0.24em] inline-flex w-fit rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Stats & historique
            </span>
            <h1 className="m-0 max-w-4xl text-3xl font-semibold leading-tight text-text sm:text-4xl">
              Classement global, progression joueur et matchs récents
            </h1>
            <p className="text-text-muted max-w-3xl text-sm sm:text-base">
              Suis les meilleurs scores, ton niveau actuel et les dernières parties jouées.
            </p>
          </div>
        </Panel>

        {error ? (
          <Panel className="px-6 py-5 text-sm text-danger">
            {error}
          </Panel>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,24rem)]">
          <Panel className="px-6 py-6 sm:px-8">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="font-kicker uppercase tracking-[0.24em] m-0 text-xs font-semibold text-text/55">
                  Classement
                </p>
                <h2 className="m-0 text-2xl font-semibold text-text">
                  Top joueurs
                </h2>
              </div>
              <span className="rounded-full border border-text/10 bg-background px-3 py-1 text-xs text-text/70">
                {leaderboard.length} entrée{leaderboard.length > 1 ? "s" : ""}
              </span>
            </div>

            {isLoading ? (
              <p className="m-0 rounded-[22px] border border-text/10 bg-background/70 px-4 py-4 text-sm text-text/70">
                Chargement du leaderboard...
              </p>
            ) : null}

            {!isLoading && leaderboard.length === 0 ? (
              <p className="m-0 flex min-h-[12rem] items-center justify-center text-center text-lg font-semibold text-text/70 sm:text-xl">
                Aucune partie terminée pour le moment.
              </p>
            ) : null}

            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div
                  className="grid gap-3 rounded-[22px] border border-text/10 bg-background/75 px-4 py-4 sm:grid-cols-[4.5rem_minmax(0,1fr)_repeat(4,minmax(0,6rem))]"
                  key={entry.userId}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-semibold text-primary">
                      #{entry.rank ?? "-"}
                    </span>
                    <span className="rounded-full border border-text/10 bg-background px-2 py-1 text-xs text-text/65">
                      Lv.{entry.level}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <Link
                      className="block truncate text-base font-semibold text-text hover:text-primary"
                      to={`/profile/${entry.userId}`}
                    >
                      {entry.username}
                    </Link>
                    <p className="m-0 mt-1 text-xs text-text/60">
                      {entry.gamesPlayed} partie{entry.gamesPlayed > 1 ? "s" : ""} • {entry.losses} défaite{entry.losses > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div>
                    <p className="font-kicker uppercase tracking-[0.24em] m-0 text-[11px] text-text/50">Score</p>
                    <p className="m-0 mt-1 text-base font-semibold text-text">{entry.score}</p>
                  </div>
                  <div>
                    <p className="font-kicker uppercase tracking-[0.24em] m-0 text-[11px] text-text/50">Wins</p>
                    <p className="m-0 mt-1 text-base font-semibold text-text">{entry.wins}</p>
                  </div>
                  <div>
                    <p className="font-kicker uppercase tracking-[0.24em] m-0 text-[11px] text-text/50">Losses</p>
                    <p className="m-0 mt-1 text-base font-semibold text-text">{entry.losses}</p>
                  </div>
                  <div>
                    <p className="font-kicker uppercase tracking-[0.24em] m-0 text-[11px] text-text/50">Parties</p>
                    <p className="m-0 mt-1 text-base font-semibold text-text">
                      {entry.gamesPlayed}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel className="px-5 py-5 sm:px-6">
              <div className="mb-4">
                <p className="font-kicker uppercase tracking-[0.24em] m-0 text-xs font-semibold text-text/55">
                  Progression
                </p>
                <h2 className="m-0 text-2xl font-semibold text-text">
                  {currentUser ? "Mon profil joueur" : "Profil joueur"}
                </h2>
              </div>

              {currentUser && currentUserStats ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[20px] border border-text/10 bg-background/70 px-4 py-4">
                      <p className="font-kicker uppercase tracking-[0.24em] m-0 text-xs text-text/55">Rang</p>
                      <p className="m-0 mt-2 text-2xl font-semibold text-text">
                        {currentUserStats.rank ? `#${currentUserStats.rank}` : "-"}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-text/10 bg-background/70 px-4 py-4">
                      <p className="font-kicker uppercase tracking-[0.24em] m-0 text-xs text-text/55">Niveau</p>
                      <p className="m-0 mt-2 text-2xl font-semibold text-text">
                        Lv.{currentUserStats.level}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-text/10 bg-background/70 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="m-0 text-sm font-semibold text-text">
                        Progression vers le niveau suivant
                      </p>
                      <span className="text-xs text-text/60">
                        {currentUserStats.score} / {levelProgress.nextLevelScore}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-text/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-urgency"
                        style={{ width: `${levelProgress.percent}%` }}
                      />
                    </div>
                    <p className="m-0 mt-3 text-xs text-text/60">
                      Palier actuel: {levelProgress.currentFloor} points
                    </p>
                  </div>

                  <div className="space-y-3">
                    {achievements.map((achievement) => (
                      <div
                        className="rounded-[20px] border px-4 py-4 text-sm"
                        key={achievement.label}
                      >
                        <div
                          className={[
                            "flex items-start justify-between gap-3 rounded-[14px] px-1",
                            achievement.unlocked ? "text-text" : "text-text/55",
                          ].join(" ")}
                        >
                          <div>
                            <p className="m-0 font-semibold">{achievement.label}</p>
                            <p className="m-0 mt-1 text-xs">{achievement.description}</p>
                          </div>
                          <span
                            className={[
                              "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                              achievement.unlocked
                                ? "border border-success/25 bg-success/10 text-success"
                                : "border border-text/10 bg-background text-text/50",
                            ].join(" ")}
                          >
                            {achievement.unlocked ? "Débloqué" : "À venir"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="m-0 text-sm text-text/70">
                  {currentUser
                    ? "Charge quelques parties pour afficher ta progression."
                    : "Connecte-toi pour afficher ta progression et ton historique personnel."}
                </p>
              )}
            </Panel>

            <Panel className="px-5 py-5 sm:px-6">
              <div className="mb-4">
                <p className="font-kicker uppercase tracking-[0.24em] m-0 text-xs font-semibold text-text/55">
                  Historique
                </p>
                <h2 className="m-0 text-2xl font-semibold text-text">
                  Parties récentes
                </h2>
              </div>

              {!currentUser ? (
                <p className="m-0 text-sm text-text/70">
                  Connecte-toi pour consulter ton historique de matchs.
                </p>
              ) : null}

              {currentUser && currentUserHistory.length === 0 ? (
                <p className="m-0 text-sm text-text/70">
                  Aucune partie terminée pour le moment.
                </p>
              ) : null}

              <div className="space-y-3">
                {currentUserHistory.map((entry) => (
                  <div
                    className="rounded-[20px] border border-text/10 bg-background/70 px-4 py-4"
                    key={`${entry.gameId}-${entry.playedAt}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="m-0 font-semibold text-text">{entry.quizTitle}</p>
                        <p className="m-0 mt-1 text-xs text-text/60">
                          {entry.roomName} • {new Date(entry.playedAt).toLocaleString("fr-FR")}
                        </p>
                      </div>
                      <span
                        className={[
                          "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                          entry.isWinner
                            ? "border border-success/25 bg-success/10 text-success"
                            : "border border-urgency/25 bg-urgency/10 text-urgency",
                        ].join(" ")}
                      >
                        {entry.isWinner ? "Victoire" : "Défaite"}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="font-kicker uppercase tracking-[0.24em] m-0 text-[11px] text-text/50">Score</p>
                        <p className="m-0 mt-1 text-base font-semibold text-text">{entry.finalScore}</p>
                      </div>
                      <div>
                        <p className="font-kicker uppercase tracking-[0.24em] m-0 text-[11px] text-text/50">Classement</p>
                        <p className="m-0 mt-1 text-base font-semibold text-text">
                          {entry.rank ? `${entry.rank}/${entry.totalPlayers}` : `-/${entry.totalPlayers}`}
                        </p>
                      </div>
                      <div>
                        <p className="font-kicker uppercase tracking-[0.24em] m-0 text-[11px] text-text/50">Opposants</p>
                        <p className="m-0 mt-1 text-sm text-text/80">
                          {formatOpponents(entry)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </main>
  );
}
