/**
 * Partykit Real-time Service Implementation
 *
 * Client-side service for managing WebSocket connections via Partykit.
 * Provides type-safe real-time communication with connection pooling.
 *
 * Features:
 * - Connection pooling and management
 * - Automatic reconnection
 * - Type-safe message handling
 * - Room-based communication
 * - Presence tracking support
 *
 * Architecture:
 * - Implements IRealtimeService interface from core layer
 * - Injectable service for use in DI container
 * - Browser-only (uses PartySocket client library)
 *
 * Note: This is a client-side service and should only be used in browser context.
 */

import { injectable, unmanaged } from "inversify";
import PartySocket from "partysocket";
import type {
  IRealtimeService,
  RealtimeMessage,
  RoomParticipant,
  RoomInfo,
} from "@/core/services/realtime.service.interface";
import { ConnectionState } from "@/core/services/realtime.service.interface";

/**
 * Connection info
 */
interface ConnectionInfo {
  socket: PartySocket;
  roomId: string;
  participant: RoomParticipant;
  state: ConnectionState;
  subscribers: Set<(message: RealtimeMessage) => void>;
}

/**
 * Partykit Service Configuration
 */
interface PartykitConfig {
  /** Partykit host URL (default: localhost:1999 for development) */
  host?: string;
  /** Party name (default: 'main') */
  party?: string;
}

/**
 * Partykit Real-time Service
 */
@injectable()
export class PartykitService implements IRealtimeService {
  /** Map of room ID to connection info */
  private connections = new Map<string, ConnectionInfo>();

  /** Service configuration */
  private config: Required<PartykitConfig>;

  constructor(@unmanaged() config?: PartykitConfig) {
    this.config = {
      host:
        config?.host ||
        (typeof window !== "undefined"
          ? window.location.host
          : "localhost:1999"),
      party: config?.party || "main",
    };
  }

  /**
   * Connects to a room
   */
  async connect(roomId: string, participant: RoomParticipant): Promise<void> {
    // Check if already connected
    if (this.connections.has(roomId)) {
      console.warn(
        `[Partykit] Already connected to room ${roomId}, disconnecting first`,
      );
      await this.disconnect(roomId);
    }

    return new Promise((resolve, reject) => {
      try {
        // Create PartySocket connection
        const socket = new PartySocket({
          host: this.config.host,
          party: this.config.party,
          room: roomId,
        });

        // Create connection info
        const connectionInfo: ConnectionInfo = {
          socket,
          roomId,
          participant,
          state: ConnectionState.CONNECTING,
          subscribers: new Set(),
        };

        this.connections.set(roomId, connectionInfo);

        // Handle connection opened
        socket.addEventListener("open", () => {
          connectionInfo.state = ConnectionState.CONNECTED;
          console.log(`[Partykit] Connected to room ${roomId}`);

          // Send participant info
          this.sendMessage(roomId, {
            type: "presence:update",
            payload: participant,
          }).catch(console.error);

          resolve();
        });

        // Handle messages
        socket.addEventListener("message", (event) => {
          try {
            const message = JSON.parse(event.data) as RealtimeMessage;

            // Notify all subscribers
            for (const subscriber of connectionInfo.subscribers) {
              subscriber(message);
            }
          } catch (error) {
            console.error("[Partykit] Failed to parse message:", error);
          }
        });

        // Handle errors
        socket.addEventListener("error", (error) => {
          connectionInfo.state = ConnectionState.ERROR;
          console.error(`[Partykit] Error in room ${roomId}:`, error);
        });

        // Handle close
        socket.addEventListener("close", () => {
          connectionInfo.state = ConnectionState.DISCONNECTED;
          console.log(`[Partykit] Disconnected from room ${roomId}`);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (connectionInfo.state === ConnectionState.CONNECTING) {
            socket.close();
            this.connections.delete(roomId);
            reject(new Error("Connection timeout"));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnects from a room
   */
  async disconnect(roomId: string): Promise<void> {
    const connectionInfo = this.connections.get(roomId);
    if (!connectionInfo) {
      return;
    }

    // Close socket
    connectionInfo.socket.close();

    // Remove from connections
    this.connections.delete(roomId);

    console.log(`[Partykit] Disconnected from room ${roomId}`);
  }

  /**
   * Sends a message to a room
   */
  async sendMessage<T>(
    roomId: string,
    message: RealtimeMessage<T>,
  ): Promise<void> {
    const connectionInfo = this.connections.get(roomId);
    if (!connectionInfo) {
      throw new Error(`Not connected to room ${roomId}`);
    }

    if (connectionInfo.state !== ConnectionState.CONNECTED) {
      throw new Error(`Connection to room ${roomId} is not active`);
    }

    connectionInfo.socket.send(JSON.stringify(message));
  }

  /**
   * Broadcasts a message to all participants in a room
   * (Same as sendMessage for client-side - server handles broadcasting)
   */
  async broadcast<T>(
    roomId: string,
    message: RealtimeMessage<T>,
  ): Promise<void> {
    return this.sendMessage(roomId, message);
  }

  /**
   * Subscribes to messages from a room
   */
  async *subscribe<T>(roomId: string): AsyncGenerator<RealtimeMessage<T>> {
    const connectionInfo = this.connections.get(roomId);
    if (!connectionInfo) {
      throw new Error(`Not connected to room ${roomId}`);
    }

    // Create a queue for messages
    const queue: RealtimeMessage<T>[] = [];
    let resolver: ((value: RealtimeMessage<T>) => void) | null = null;

    // Subscribe to messages
    const subscriber = (message: RealtimeMessage) => {
      if (resolver) {
        resolver(message as RealtimeMessage<T>);
        resolver = null;
      } else {
        queue.push(message as RealtimeMessage<T>);
      }
    };

    connectionInfo.subscribers.add(subscriber);

    try {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift()!;
        } else {
          const message = await new Promise<RealtimeMessage<T>>((resolve) => {
            resolver = resolve;
          });
          yield message;
        }
      }
    } finally {
      // Clean up subscriber when generator is closed
      connectionInfo.subscribers.delete(subscriber);
    }
  }

  /**
   * Gets room information
   */
  async getRoomInfo(roomId: string): Promise<RoomInfo | null> {
    const connectionInfo = this.connections.get(roomId);
    if (!connectionInfo) {
      return null;
    }

    // Basic room info (could be enhanced with server-side data)
    return {
      id: roomId,
      participantCount: 1, // At least this client
      participants: [connectionInfo.participant],
    };
  }

  /**
   * Gets connection state for a room
   */
  getConnectionState(roomId: string): ConnectionState {
    const connectionInfo = this.connections.get(roomId);
    return connectionInfo?.state ?? ConnectionState.DISCONNECTED;
  }

  /**
   * Closes all connections and cleans up resources
   */
  async cleanup(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.keys()).map(
      (roomId) => this.disconnect(roomId),
    );

    await Promise.all(disconnectPromises);

    console.log("[Partykit] Cleanup completed");
  }
}
