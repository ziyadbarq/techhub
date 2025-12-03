/**
 * PM2 Ecosystem Configuration
 *
 * Production process management for:
 * - barq-web: Next.js application server
 * - barq-worker: Background job worker
 *
 * Usage:
 *   npm run pm2:start   - Start all processes
 *   npm run pm2:stop    - Stop all processes
 *   npm run pm2:restart - Restart all processes
 *   npm run pm2:logs    - View logs
 *   npm run pm2:status  - View process status
 *
 * Direct PM2 commands:
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 logs barq-worker
 *   pm2 restart barq-web
 */
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const envFiles = [".env.production", ".env.local"]
  .map((file) => path.join(__dirname, file))
  .filter((filePath) => fs.existsSync(filePath));

const baseEnv = envFiles.reduce((acc, filePath) => {
  const parsed = dotenv.parse(fs.readFileSync(filePath));
  return { ...acc, ...parsed };
}, {});

module.exports = {
  apps: [
    {
      name: "barq-web",
      cwd: __dirname,
      script: "node",
      args: "scripts/deploy/start-server.js --skip-worker",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        ...baseEnv,
      },
      env_production: {
        NODE_ENV: "production",
        ...baseEnv,
      },
    },
    {
      name: "barq-worker",
      cwd: __dirname,
      script: "./node_modules/.bin/tsx",
      args: "--import ./scripts/build/shim-server-only.js src/infrastructure/services/queue/worker.ts",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      exp_backoff_restart_delay: 2000,
      env: {
        NODE_ENV: "development",
        ...baseEnv,
      },
      env_production: {
        NODE_ENV: "production",
        ...baseEnv,
      },
    },
  ],
};
