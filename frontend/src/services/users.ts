import { apiRequest } from "./api";

export type PublicUser = {
  id: number;
  username: string;
  avatar_url: string | null;
  status: "online" | "offline";
  createdAt: string;
};

export function getUserById(userId: number): Promise<PublicUser> {
  return apiRequest<PublicUser>(`/users/${userId}`);
}
