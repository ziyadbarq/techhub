import { config } from "dotenv";
import fs from "node:fs";
import { defineConfig, env } from "prisma/config";

// Load environment variables from .env.local if present, otherwise fall back to .env
const envFile = fs.existsSync(".env.local") ? ".env.local" : ".env";
config({ path: envFile });

export default defineConfig({
  schema: "src/infrastructure/database/prisma/schema.prisma",
  migrations: {
    path: "src/infrastructure/database/prisma/migrations",
    seed: "tsx src/infrastructure/database/prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
