/**
 * useSSE Hook
 *
 * React hook for consuming Server-Sent Events (SSE) endpoints.
 * Provides automatic connection management, reconnection, and cleanup.
 *
 * Features:
 * - Automatic reconnection on connection loss
 * - Type-safe event handling
 * - Connection state tracking
 * - Error handling
 * - Cleanup on unmount
 *
 * @example
 * ```typescript
 * function TaskList() {
 *   const { data, error, isConnected } = useSSE<Task>('/api/sse/task-updates', {
 *     onMessage: (task) => {
 *       console.log('Received task:', task);
 *     },
 *     reconnectInterval: 3000,
 *   });
 *
 *   return (
 *     <div>
 *       <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
 *       {data && <div>Latest: {JSON.stringify(data)}</div>}
 *       {error && <div>Error: {error.message}</div>}
 *     </div>
 *   );
 * }
 * ```
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * SSE hook options
 */
export interface UseSSEOptions<T> {
  /** Callback when a message is received */
  onMessage?: (data: T, event: MessageEvent) => void;
  /** Callback when connection opens */
  onOpen?: () => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Callback when connection closes */
  onClose?: () => void;
  /** Reconnection interval in milliseconds (default: 3000) */
  reconnectInterval?: number;
  /** Maximum reconnection attempts (default: Infinity) */
  maxReconnectAttempts?: number;
  /** Event type to listen for (default: 'message') */
  eventType?: string;
  /** Whether to auto-connect on mount (default: true) */
  autoConnect?: boolean;
}

/**
 * SSE hook return value
 */
export interface UseSSEReturn<T> {
  /** Latest data received */
  data: T | null;
  /** Current error (if any) */
  error: Error | null;
  /** Whether connected to SSE endpoint */
  isConnected: boolean;
  /** Whether currently attempting to reconnect */
  isReconnecting: boolean;
  /** Number of reconnection attempts made */
  reconnectAttempts: number;
  /** Manually reconnect */
  reconnect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
}

/**
 * useSSE Hook
 *
 * @param url - SSE endpoint URL
 * @param options - Hook configuration options
 * @returns SSE connection state and data
 */
export function useSSE<T = unknown>(
  url: string,
  options: UseSSEOptions<T> = {},
): UseSSEReturn<T> {
  const {
    onMessage,
    onOpen,
    onError,
    onClose,
    reconnectInterval = 3000,
    maxReconnectAttempts = Infinity,
    eventType = "message",
    autoConnect = true,
  } = options;

  // State
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Connects to SSE endpoint
   */
  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    try {
      // Clean up existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create new EventSource
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // Connection opened
      eventSource.onopen = () => {
        if (!isMountedRef.current) return;

        setIsConnected(true);
        setIsReconnecting(false);
        setError(null);
        setReconnectAttempts(0);
        onOpen?.();
      };

      // Message received
      eventSource.addEventListener(eventType, (event: MessageEvent) => {
        if (!isMountedRef.current) return;

        try {
          const parsedData = JSON.parse(event.data) as T;
          setData(parsedData);
          onMessage?.(parsedData, event);
        } catch (err) {
          console.error("[SSE] Failed to parse message:", err);
          const parseError = new Error("Failed to parse SSE message");
          setError(parseError);
          onError?.(parseError);
        }
      });

      // Error occurred
      eventSource.onerror = (_event) => {
        if (!isMountedRef.current) return;

        setIsConnected(false);

        const errorObj = new Error("SSE connection error");
        setError(errorObj);
        onError?.(errorObj);

        // Attempt reconnection if within limits
        if (reconnectAttempts < maxReconnectAttempts) {
          setIsReconnecting(true);
          setReconnectAttempts((prev) => prev + 1);

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              console.log(
                `[SSE] Reconnecting (attempt ${reconnectAttempts + 1})...`,
              );
              // eslint-disable-next-line react-hooks/immutability
              connect();
            }
          }, reconnectInterval);
        } else {
          console.error("[SSE] Max reconnection attempts reached");
          setIsReconnecting(false);
        }
      };
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error("Unknown error");
      setError(errorObj);
      onError?.(errorObj);
    }
  }, [
    url,
    eventType,
    reconnectInterval,
    maxReconnectAttempts,
    reconnectAttempts,
    onMessage,
    onOpen,
    onError,
  ]);

  /**
   * Disconnects from SSE endpoint
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    setIsReconnecting(false);
    onClose?.();
  }, [onClose]);

  /**
   * Manually triggers reconnection
   */
  const reconnect = useCallback(() => {
    disconnect();
    setReconnectAttempts(0);
    connect();
  }, [connect, disconnect]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    data,
    error,
    isConnected,
    isReconnecting,
    reconnectAttempts,
    reconnect,
    disconnect,
  };
}
