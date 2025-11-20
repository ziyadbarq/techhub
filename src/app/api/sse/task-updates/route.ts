/**
 * SSE Task Updates API Route
 *
 * Streams real-time task updates to clients using Server-Sent Events.
 * This endpoint demonstrates how to use SSE for live notifications.
 *
 * Usage:
 * - Connect to: GET /api/sse/task-updates
 * - Events: task:created, task:updated, task:completed, task:deleted
 *
 * Example client code:
 * ```typescript
 * const eventSource = new EventSource('/api/sse/task-updates');
 * eventSource.addEventListener('task:created', (e) => {
 *   const task = JSON.parse(e.data);
 *   console.log('New task:', task);
 * });
 * ```
 */

import type { NextRequest } from "next/server";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ISSEService, SSEEvent } from "@/core/services";

/**
 * GET handler for SSE task updates stream
 */
export async function GET(request: NextRequest) {
  // Get SSE service from DI container
  const container = getContainer();
  const sseService = container.get<ISSEService>(DI_TOKENS.ISSEService);

  // Get channel from query params (optional, defaults to 'tasks')
  const searchParams = request.nextUrl.searchParams;
  const channel = searchParams.get("channel") || "tasks";

  // Create async generator that subscribes to task updates
  async function* taskUpdateStream() {
    // Send initial connection event
    yield {
      event: "connected",
      data: {
        message: "Connected to task updates",
        channel,
        timestamp: Date.now(),
      },
    } as SSEEvent;

    // Subscribe to task updates from the channel
    for await (const event of sseService.subscribe(channel)) {
      yield event;
    }
  }

  // Create SSE stream
  const stream = sseService.createStream(taskUpdateStream(), {
    keepAlive: 15000, // Send keep-alive ping every 15 seconds
    retryInterval: 3000, // Client should retry after 3 seconds if disconnected
  });

  // Return SSE response with proper headers
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}

/**
 * Runtime configuration for streaming
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
