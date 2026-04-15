import { config as dotenvConfig } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { defineConfig, env } from "prisma/config";

const envCandidates = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../.env"),
];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    dotenvConfig({
      path: envPath,
      override: false,
    });
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
