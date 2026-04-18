import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
  const { user: currentUser } = useAuth();
  const [friendsBadgeCount, setFriendsBadgeCount] = useState(0);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

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
      setIsAccountMenuOpen(false);
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

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!accountMenuRef.current?.contains(target)) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isAccountMenuOpen]);

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
          {currentUser ? (
            <>
              <Link className="inline-flex h-9 items-center text-sm font-medium text-text" to="/leaderboard">
                Leaderboard
              </Link>
              <Link className="relative inline-flex h-9 items-center text-sm font-medium text-text" to="/friends">
                Amis
                {friendsBadgeCount > 0 ? (
                  <span className="absolute -right-3 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-[0_8px_18px_-10px_rgba(239,68,68,0.95)]">
                    {friendsBadgeCount > 99 ? "99+" : friendsBadgeCount}
                  </span>
                ) : null}
              </Link>
              <div className="relative" ref={accountMenuRef}>
                <PrimaryButton
                  aria-expanded={isAccountMenuOpen}
                  aria-haspopup="menu"
                  className={
                    isFortyTwoOauthUser(currentUser.email)
                      ? "h-9 px-2 text-sm"
                      : "h-9 px-4 text-sm"
                  }
                  onClick={() => {
                    setIsAccountMenuOpen((isOpen) => !isOpen);
                  }}
                  type="button"
                >
                  {isFortyTwoOauthUser(currentUser.email) ? (
                    <span className="inline-flex h-full max-w-[11rem] items-center gap-2 leading-none">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/8 text-[11px] font-semibold uppercase text-text">
                        {currentUser.avatar_url ? (
                          <img
                            alt={`Avatar de ${currentUser.username}`}
                            className="h-full w-full object-cover"
                            src={currentUser.avatar_url}
                          />
                        ) : (
                          currentUser.username.slice(0, 1).toUpperCase()
                        )}
                      </span>
                      <span className="flex min-w-0 items-center truncate leading-none">{currentUser.username}</span>
                    </span>
                  ) : (
                    "Login"
                  )}
                </PrimaryButton>
                {isAccountMenuOpen ? (
                  <div
                    className="absolute right-0 z-50 mt-2 min-w-[12rem] rounded-2xl border border-white/12 bg-surface/95 p-2 shadow-[0_24px_64px_-42px_rgba(0,0,0,0.85)] backdrop-blur"
                    role="menu"
                  >
                    <Link
                      className="block rounded-xl px-3 py-2 text-sm text-text transition hover:bg-white/8"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                      }}
                      role="menuitem"
                      to="/profile"
                    >
                      Mon profil
                    </Link>
                    <button
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm text-text transition hover:bg-white/8"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        void (async () => {
                          await logout();
                        })();
                      }}
                      role="menuitem"
                      type="button"
                    >
                      Se déconnecter
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Link className="inline-flex h-9 items-center text-sm font-medium text-text" to="/register">
                S'identifier
              </Link>
              <Link className="inline-flex h-9 items-center text-sm font-medium text-text" to="/login">
                Se connecter
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
