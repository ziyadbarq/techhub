/**
 * Bull Board Admin UI Route
 *
 * Provides web-based UI for monitoring and managing job queues.
 * Only accessible in development mode for security.
 */

import { Queue } from "bullmq";
import { env } from "@/infrastructure/config/env";
import { logger } from "@/lib/logger";
import { QUEUE_NAMES } from "@/core/domain/jobs/job-names";

// Lazy queue instances (created only when needed)
let queues: Map<string, Queue> | null = null;

/**
 * Gets or creates queue instances for Bull Board
 */
function getQueues(): Map<string, Queue> {
  if (!queues) {
    const redisUrl = env.REDIS_URL;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IORedis = require("ioredis");

    const connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    queues = new Map([
      [QUEUE_NAMES.TASKS, new Queue(QUEUE_NAMES.TASKS, { connection })],
      [QUEUE_NAMES.EMAIL, new Queue(QUEUE_NAMES.EMAIL, { connection })],
      [
        QUEUE_NAMES.MAINTENANCE,
        new Queue(QUEUE_NAMES.MAINTENANCE, { connection }),
      ],
    ]);
  }

  return queues;
}

/**
 * GET handler - Returns Bull Board UI
 */
export async function GET(_request: Request): Promise<Response> {
  // Security: Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not available in production", { status: 403 });
  }

  try {
    // Serve the UI HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Queue Dashboard</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    }
    .header {
      background: #1f2937;
      color: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header h1 {
      margin: 0;
      font-size: 1.5rem;
    }
    .header p {
      margin: 0.5rem 0 0;
      color: #9ca3af;
      font-size: 0.875rem;
    }
    .content {
      padding: 2rem;
    }
    .queue-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .queue-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .queue-card h3 {
      margin: 0 0 1rem;
      color: #1f2937;
    }
    .queue-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }
    .stat {
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 0.375rem;
      text-align: center;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #1f2937;
    }
    .stat-label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      margin-top: 0.25rem;
    }
    .info {
      background: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 1rem;
      margin-top: 2rem;
      border-radius: 0.25rem;
    }
    .info p {
      margin: 0;
      color: #1e40af;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Job Queue Dashboard</h1>
    <p>Monitor and manage background job queues</p>
  </div>
  <div class="content">
    <div class="queue-list" id="queues">
      <p>Loading queue statistics...</p>
    </div>
    <div class="info">
      <p><strong>Note:</strong> This dashboard is only available in development mode. For full queue management, use Bull Board UI library with a proper adapter.</p>
      <p style="margin-top: 0.5rem;">Queue names: ${Array.from(getQueues().keys()).join(", ")}</p>
    </div>
  </div>
  <script>
    async function loadQueueStats() {
      try {
        const response = await fetch('/api/admin/queues/stats');
        const data = await response.json();

        const container = document.getElementById('queues');
        container.innerHTML = data.queues.map(queue => \`
          <div class="queue-card">
            <h3>\${queue.name}</h3>
            <div class="queue-stats">
              <div class="stat">
                <div class="stat-value">\${queue.waiting}</div>
                <div class="stat-label">Waiting</div>
              </div>
              <div class="stat">
                <div class="stat-value">\${queue.active}</div>
                <div class="stat-label">Active</div>
              </div>
              <div class="stat">
                <div class="stat-value">\${queue.completed}</div>
                <div class="stat-label">Completed</div>
              </div>
              <div class="stat">
                <div class="stat-value">\${queue.failed}</div>
                <div class="stat-label">Failed</div>
              </div>
            </div>
          </div>
        \`).join('');
      } catch (error) {
        const container = document.getElementById('queues');
        if (container) {
          container.innerHTML = '<p style="color: #b91c1c;">Failed to load queue stats. Retry in a moment.</p>';
        }
      }
    }

    // Load stats immediately and refresh every 5 seconds
    loadQueueStats();
    setInterval(loadQueueStats, 5000);
  </script>
</body>
</html>
    `;

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    logger.scope("BullBoard").error("GET", "Error rendering dashboard", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
