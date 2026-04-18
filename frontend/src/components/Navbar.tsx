import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { logout } from "../services/auth";
import { subscribeFriendsBadgeRefresh } from "../services/friendsBadge";
import { listRequests } from "../services/friends";
import { listNotifications, type NotificationItem } from "../services/notifications";
import { offWs, onWs, type WsResponse } from "../services/ws";
import PrimaryButton from "./PrimaryButton";

function isFriendRequestNotification(notification: NotificationItem): boolean {
  return notification.type === "FRIEND_REQUEST_RECEIVED";
}

function isFortyTwoOauthUser(email: string): boolean {
  return /^42-\d+@oauth\.local$/i.test(email);
}

type FriendsSyncPayload = {
  reason: "request_created" | "request_accepted" | "request_declined" | "friend_removed";
  requestId?: number;
  actorUserId: number;
};

export default function Navbar() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [friendsBadgeCount, setFriendsBadgeCount] = useState(0);

  const refreshFriendsBadge = useCallback(async () => {
    if (!currentUser) {
      setFriendsBadgeCount(0);
      return;
    }

    try {
      const [requests, notifications] = await Promise.all([
        listRequests(),
        listNotifications(),
      ]);
      const unreadNonFriendRequestNotifications = notifications.items.filter(
        (notification) => !notification.read && !isFriendRequestNotification(notification),
      ).length;
      setFriendsBadgeCount(
        requests.incoming.length + unreadNonFriendRequestNotifications,
      );
    } catch {
      setFriendsBadgeCount(0);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setFriendsBadgeCount(0);
      return;
    }

    void refreshFriendsBadge();
    const unsubscribeBadgeRefresh = subscribeFriendsBadgeRefresh(() => {
      void refreshFriendsBadge();
    });
    const interval = window.setInterval(() => {
      void refreshFriendsBadge();
    }, 30000);

    return () => {
      window.clearInterval(interval);
      unsubscribeBadgeRefresh();
    };
  }, [currentUser, refreshFriendsBadge]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const handleNotificationNew = (payload: WsResponse<NotificationItem>) => {
      if (!payload.success) {
        return;
      }

      void refreshFriendsBadge();
    };

    const handleFriendsSync = (payload: WsResponse<FriendsSyncPayload>) => {
      if (!payload.success) {
        return;
      }

      void refreshFriendsBadge();
    };

    onWs("notification:new", handleNotificationNew);
    onWs("friends:sync", handleFriendsSync);

    return () => {
      offWs("notification:new", handleNotificationNew);
      offWs("friends:sync", handleFriendsSync);
    };
  }, [currentUser, refreshFriendsBadge]);

  return (
    <nav className="sticky top-3 z-50 px-4 py-3 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 rounded-[20px] border border-white/12 bg-surface/86 px-4 py-3 text-text shadow-[0_24px_64px_-42px_rgba(0,0,0,0.85)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="text-sm font-medium uppercase tracking-[0.18em]"
          to="/"
        >
          Quiz Arena
        </Link>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end sm:gap-5">
          <Link className="text-sm font-medium text-text" to="/leaderboard">
            Leaderboard
          </Link>
          {currentUser !== null ? (
            <>
              {isFortyTwoOauthUser(currentUser.email) ? (
                <Link
                  aria-label="Voir mon profil"
                  className="inline-flex max-w-[15rem] items-center gap-2 rounded-full border border-white/12 bg-background/55 px-2 py-1.5 text-text transition hover:border-primary/55 hover:bg-background/75"
                  to="/profile"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/8 text-xs font-semibold uppercase">
                    {currentUser.avatar_url ? (
                      <img
                        alt={`Avatar de ${currentUser.username}`}
                        className="h-full w-full object-cover"
                        src={currentUser.avatar_url}
                      />
                    ) : (
                      currentUser.username.slice(0, 1)
                    )}
                  </span>
                  <span className="truncate text-sm font-semibold text-text">
                    {currentUser.username}
                  </span>
                </Link>
              ) : (
                <Link className="text-sm font-medium text-text" to="/profile">
                  Profil
                </Link>
              )}
              <Link className="relative text-sm font-medium text-text" to="/friends">
                Amis
                {friendsBadgeCount > 0 ? (
                  <span className="absolute -right-3 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-[0_8px_18px_-10px_rgba(239,68,68,0.95)]">
                    {friendsBadgeCount > 99 ? "99+" : friendsBadgeCount}
                  </span>
                ) : null}
              </Link>
              <PrimaryButton
                className="px-4 py-2 text-sm"
                onClick={() => {
                  void (async () => {
                    await logout();
                  })();
                }}
              >
                Se déconnecter
              </PrimaryButton>
            </>
          ) : (
            <>
              <Link className="text-sm font-medium text-text" to="/login">
                Se connecter
              </Link>
              <PrimaryButton
                className="px-4 py-2 text-sm"
                onClick={() => {
                  navigate("/register");
                }}
              >
                S'inscrire
              </PrimaryButton>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
