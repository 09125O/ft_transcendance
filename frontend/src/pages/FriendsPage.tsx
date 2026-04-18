import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Panel from "../components/Panel";
import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../providers/AuthProvider";
import {
  acceptRequest,
  declineRequest,
  listFriends,
  listRequests,
  removeFriend,
  sendFriendRequest,
  type FriendListEntry,
  type FriendRequestLists,
} from "../services/friends";
import {
  listNotifications,
  markAllRead,
  markRead,
  type NotificationItem,
} from "../services/notifications";

export default function FriendsPage() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendListEntry[]>([]);
  const [requests, setRequests] = useState<FriendRequestLists>({ incoming: [], outgoing: [] });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [addUserId, setAddUserId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unreadNotificationsCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [list, reqs, notifs] = await Promise.all([
        listFriends(),
        listRequests(),
        listNotifications(),
      ]);
      setFriends(list);
      setRequests(reqs);
      setNotifications(notifs.items);
      setError(null);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Erreur");
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSend() {
    const parsed = Number(addUserId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setError("Identifiant utilisateur invalide");
      return;
    }
    try {
      await sendFriendRequest(parsed);
      setAddUserId("");
      setFeedback("Demande envoyée");
      await refresh();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Erreur");
    }
  }

  async function handleAccept(id: number) {
    await acceptRequest(id);
    await refresh();
  }

  async function handleDecline(id: number) {
    await declineRequest(id);
    await refresh();
  }

  async function handleRemove(userId: number) {
    await removeFriend(userId);
    await refresh();
  }

  async function handleMarkAll() {
    await markAllRead();
    await refresh();
  }

  async function handleMarkOne(id: number) {
    await markRead(id);
    await refresh();
  }

  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Panel className="p-8 text-center">
          <p>Connectez-vous pour accéder à vos amis.</p>
        </Panel>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-[8%] lg:py-10">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.85fr)]">
        <Panel className="relative overflow-hidden p-6 sm:p-7">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.24),transparent_55%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_40%)]" />
          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <span className="inline-flex w-fit rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  Réseau
                </span>
                <div>
                  <h1 className="m-0 text-3xl font-semibold text-text sm:text-4xl">
                    Amis et invitations
                  </h1>
                  <p className="mt-3 max-w-xl text-sm text-text/68 sm:text-base">
                    Gère les demandes en attente, garde un œil sur les notifications récentes et retrouve rapidement les joueurs déjà connectés.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-[22px] border border-white/10 bg-background/80 px-4 py-3 text-center">
                  <p className="m-0 text-2xl font-semibold text-text">{friends.length}</p>
                  <p className="m-0 text-xs uppercase tracking-[0.2em] text-text/50">Amis</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-background/80 px-4 py-3 text-center">
                  <p className="m-0 text-2xl font-semibold text-text">{requests.incoming.length}</p>
                  <p className="m-0 text-xs uppercase tracking-[0.2em] text-text/50">Reçues</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-background/80 px-4 py-3 text-center">
                  <p className="m-0 text-2xl font-semibold text-text">{unreadNotificationsCount}</p>
                  <p className="m-0 text-xs uppercase tracking-[0.2em] text-text/50">Non lues</p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-background/78 p-4 sm:p-5">
              <div className="mb-4">
                <h2 className="m-0 text-lg font-semibold text-text">Ajouter un ami</h2>
                <p className="mt-2 text-sm text-text/60">
                  Utilise l’identifiant numérique du joueur pour envoyer une invitation directe.
                </p>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                <label className="flex flex-1 flex-col gap-2 text-sm">
                  <span className="font-medium text-text/75">Identifiant utilisateur</span>
                  <input
                    className="rounded-xl border border-white/10 bg-surface px-4 py-3 text-text outline-none placeholder:text-text/40"
                    onChange={(event) => setAddUserId(event.target.value)}
                    placeholder="Ex: 42"
                    type="number"
                    value={addUserId}
                  />
                </label>
                <PrimaryButton
                  className="px-5 py-3 text-sm sm:text-base"
                  onClick={handleSend}
                >
                  Envoyer la demande
                </PrimaryButton>
              </div>
              {feedback ? (
                <p className="mt-4 text-sm text-emerald-300">{feedback}</p>
              ) : null}
              {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
            </div>
          </div>
        </Panel>

        <Panel className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em] text-text/45">
                Veille
              </p>
              <h2 className="m-0 text-2xl font-semibold text-text">Notifications</h2>
            </div>
            {unreadNotificationsCount > 0 ? (
              <button
                className="rounded-full border border-white/10 bg-background px-3 py-1 text-xs text-text/70 transition hover:border-primary/40 hover:text-text"
                onClick={handleMarkAll}
                type="button"
              >
                Tout marquer lu
              </button>
            ) : null}
          </div>

          {notifications.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-white/10 bg-background/70 px-5 py-6 text-sm text-text/60">
              Aucune notification pour l’instant.
            </div>
          ) : (
            <ul className="flex flex-col gap-3 text-sm">
              {notifications.slice(0, 8).map((notification) => (
                <li
                  className={`rounded-[22px] border p-4 ${
                    notification.read
                      ? "border-white/10 bg-background/60 opacity-70"
                      : "border-primary/20 bg-primary/8"
                  }`}
                  key={notification.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="m-0 font-medium text-text">{notification.title}</p>
                      <p className="mt-2 text-xs text-text/60">
                        {new Date(notification.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    {!notification.read ? (
                      <button
                        className="shrink-0 rounded-full border border-white/10 bg-background px-3 py-1 text-xs text-text/75 transition hover:border-primary/40 hover:text-text"
                        onClick={() => handleMarkOne(notification.id)}
                        type="button"
                      >
                        Marquer lu
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Panel className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em] text-text/45">
                Priorité
              </p>
              <h2 className="m-0 text-2xl font-semibold text-text">
                Demandes reçues
              </h2>
            </div>
            <span className="rounded-full border border-white/10 bg-background px-3 py-1 text-xs text-text/65">
              {requests.incoming.length} en attente
            </span>
          </div>

          {requests.incoming.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-white/10 bg-background/70 px-5 py-6 text-sm text-text/60">
              Aucune demande à traiter.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {requests.incoming.map((request) => (
                <li
                  className="rounded-[22px] border border-white/10 bg-background/75 p-4"
                  key={request.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="m-0 font-medium text-text">
                        {request.counterpartUsername}
                      </p>
                      <p className="mt-1 text-sm text-text/60">
                        Invitation reçue. Réponds ici pour garder un salon propre.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <PrimaryButton
                        className="px-4 py-2 text-sm"
                        onClick={() => handleAccept(request.id)}
                      >
                        Accepter
                      </PrimaryButton>
                      <button
                        className="rounded-xl border border-white/20 px-4 py-2 text-sm text-text transition hover:border-white/35 hover:bg-white/5"
                        onClick={() => handleDecline(request.id)}
                        type="button"
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em] text-text/45">
                Cercle actif
              </p>
              <h2 className="m-0 text-2xl font-semibold text-text">Mes amis</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-background px-3 py-1 text-xs text-text/65">
              {friends.length} contact{friends.length > 1 ? "s" : ""}
            </span>
          </div>

          {friends.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-white/10 bg-background/70 px-5 py-6 text-sm text-text/60">
              Aucun ami pour le moment.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {friends.map((friend) => (
                <li
                  className="rounded-[22px] border border-white/10 bg-background/75 p-4"
                  key={friend.friendshipId}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      className="flex min-w-0 items-center gap-3"
                      to={`/profile/${friend.userId}`}
                    >
                      <span
                        aria-label={friend.status}
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          friend.status === "online" ? "bg-emerald-400" : "bg-white/30"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="m-0 truncate font-medium text-text">
                          {friend.username}
                        </p>
                        <p className="m-0 text-xs text-text/55">
                          {friend.status === "online" ? "En ligne" : "Hors ligne"}
                        </p>
                      </div>
                    </Link>
                    <button
                      className="w-fit text-sm text-danger underline underline-offset-4"
                      onClick={() => handleRemove(friend.userId)}
                      type="button"
                    >
                      Retirer
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {requests.outgoing.length > 0 ? (
        <Panel className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em] text-text/45">
                Suivi
              </p>
              <h2 className="m-0 text-2xl font-semibold text-text">
                Demandes envoyées
              </h2>
            </div>
            <span className="rounded-full border border-white/10 bg-background px-3 py-1 text-xs text-text/65">
              {requests.outgoing.length} en cours
            </span>
          </div>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {requests.outgoing.map((request) => (
              <li
                className="rounded-[22px] border border-white/10 bg-background/75 p-4"
                key={request.id}
              >
                <p className="m-0 font-medium text-text">
                  {request.counterpartUsername}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-text/55">
                  {request.status === "pending" ? "En attente" : request.status}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </main>
  );
}
