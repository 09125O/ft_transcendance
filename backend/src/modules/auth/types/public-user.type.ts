import { User } from "@generated/prisma/client";

export type PublicUser = Omit<User, "password" | "email">;
