import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Panel from "../components/Panel";
import { secondaryButtonClassName } from "../components/SecondaryButton";
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
  deleteNotification,
  listNotifications,
  markAllRead,
  markRead,
  type NotificationItem,
} from "../services/notifications";
import { notifyFriendsBadgeRefresh } from "../services/friendsBadge";
import { getUserByIdentifier } from "../services/users";
import { offWs, onWs, type WsResponse } from "../services/ws";

type FriendsSyncPayload = {
  reason: "request_created" | "request_accepted" | "request_declined" | "friend_removed";
  requestId?: number;
  actorUserId: number;
};

function getNotificationDescription(notification: NotificationItem): string | null {
  const actorUsername =
    typeof notification.payload.actorUsername === "string"
      ? notification.payload.actorUsername
      : null;
  const fromUsername =
    typeof notification.payload.fromUsername === "string"
      ? notification.payload.fromUsername
      : null;

  switch (notification.type) {
    case "FRIEND_REQUEST_RECEIVED":
      return fromUsername ? `${fromUsername} souhaite vous ajouter.` : null;
    case "FRIEND_REQUEST_ACCEPTED":
      return actorUsername ? `${actorUsername} a accepté votre demande.` : null;
    case "FRIEND_REQUEST_DECLINED":
      return actorUsername ? `${actorUsername} a refusé votre demande.` : null;
    case "FRIEND_REMOVED":
      return actorUsername ? `${actorUsername} vous a retiré de sa liste d'amis.` : null;
    default:
      return null;
  }
}

export default function FriendsPage() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendListEntry[]>([]);
  const [brokenFriendAvatarIds, setBrokenFriendAvatarIds] = useState<Set<number>>(new Set());
  const [requests, setRequests] = useState<FriendRequestLists>({ incoming: [], outgoing: [] });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [addUserId, setAddUserId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unreadNotificationsCount = notifications.filter(
    (notification) => !notification.read,
  ).length;
  const MAX_SIGNED_INT_32 = 2147483647;

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [list, reqs, notifs] = await Promise.all([
        listFriends(),
        listRequests(),
        listNotifications(),
      ]);
      setFriends(list);
      setBrokenFriendAvatarIds(new Set());
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

  useEffect(() => {
    if (!user) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refresh();
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refresh, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const handleNotificationNew = (payload: WsResponse<NotificationItem>) => {
      if (!payload.success) {
        return;
      }

      void refresh();
      notifyFriendsBadgeRefresh();
    };

    const handleFriendsSync = (payload: WsResponse<FriendsSyncPayload>) => {
      if (!payload.success) {
        return;
      }

      void refresh();
      notifyFriendsBadgeRefresh();
    };

    onWs("notification:new", handleNotificationNew);
    onWs("friends:sync", handleFriendsSync);

    return () => {
      offWs("notification:new", handleNotificationNew);
      offWs("friends:sync", handleFriendsSync);
    };
  }, [refresh, user]);

  const markFriendAvatarBroken = (userId: number) => {
    setBrokenFriendAvatarIds((previousIds) => {
      if (previousIds.has(userId)) {
        return previousIds;
      }

      const nextIds = new Set(previousIds);
      nextIds.add(userId);
      return nextIds;
    });
  };

  async function handleSend() {
    const normalizedIdentifier = addUserId.trim();
    if (!normalizedIdentifier) {
      setError("Identifiant utilisateur invalide");
      return;
    }

    let receiverUserId: number;

    if (/^\d+$/.test(normalizedIdentifier)) {
      const parsed = Number(normalizedIdentifier);
      if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > MAX_SIGNED_INT_32) {
        setError("Identifiant utilisateur invalide");
        return;
      }
      receiverUserId = parsed;
    } else {
      if (!/^[a-zA-Z0-9._-]+$/.test(normalizedIdentifier)) {
        setError("Identifiant alphanumérique invalide");
        return;
      }

      const resolvedUser = await getUserByIdentifier(normalizedIdentifier);
      receiverUserId = resolvedUser.id;
    }

    if (!Number.isSafeInteger(receiverUserId) || receiverUserId <= 0) {
      setError("Identifiant utilisateur invalide");
      return;
    }

    try {
      await sendFriendRequest(receiverUserId);
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
    notifyFriendsBadgeRefresh();
  }

  async function handleDecline(id: number) {
    await declineRequest(id);
    await refresh();
    notifyFriendsBadgeRefresh();
  }

  async function handleRemove(userId: number) {
    await removeFriend(userId);
    await refresh();
  }

  async function handleMarkAll() {
    await markAllRead();
    await refresh();
    notifyFriendsBadgeRefresh();
  }

  async function handleMarkOne(id: number) {
    await markRead(id);
    await refresh();
    notifyFriendsBadgeRefresh();
  }

  async function handleDeleteNotification(id: number) {
    await deleteNotification(id);
    await refresh();
    notifyFriendsBadgeRefresh();
  }

  if (!user) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <Panel className="w-full max-w-lg p-8 text-center">
          <h1 className="m-0 text-2xl font-semibold text-text">Ton réseau arrive après connexion</h1>
          <p className="mt-3 text-sm text-text/70">
            Connecte-toi pour gérer tes amis, invitations et notifications en temps réel.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-text transition hover:bg-primary-hover sm:text-base"
              to="/login"
            >
              Se connecter
            </Link>
            <Link
              className={`${secondaryButtonClassName} inline-flex items-center justify-center px-5 py-3 text-sm sm:text-base`}
              to="/register"
            >
              Créer un compte
            </Link>
          </div>
        </Panel>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-[8%] lg:py-10">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.85fr)]">
        <Panel className="relative overflow-hidden p-6 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--color-primary)_24%,transparent),transparent_55%),radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--color-accent)_14%,transparent),transparent_40%)] before:content-[''] sm:p-7">
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
                <div className="rounded-[22px] border border-text/10 bg-background/80 px-4 py-3 text-center">
                  <p className="m-0 text-2xl font-semibold text-text">{friends.length}</p>
                  <p className="m-0 text-xs uppercase tracking-[0.2em] text-text/50">Amis</p>
                </div>
                <div className="rounded-[22px] border border-text/10 bg-background/80 px-4 py-3 text-center">
                  <p className="m-0 text-2xl font-semibold text-text">{requests.incoming.length}</p>
                  <p className="m-0 text-xs uppercase tracking-[0.2em] text-text/50">Reçues</p>
                </div>
                <div className="rounded-[22px] border border-text/10 bg-background/80 px-4 py-3 text-center">
                  <p className="m-0 text-2xl font-semibold text-text">{unreadNotificationsCount}</p>
                  <p className="m-0 text-xs uppercase tracking-[0.2em] text-text/50">Non lues</p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-text/10 bg-background/78 p-4 sm:p-5">
              <div className="mb-4">
                <h2 className="m-0 text-lg font-semibold text-text">Ajouter un ami</h2>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                <label className="flex flex-1 flex-col gap-2 text-sm">
                  <span className="font-medium text-text/75">Identifiant ou pseudo</span>
                  <input
                    className="rounded-xl border border-text/10 bg-surface px-4 py-3 text-text outline-none placeholder:text-text/40"
                    inputMode="text"
                    onChange={(event) => {
                      const alphanumericIdentifier = event.target.value.replace(
                        /[^a-zA-Z0-9._-]/g,
                        "",
                      );
                      setAddUserId(alphanumericIdentifier);
                    }}
                    placeholder="Ex: 42 ou alice_42"
                    type="text"
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
                <p className="mt-4 text-sm text-success">{feedback}</p>
              ) : null}
              {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
            </div>
          </div>
        </Panel>

        <Panel className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="m-0 text-xs font-semibold uppercase tracking-[0.24em] text-text/45">
                Journal 42
              </p>
              <h2 className="m-0 text-2xl font-semibold text-text">Activité récente</h2>
            </div>
            {unreadNotificationsCount > 0 ? (
              <button
                className="rounded-full border border-text/10 bg-background px-3 py-1 text-xs text-text/70 transition hover:border-primary/40 hover:text-text"
                onClick={handleMarkAll}
                type="button"
              >
                Tout marquer comme lu
              </button>
            ) : null}
          </div>

          {notifications.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-text/10 bg-background/70 px-5 py-6 text-sm text-text/60">
              Aucune activité pour le moment.
            </div>
          ) : (
            <ul className="flex flex-col gap-3 text-sm">
              {notifications.slice(0, 8).map((notification) => (
                <li
                  className={`rounded-[22px] border p-4 ${
                    notification.read
                      ? "border-text/10 bg-background/60 opacity-70"
                      : "border-primary/20 bg-primary/8"
                  }`}
                  key={notification.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="m-0 font-medium text-text">{notification.title}</p>
                      {getNotificationDescription(notification) ? (
                        <p className="mt-2 text-sm text-text/68">
                          {getNotificationDescription(notification)}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-text/60">
                        {new Date(notification.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {!notification.read ? (
                        <button
                          className="rounded-full border border-text/10 bg-background px-3 py-1 text-xs text-text/75 transition hover:border-primary/40 hover:text-text"
                          onClick={() => handleMarkOne(notification.id)}
                          type="button"
                        >
                          Marquer comme lu
                        </button>
                      ) : null}
                      {notification.dismissible ? (
                        <button
                          className="rounded-full border border-text/10 bg-background px-3 py-1 text-xs text-text/75 transition hover:border-text/35 hover:text-text"
                          onClick={() => handleDeleteNotification(notification.id)}
                          type="button"
                        >
                          Supprimer
                        </button>
                      ) : null}
                    </div>
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
                Action requise
              </p>
              <h2 className="m-0 text-2xl font-semibold text-text">
                Invitations en attente
              </h2>
            </div>
            <span className="rounded-full border border-text/10 bg-background px-3 py-1 text-xs text-text/65">
              {requests.incoming.length} à traiter
            </span>
          </div>

          {requests.incoming.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-text/10 bg-background/70 px-5 py-6 text-sm text-text/60">
              Aucune invitation en attente.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {requests.incoming.map((request) => (
                <li
                  className="rounded-[22px] border border-text/10 bg-background/75 p-4"
                  key={request.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      {request.counterpartAvatarUrl ? (
                        <img
                          alt={`Avatar de ${request.counterpartUsername}`}
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                          src={request.counterpartAvatarUrl}
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-text/8 text-sm font-semibold text-text/80">
                          {request.counterpartUsername.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="m-0 truncate font-medium text-text">
                          {request.counterpartUsername}
                        </p>
                        <p className="mt-1 text-sm text-text/60">
                          Accepte ou refuse pour commencer à jouer ensemble.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <PrimaryButton
                        className="px-4 py-2 text-sm"
                        onClick={() => handleAccept(request.id)}
                      >
                        Accepter
                      </PrimaryButton>
                      <button
                        className="rounded-xl border border-text/20 px-4 py-2 text-sm text-text transition hover:border-text/35 hover:bg-text/5"
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
            <span className="rounded-full border border-text/10 bg-background px-3 py-1 text-xs text-text/65">
              {friends.length} contact{friends.length > 1 ? "s" : ""}
            </span>
          </div>

          {friends.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-text/10 bg-background/70 px-5 py-6 text-sm text-text/60">
              Aucun ami pour le moment.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {friends.map((friend) => (
                <li
                  className="rounded-[22px] border border-text/10 bg-background/75 p-4"
                  key={friend.friendshipId}
                >
                  {(() => {
                    const canDisplayAvatar =
                      typeof friend.avatarUrl === "string" &&
                      friend.avatarUrl.length > 0 &&
                      !brokenFriendAvatarIds.has(friend.userId);

                    return (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      className="flex min-w-0 items-center gap-3"
                      to={`/profile/${friend.userId}`}
                    >
                      <span className="relative shrink-0">
                        {canDisplayAvatar ? (
                          <img
                            alt={`Avatar de ${friend.username}`}
                            className="h-9 w-9 rounded-full object-cover"
                            loading="lazy"
                            onError={() => markFriendAvatarBroken(friend.userId)}
                            src={friend.avatarUrl as string}
                          />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-text/8 text-sm font-semibold text-text/80">
                            {friend.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span
                          aria-label={friend.status}
                          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-background ${
                            friend.status === "online" ? "bg-success" : "bg-text/30"
                          }`}
                        />
                      </span>
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
                    );
                  })()}
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
            <span className="rounded-full border border-text/10 bg-background px-3 py-1 text-xs text-text/65">
              {requests.outgoing.length} en cours
            </span>
          </div>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {requests.outgoing.map((request) => (
              <li
                className="rounded-[22px] border border-text/10 bg-background/75 p-4"
                key={request.id}
              >
                <div className="flex items-center gap-3">
                  {request.counterpartAvatarUrl ? (
                    <img
                      alt={`Avatar de ${request.counterpartUsername}`}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                      src={request.counterpartAvatarUrl}
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-text/8 text-sm font-semibold text-text/80">
                      {request.counterpartUsername.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="m-0 truncate font-medium text-text">
                      {request.counterpartUsername}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-text/55">
                      {request.status === "pending" ? "En attente" : request.status}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </main>
  );
}
