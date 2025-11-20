/**
 * Server-Sent Events (SSE) Service Interface
 *
 * Defines the contract for streaming real-time updates to clients using SSE.
 * SSE is ideal for one-way server-to-client communication like notifications,
 * progress updates, and live data feeds.
 *
 * Use Cases:
 * - Task progress updates
 * - Real-time notifications
 * - Live data feeds
 * - Server-initiated events
 *
 * When to use SSE vs WebSocket:
 * - SSE: One-way communication, simpler implementation, automatic reconnection
 * - WebSocket: Bi-directional communication, more complex scenarios
 */

/**
 * SSE Event data structure
 */
export interface SSEEvent<T = unknown> {
  /** Event type identifier (e.g., 'task:created', 'notification:new') */
  event?: string;
  /** Event payload data */
  data: T;
  /** Optional event ID for tracking */
  id?: string;
  /** Retry interval in milliseconds (client reconnection) */
  retry?: number;
}

/**
 * SSE Stream configuration options
 */
export interface SSEStreamOptions {
  /** Keep-alive ping interval in milliseconds (default: 15000) */
  keepAlive?: number;
  /** Initial retry interval for client reconnection (default: 3000) */
  retryInterval?: number;
  /** Maximum number of events to buffer (default: 100) */
  maxBufferSize?: number;
}

/**
 * SSE Service Interface
 *
 * Provides methods for creating SSE streams and broadcasting events to clients.
 */
export interface ISSEService {
  /**
   * Creates a ReadableStream from an async generator for SSE
   *
   * @param generator - Async generator yielding SSE events
   * @param options - Stream configuration options
   * @returns ReadableStream compatible with Response body
   *
   * @example
   * ```typescript
   * async function* taskUpdates() {
   *   yield { event: 'task:created', data: { id: '123', title: 'New Task' } };
   *   yield { event: 'task:updated', data: { id: '123', status: 'completed' } };
   * }
   *
   * const stream = sseService.createStream(taskUpdates());
   * return new Response(stream, {
   *   headers: {
   *     'Content-Type': 'text/event-stream',
   *     'Cache-Control': 'no-cache',
   *     'Connection': 'keep-alive',
   *   },
   * });
   * ```
   */
  createStream<T>(
    generator: AsyncGenerator<SSEEvent<T>>,
    options?: SSEStreamOptions,
  ): ReadableStream<Uint8Array>;

  /**
   * Broadcasts an event to a specific channel
   *
   * This is useful for multi-tenant scenarios where different clients
   * subscribe to different channels (e.g., per-user, per-workspace).
   *
   * @param channel - Channel identifier (e.g., 'tasks', 'user:123')
   * @param event - Event to broadcast
   * @returns Promise that resolves when event is queued for broadcast
   *
   * @example
   * ```typescript
   * await sseService.broadcastEvent('tasks', {
   *   event: 'task:created',
   *   data: { id: '123', title: 'New Task' },
   * });
   * ```
   */
  broadcastEvent<T>(channel: string, event: SSEEvent<T>): Promise<void>;

  /**
   * Subscribes to a channel for receiving events
   *
   * Returns an async generator that yields events from the channel.
   * Useful for internal event consumption or bridging to other systems.
   *
   * @param channel - Channel identifier
   * @returns Async generator yielding events
   *
   * @example
   * ```typescript
   * const events = sseService.subscribe('tasks');
   * for await (const event of events) {
   *   console.log('Received:', event);
   * }
   * ```
   */
  subscribe<T>(channel: string): AsyncGenerator<SSEEvent<T>>;

  /**
   * Gets the number of active subscribers for a channel
   *
   * @param channel - Channel identifier
   * @returns Number of active subscribers
   */
  getSubscriberCount(channel: string): number;

  /**
   * Closes all connections and cleans up resources
   *
   * Should be called on server shutdown to gracefully close all SSE connections.
   */
  cleanup(): Promise<void>;
}
