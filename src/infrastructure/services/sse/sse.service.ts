/**
 * Server-Sent Events (SSE) Service Implementation
 *
 * Provides SSE streaming capabilities for real-time server-to-client communication.
 * Uses in-memory event channels for broadcasting events to multiple subscribers.
 *
 * Features:
 * - ReadableStream creation from async generators
 * - Channel-based event broadcasting
 * - Automatic keep-alive pings
 * - Graceful connection cleanup
 * - Memory-efficient buffering
 *
 * Architecture:
 * - Implements ISSEService interface from core layer
 * - Injectable service for use in DI container
 * - Thread-safe event channel management
 */

import { inject, injectable } from "inversify";
import type {
  ISSEService,
  SSEEvent,
  SSEStreamOptions,
} from "@/core/services/sse.service.interface";
import type { ILoggerService } from "@/core/services";
import { DI_TOKENS } from "@/di/types";

/**
 * Event channel for managing subscribers
 */
interface EventChannel<T> {
  subscribers: Set<(event: SSEEvent<T>) => void>;
  buffer: SSEEvent<T>[];
}

/**
 * SSE Service Implementation
 */
@injectable()
export class SSEService implements ISSEService {
  /** Map of channel ID to event channel */
  private channels = new Map<string, EventChannel<unknown>>();

  /** Keep-alive interval timers */
  private keepAliveTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private logger: ILoggerService,
  ) {}

  /**
   * Creates a ReadableStream from an async generator for SSE
   */
  createStream<T>(
    generator: AsyncGenerator<SSEEvent<T>>,
    options?: SSEStreamOptions,
  ): ReadableStream<Uint8Array> {
    const keepAlive = options?.keepAlive ?? 15000; // 15 seconds default
    const retryInterval = options?.retryInterval ?? 3000; // 3 seconds default

    const encoder = new TextEncoder();
    let keepAliveTimer: NodeJS.Timeout | null = null;
    const formatSSEMessage = this.formatSSEMessage.bind(this);
    const logger = this.logger; // Capture logger for use in callbacks

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        // Send initial retry interval
        const retryMessage = `retry: ${retryInterval}\n\n`;
        controller.enqueue(encoder.encode(retryMessage));

        // Set up keep-alive ping
        if (keepAlive > 0) {
          keepAliveTimer = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(": ping\n\n"));
            } catch (_error) {
              // Controller might be closed
              if (keepAliveTimer) {
                clearInterval(keepAliveTimer);
              }
            }
          }, keepAlive);
        }

        try {
          // Process events from generator
          for await (const event of generator) {
            const message = formatSSEMessage(event);
            controller.enqueue(encoder.encode(message));
          }
        } catch (error) {
          logger.error(
            "SSE stream error",
            error instanceof Error ? error : new Error(String(error)),
          );
          // Send error event to client
          const errorMessage = formatSSEMessage({
            event: "error",
            data: { message: "Stream error occurred" },
          });
          controller.enqueue(encoder.encode(errorMessage));
        } finally {
          // Clean up
          if (keepAliveTimer) {
            clearInterval(keepAliveTimer);
          }
          controller.close();
        }
      },

      cancel() {
        // Clean up when client disconnects
        if (keepAliveTimer) {
          clearInterval(keepAliveTimer);
        }
      },
    });
  }

  /**
   * Broadcasts an event to a specific channel
   */
  async broadcastEvent<T>(channel: string, event: SSEEvent<T>): Promise<void> {
    const eventChannel = this.getOrCreateChannel<T>(channel);

    // Add to buffer
    eventChannel.buffer.push(event);

    // Limit buffer size
    const maxBufferSize = 100;
    if (eventChannel.buffer.length > maxBufferSize) {
      eventChannel.buffer.shift(); // Remove oldest event
    }

    // Notify all subscribers
    for (const subscriber of eventChannel.subscribers) {
      try {
        subscriber(event);
      } catch (error) {
        this.logger.error(
          "Error notifying SSE subscriber",
          error instanceof Error ? error : new Error(String(error)),
          { channel },
        );
      }
    }
  }

  /**
   * Subscribes to a channel for receiving events
   */
  async *subscribe<T>(channel: string): AsyncGenerator<SSEEvent<T>> {
    const eventChannel = this.getOrCreateChannel<T>(channel);

    // Create a queue for this subscriber
    const queue: SSEEvent<T>[] = [];
    let resolver: ((value: SSEEvent<T>) => void) | null = null;

    // Subscriber callback
    const subscriber = (event: SSEEvent<T>) => {
      if (resolver) {
        resolver(event);
        resolver = null;
      } else {
        queue.push(event);
      }
    };

    // Add subscriber
    eventChannel.subscribers.add(
      subscriber as (event: SSEEvent<unknown>) => void,
    );

    try {
      // Yield buffered events first
      for (const event of eventChannel.buffer) {
        yield event as SSEEvent<T>;
      }

      // Yield new events as they arrive
      while (true) {
        if (queue.length > 0) {
          yield queue.shift()!;
        } else {
          // Wait for next event
          const event = await new Promise<SSEEvent<T>>((resolve) => {
            resolver = resolve;
          });
          yield event;
        }
      }
    } finally {
      // Clean up when generator is closed
      eventChannel.subscribers.delete(
        subscriber as (event: SSEEvent<unknown>) => void,
      );
    }
  }

  /**
   * Gets the number of active subscribers for a channel
   */
  getSubscriberCount(channel: string): number {
    const eventChannel = this.channels.get(channel);
    return eventChannel?.subscribers.size ?? 0;
  }

  /**
   * Closes all connections and cleans up resources
   */
  async cleanup(): Promise<void> {
    const channelCount = this.channels.size;
    const timerCount = this.keepAliveTimers.size;

    // Clear all keep-alive timers
    for (const timer of this.keepAliveTimers.values()) {
      clearInterval(timer);
    }
    this.keepAliveTimers.clear();

    // Clear all channels
    this.channels.clear();

    this.logger.info("SSE service cleanup completed", {
      channelsCleared: channelCount,
      timersCleared: timerCount,
    });
  }

  /**
   * Gets or creates an event channel
   */
  private getOrCreateChannel<T>(channel: string): EventChannel<T> {
    let eventChannel = this.channels.get(channel) as
      | EventChannel<T>
      | undefined;

    if (!eventChannel) {
      eventChannel = {
        subscribers: new Set(),
        buffer: [],
      };
      this.channels.set(channel, eventChannel as EventChannel<unknown>);
    }

    return eventChannel;
  }

  /**
   * Formats an SSE event as a string
   */
  private formatSSEMessage<T>(event: SSEEvent<T>): string {
    let message = "";

    // Add event ID if present
    if (event.id) {
      message += `id: ${event.id}\n`;
    }

    // Add event type if present
    if (event.event) {
      message += `event: ${event.event}\n`;
    }

    // Add retry interval if present
    if (event.retry) {
      message += `retry: ${event.retry}\n`;
    }

    // Add data (required)
    const dataStr =
      typeof event.data === "string" ? event.data : JSON.stringify(event.data);

    // Split data by newlines for proper SSE format
    const dataLines = dataStr.split("\n");
    for (const line of dataLines) {
      message += `data: ${line}\n`;
    }

    // End with double newline
    message += "\n";

    return message;
  }
}
