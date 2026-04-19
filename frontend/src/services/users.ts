import type { SafeUser } from "./auth";
import { apiRequest } from "./api";

export function getUserById(userId: number): Promise<SafeUser> {
  return apiRequest<SafeUser>(`/users/${userId}`);
}

export function getUserByIdentifier(identifier: string): Promise<{ id: number }> {
  return apiRequest<{ id: number }>(`/users/lookup/${encodeURIComponent(identifier)}`);
}

export function uploadAvatar(file: File): Promise<SafeUser> {
  const formData = new FormData();
  formData.append("avatar", file);

  return apiRequest<SafeUser>("/users/me/avatar", {
    method: "POST",
    body: formData,
  });
}
