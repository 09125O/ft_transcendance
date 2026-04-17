import { apiRequest } from "./api";

export type NotificationItem = {
  id: number;
  type: string;
  title: string;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
};

type NotificationsPage = {
  items: NotificationItem[];
  nextCursor: string | null;
};

export function listNotifications(): Promise<NotificationsPage> {
  return apiRequest<NotificationsPage>("/notifications");
}

export function markRead(id: number) {
  return apiRequest(`/notifications/${id}/read`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

export function markAllRead() {
  return apiRequest("/notifications/read-all", {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}
