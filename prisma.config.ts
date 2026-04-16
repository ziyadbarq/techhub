import { config } from "dotenv";
import { existsSync } from "node:fs";
import { defineConfig, env } from "prisma/config";

// Load environment variables from .env.local if present, otherwise fall back to .env
const envFile = existsSync(".env.local") ? ".env.local" : ".env";
// override: so local DATABASE_URL etc. win over inherited process env (e.g. IDE-injected vars)
config({ path: envFile, override: true });

const dbUrl = env("DATABASE_URL");
const shadowDbUrl =
  process.env.SHADOW_DATABASE_URL ||
  (() => {
    const url = new URL(dbUrl);
    const dbName = url.pathname.replace(/^\//, "");
    url.pathname = `/${dbName}_shadow`;
    return url.toString();
  })();

export default defineConfig({
  schema: "src/infrastructure/database/prisma/schema",
  migrations: {
    path: "src/infrastructure/database/prisma/schema/migrations",
    seed: "tsx src/infrastructure/database/prisma/seed.ts",
  },
  datasource: {
    url: dbUrl,
    shadowDatabaseUrl: shadowDbUrl,
  },
});
