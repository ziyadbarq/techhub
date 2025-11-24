/**
 * usePartykit Hook
 *
 * React hook for real-time WebSocket communication via Partykit.
 * Provides bi-directional messaging, presence tracking, and connection management.
 *
 * Features:
 * - Automatic connection management
 * - Type-safe messaging
 * - Participant tracking
 * - Presence updates
 * - Reconnection handling
 * - Cleanup on unmount
 *
 * @example
 * ```typescript
 * function CollaborativeTask({ taskId }: { taskId: string }) {
 *   const { send, participants, isConnected } = usePartykit({
 *     room: `task-${taskId}`,
 *     party: 'task-collaboration',
 *     participant: {
 *       id: 'user-123',
 *       name: 'Name',
 *     },
 *     onMessage: (message) => {
 *       console.log('Received:', message);
 *     },
 *   });
 *
 *   const handleUpdate = () => {
 *     send({ type: 'task:update', payload: { status: 'completed' } });
 *   };
 *
 *   return (
 *     <div>
 *       <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
 *       <div>Participants: {participants.length}</div>
 *       <button onClick={handleUpdate}>Update</button>
 *     </div>
 *   );
 * }
 * ```
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PartySocket from "partysocket";

/**
 * Participant information
 */
export interface Participant {
  id: string;
  connectionId?: string;
  name?: string;
  avatar?: string;
  metadata?: Record<string, unknown>;
  joinedAt?: number;
}

/**
 * Real-time message
 */
export interface RealtimeMessage<T = unknown> {
  type: string;
  payload: T;
  senderId?: string;
  timestamp?: number;
}

/**
 * Partykit hook options
 */
export interface UsePartykitOptions<T = unknown> {
  /** Room ID to connect to */
  room: string;
  /** Party name (server type) */
  party?: string;
  /** Partykit host (default: current window location host) */
  host?: string;
  /** Current participant information */
  participant?: Participant;
  /** Callback when a message is received */
  onMessage?: (message: RealtimeMessage<T>) => void;
  /** Callback when connection opens */
  onOpen?: () => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Callback when connection closes */
  onClose?: () => void;
  /** Callback when participants list updates */
  onParticipantsUpdate?: (participants: Participant[]) => void;
  /** Whether to auto-connect on mount (default: true) */
  autoConnect?: boolean;
}

/**
 * Partykit hook return value
 */
export interface UsePartykitReturn<T = unknown> {
  /** Send a message to the room */
  send: (message: RealtimeMessage<T>) => void;
  /** Current participants in the room */
  participants: Participant[];
  /** Whether connected to the room */
  isConnected: boolean;
  /** Current error (if any) */
  error: Error | null;
  /** Manually connect */
  connect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
  /** Update participant presence */
  updatePresence: (data: Partial<Participant>) => void;
}

/**
 * usePartykit Hook
 *
 * @param options - Hook configuration options
 * @returns Partykit connection state and methods
 */
export function usePartykit<T = unknown>(
  options: UsePartykitOptions<T>,
): UsePartykitReturn<T> {
  const {
    room,
    party = "main",
    host,
    participant,
    onMessage,
    onOpen,
    onError,
    onClose,
    onParticipantsUpdate,
    autoConnect = true,
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Refs
  const socketRef = useRef<PartySocket | null>(null);
  const isMountedRef = useRef(true);
  const participantRef = useRef(participant);

  // Update participant ref when it changes
  useEffect(() => {
    participantRef.current = participant;
  }, [participant]);

  /**
   * Sends a message to the room
   */
  const send = useCallback(
    (message: RealtimeMessage<T>) => {
      if (!socketRef.current || !isConnected) {
        console.warn("[Partykit] Cannot send message: not connected");
        return;
      }

      try {
        socketRef.current.send(JSON.stringify(message));
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error("Send failed");
        setError(errorObj);
        onError?.(errorObj);
      }
    },
    [isConnected, onError],
  );

  /**
   * Updates participant presence
   */
  const updatePresence = useCallback(
    (data: Partial<Participant>) => {
      send({
        type: "presence:update",
        payload: data,
      } as RealtimeMessage<T>);
    },
    [send],
  );

  /**
   * Connects to Partykit room
   */
  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    try {
      // Clean up existing connection
      if (socketRef.current) {
        socketRef.current.close();
      }

      // Create PartySocket
      const socket = new PartySocket({
        host:
          host ||
          (typeof window !== "undefined"
            ? window.location.host
            : "localhost:1999"),
        party,
        room,
      });

      socketRef.current = socket;

      // Connection opened
      socket.addEventListener("open", () => {
        if (!isMountedRef.current) return;

        setIsConnected(true);
        setError(null);
        onOpen?.();

        // Send initial presence if provided
        if (participantRef.current) {
          send({
            type: "presence:update",
            payload: participantRef.current,
          } as RealtimeMessage<T>);
        }
      });

      // Message received
      socket.addEventListener("message", (event) => {
        if (!isMountedRef.current) return;

        try {
          const message = JSON.parse(event.data) as RealtimeMessage<T>;
          onMessage?.(message);

          // Handle system messages
          if (message.type === "system:participants") {
            const payload = message.payload as { participants?: Participant[] };
            if (payload.participants) {
              setParticipants(payload.participants);
              onParticipantsUpdate?.(payload.participants);
            }
          } else if (message.type === "system:participant-joined") {
            const payload = message.payload as { participant?: Participant };
            if (payload.participant) {
              setParticipants((prev) => [...prev, payload.participant!]);
              onParticipantsUpdate?.([...participants, payload.participant]);
            }
          } else if (message.type === "system:participant-left") {
            const payload = message.payload as { connectionId?: string };
            if (payload.connectionId) {
              setParticipants((prev) =>
                prev.filter((p) => p.connectionId !== payload.connectionId),
              );
              onParticipantsUpdate?.(
                participants.filter(
                  (p) => p.connectionId !== payload.connectionId,
                ),
              );
            }
          } else if (message.type === "presence:updated") {
            const payload = message.payload as { participant?: Participant };
            if (payload.participant) {
              setParticipants((prev) =>
                prev.map((p) =>
                  p.id === payload.participant!.id ? payload.participant! : p,
                ),
              );
            }
          }
        } catch (err) {
          console.error("[Partykit] Failed to parse message:", err);
        }
      });

      // Error occurred
      socket.addEventListener("error", (_event) => {
        if (!isMountedRef.current) return;

        const errorObj = new Error("Partykit connection error");
        setError(errorObj);
        onError?.(errorObj);
      });

      // Connection closed
      socket.addEventListener("close", () => {
        if (!isMountedRef.current) return;

        setIsConnected(false);
        onClose?.();
      });
    } catch (err) {
      const errorObj =
        err instanceof Error ? err : new Error("Connection failed");
      setError(errorObj);
      onError?.(errorObj);
    }
  }, [
    room,
    party,
    host,
    onMessage,
    onOpen,
    onError,
    onClose,
    onParticipantsUpdate,
    send,
    participants,
  ]);

  /**
   * Disconnects from Partykit room
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setIsConnected(false);
    setParticipants([]);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      connect();
    }

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    send,
    participants,
    isConnected,
    error,
    connect,
    disconnect,
    updatePresence,
  };
}
