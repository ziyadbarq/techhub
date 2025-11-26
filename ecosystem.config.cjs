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

module.exports = {
  apps: [
    {
      name: "barq-web",
      script: "node",
      args: "scripts/start-server.js --skip-worker",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "barq-worker",
      script: "npx",
      args: "dotenv -e .env.local -- tsx src/infrastructure/services/queue/worker.ts",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
