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
    <main className="flex flex-1 flex-col gap-6 px-[10%] py-10">
      <div className="grid gap-6 md:grid-cols-2">
        <Panel className="gap-4 p-6">
          <h2 className="text-lg font-semibold">Ajouter un ami</h2>
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex flex-col gap-1">
              <span>Identifiant utilisateur</span>
              <input
                className="rounded-md border border-white/10 bg-background px-3 py-2"
                onChange={(event) => setAddUserId(event.target.value)}
                placeholder="Ex: 42"
                type="number"
                value={addUserId}
              />
            </label>
            <div className="flex items-center gap-3">
              <PrimaryButton onClick={handleSend}>Envoyer la demande</PrimaryButton>
              {feedback && <span className="text-white/70">{feedback}</span>}
            </div>
            {error && <p className="text-danger">{error}</p>}
          </div>
        </Panel>

        <Panel className="gap-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Notifications</h2>
            {notifications.some((notification) => !notification.read) && (
              <button
                className="text-sm text-white/70 underline"
                onClick={handleMarkAll}
                type="button"
              >
                Tout marquer lu
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-white/60">Aucune notification.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {notifications.slice(0, 8).map((notification) => (
                <li
                  className={`flex items-start justify-between gap-3 rounded-md border border-white/10 p-3 ${
                    notification.read ? "opacity-60" : "bg-white/5"
                  }`}
                  key={notification.id}
                >
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-xs text-white/60">
                      {new Date(notification.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  {!notification.read && (
                    <button
                      className="text-xs underline"
                      onClick={() => handleMarkOne(notification.id)}
                      type="button"
                    >
                      Marquer lu
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel className="gap-4 p-6">
        <h2 className="text-lg font-semibold">
          Demandes reçues ({requests.incoming.length})
        </h2>
        {requests.incoming.length === 0 ? (
          <p className="text-sm text-white/60">Aucune demande en attente.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {requests.incoming.map((request) => (
              <li
                className="flex items-center justify-between rounded-md border border-white/10 p-3"
                key={request.id}
              >
                <span className="font-medium">{request.counterpartUsername}</span>
                <div className="flex gap-2">
                  <PrimaryButton
                    className="px-3 py-1 text-sm"
                    onClick={() => handleAccept(request.id)}
                  >
                    Accepter
                  </PrimaryButton>
                  <button
                    className="rounded-md border border-white/20 px-3 py-1 text-sm"
                    onClick={() => handleDecline(request.id)}
                    type="button"
                  >
                    Refuser
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel className="gap-4 p-6">
        <h2 className="text-lg font-semibold">Mes amis ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-sm text-white/60">Aucun ami pour le moment.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {friends.map((friend) => (
              <li
                className="flex items-center justify-between rounded-md border border-white/10 p-3"
                key={friend.friendshipId}
              >
                <Link className="flex items-center gap-3" to={`/profile/${friend.userId}`}>
                  <span
                    aria-label={friend.status}
                    className={`h-2 w-2 rounded-full ${
                      friend.status === "online" ? "bg-green-400" : "bg-white/30"
                    }`}
                  />
                  <span className="font-medium">{friend.username}</span>
                </Link>
                <button
                  className="text-sm text-danger underline"
                  onClick={() => handleRemove(friend.userId)}
                  type="button"
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {requests.outgoing.length > 0 && (
        <Panel className="gap-4 p-6">
          <h2 className="text-lg font-semibold">
            Demandes envoyées ({requests.outgoing.length})
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            {requests.outgoing.map((request) => (
              <li
                className="flex items-center justify-between rounded-md border border-white/10 p-3"
                key={request.id}
              >
                <span>{request.counterpartUsername}</span>
                <span className="text-xs text-white/60">
                  {request.status === "pending" ? "En attente" : request.status}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </main>
  );
}
