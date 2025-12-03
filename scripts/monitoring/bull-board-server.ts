#!/usr/bin/env node

/**
 * Bull Board UI server (development-focused)
 *
 * Starts an Express server hosting Bull Board for full queue management.
 * By default only runs in development; set ENABLE_BULL_BOARD=true to allow in production.
 *
 * Usage:
 *   npm run queues:board              # dev only
 *   ENABLE_BULL_BOARD=true npm run queues:board   # allow in prod (use with caution)
 *
 * Env:
 *   REDIS_URL (required)
 *   BULL_BOARD_PORT (optional, default 3010)
 *   BULL_BOARD_BASE_PATH (optional, default /bull-board)
 *   BULL_BOARD_TOKEN (optional, bearer token for access control)
 */

import { config as loadEnv } from "dotenv";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { QUEUE_NAMES } from "../src/core/domain/jobs/job-names";
import path from "path";

// Load env files (local first)
loadEnv({ path: path.join(process.cwd(), ".env.local") });
loadEnv();

const PORT = Number(process.env.BULL_BOARD_PORT ?? 3010);
const BASE_PATH = process.env.BULL_BOARD_BASE_PATH ?? "/bull-board";
const TOKEN = process.env.BULL_BOARD_TOKEN ?? "";
const REDIS_URL = process.env.REDIS_URL;
const IS_PROD = process.env.NODE_ENV === "production";
const ALLOW_PROD = process.env.ENABLE_BULL_BOARD === "true";

if (!REDIS_URL) {
  console.error(
    "Missing REDIS_URL. Set it in .env.local before starting Bull Board.",
  );
  process.exit(1);
}

if (IS_PROD && !ALLOW_PROD) {
  console.error(
    "Bull Board is disabled in production. Set ENABLE_BULL_BOARD=true to override (use cautiously).",
  );
  process.exit(1);
}

// Reuse a single Redis connection for all queues
const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: false,
});

const queues = [
  new Queue(QUEUE_NAMES.TASKS, { connection }),
  new Queue(QUEUE_NAMES.EMAIL, { connection }),
  new Queue(QUEUE_NAMES.MAINTENANCE, { connection }),
];

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath(BASE_PATH);

createBullBoard({
  queues: queues.map((queue) => new BullMQAdapter(queue)),
  serverAdapter,
});

const app = express();

// Optional bearer token guard (set BULL_BOARD_TOKEN to enable)
if (TOKEN) {
  const guard = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${TOKEN}`) {
      res.status(401).send("Unauthorized");
      return;
    }
    next();
  };
  app.use(BASE_PATH, guard);
}

app.use(BASE_PATH, serverAdapter.getRouter());

const server = app.listen(PORT, () => {
  console.log(`Bull Board running at http://localhost:${PORT}${BASE_PATH}`);
  if (TOKEN) {
    console.log(
      "Access protected by bearer token (Authorization: Bearer <token>)",
    );
  } else {
    console.log(
      "Warning: No auth enabled. Set BULL_BOARD_TOKEN for protection.",
    );
  }
});

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  console.log(`Received ${signal}, shutting down Bull Board...`);
  server.close();
  await Promise.allSettled(queues.map((queue) => queue.close()));
  await connection.quit();
  console.log("Bull Board stopped");
  process.exit(0);
}

process.on("SIGINT", (signal) => {
  void shutdown(signal);
});
process.on("SIGTERM", (signal) => {
  void shutdown(signal);
});
