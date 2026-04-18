import type { SafeUser } from "./auth";
import { apiRequest } from "./api";

export function getUserById(userId: number): Promise<SafeUser> {
  return apiRequest<SafeUser>(`/users/${userId}`);
}

export function getUserByIdentifier(identifier: string): Promise<{ id: number }> {
  return apiRequest<{ id: number }>(`/users/lookup/${encodeURIComponent(identifier)}`);
}
