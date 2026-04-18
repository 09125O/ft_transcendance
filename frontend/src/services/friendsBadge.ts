const FRIENDS_BADGE_REFRESH_EVENT = "friends:badge:refresh";

export function notifyFriendsBadgeRefresh(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(FRIENDS_BADGE_REFRESH_EVENT));
}

export function subscribeFriendsBadgeRefresh(
  handler: () => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = () => handler();
  window.addEventListener(FRIENDS_BADGE_REFRESH_EVENT, listener);

  return () => {
    window.removeEventListener(FRIENDS_BADGE_REFRESH_EVENT, listener);
  };
}
