/**
 * Presence Server
 *
 * Lightweight Partykit server for tracking user presence.
 * Ideal for showing "who's online" indicators.
 *
 * Features:
 * - Participant join/leave tracking
 * - Heartbeat-based presence
 * - Automatic cleanup of stale connections
 * - Minimal message overhead
 */

import type * as Party from "partykit/server";

/**
 * Presence data
 */
interface PresenceData {
  id: string;
  name?: string;
  avatar?: string;
  metadata?: Record<string, unknown>;
  joinedAt: number;
  lastSeen: number;
}

/**
 * Presence Server
 */
export default class PresenceServer implements Party.Server {
  /** Map of connection ID to presence data */
  private presence = new Map<string, PresenceData>();

  /** Cleanup interval for stale connections */
  private cleanupInterval?: NodeJS.Timeout;

  /** Timeout duration for considering a connection stale (30 seconds) */
  private readonly STALE_TIMEOUT = 30000;

  constructor(readonly room: Party.Room) {
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleConnections();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Called when a new connection is established
   */
  async onConnect(conn: Party.Connection, _ctx: Party.ConnectionContext) {
    console.log(`[Presence] Connection ${conn.id} joined room ${this.room.id}`);

    // Create presence data
    const presenceData: PresenceData = {
      id: conn.id,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
    };

    this.presence.set(conn.id, presenceData);

    // Send current presence list to new connection
    conn.send(
      JSON.stringify({
        type: "presence:list",
        payload: {
          participants: Array.from(this.presence.values()),
        },
        timestamp: Date.now(),
      }),
    );

    // Broadcast presence update to others
    this.broadcastPresenceList([conn.id]);
  }

  /**
   * Called when a message is received
   */
  async onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    const messageStr = typeof message === "string" ? message : "";
    let parsedMessage: { type: string; payload?: unknown };

    try {
      parsedMessage = JSON.parse(messageStr);
    } catch {
      console.error("[Presence] Failed to parse message");
      return;
    }

    // Update last seen time
    const presenceData = this.presence.get(sender.id);
    if (presenceData) {
      presenceData.lastSeen = Date.now();
    }

    // Handle different message types
    switch (parsedMessage.type) {
      case "presence:update":
        this.handlePresenceUpdate(sender.id, parsedMessage.payload);
        break;

      case "presence:heartbeat":
        // Just update lastSeen (already done above)
        break;

      default:
        console.warn(`[Presence] Unknown message type: ${parsedMessage.type}`);
    }
  }

  /**
   * Called when a connection is closed
   */
  async onClose(conn: Party.Connection) {
    console.log(`[Presence] Connection ${conn.id} left room ${this.room.id}`);

    // Remove presence data
    this.presence.delete(conn.id);

    // Broadcast updated presence list
    this.broadcastPresenceList();
  }

  /**
   * Handles presence update
   */
  private handlePresenceUpdate(connectionId: string, payload: unknown) {
    const presenceData = this.presence.get(connectionId);
    if (!presenceData) return;

    // Update presence data
    const updateData = payload as Partial<PresenceData>;
    Object.assign(presenceData, updateData);

    // Broadcast updated presence list
    this.broadcastPresenceList();
  }

  /**
   * Broadcasts current presence list to all connections
   */
  private broadcastPresenceList(excludeIds: string[] = []) {
    this.room.broadcast(
      JSON.stringify({
        type: "presence:list",
        payload: {
          participants: Array.from(this.presence.values()),
        },
        timestamp: Date.now(),
      }),
      excludeIds,
    );
  }

  /**
   * Cleans up stale connections
   */
  private cleanupStaleConnections() {
    const now = Date.now();
    let removed = 0;

    for (const [id, data] of this.presence.entries()) {
      if (now - data.lastSeen > this.STALE_TIMEOUT) {
        this.presence.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[Presence] Cleaned up ${removed} stale connections`);
      this.broadcastPresenceList();
    }
  }

  /**
   * Called when an error occurs
   */
  async onError(conn: Party.Connection, error: Error) {
    console.error(`[Presence] Error on connection ${conn.id}:`, error);
  }

  /**
   * Called when the server is shutting down
   */
  async onShutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Export server for Partykit runtime
PresenceServer satisfies Party.Worker;
