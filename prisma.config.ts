// import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load environment variables from .env.local (Next.js convention)
// config({ path: ".env.local" });

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
