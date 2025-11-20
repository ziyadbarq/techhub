/**
 * Partykit Main Server
 *
 * Entry point for Partykit WebSocket server.
 * Handles real-time bi-directional communication for collaborative features.
 *
 * This is a simple pass-through server. For more complex use cases,
 * see the specialized servers in the servers/ directory.
 */

import type * as Party from "partykit/server";

export default class MainServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  /**
   * Called when a new connection is established
   */
  async onConnect(conn: Party.Connection, _ctx: Party.ConnectionContext) {
    console.log(`[Partykit] Connection ${conn.id} joined room ${this.room.id}`);

    // Send welcome message
    conn.send(
      JSON.stringify({
        type: "system:connected",
        payload: {
          connectionId: conn.id,
          roomId: this.room.id,
          timestamp: Date.now(),
        },
      }),
    );

    // Broadcast to others that someone joined
    this.room.broadcast(
      JSON.stringify({
        type: "system:participant-joined",
        payload: {
          connectionId: conn.id,
          timestamp: Date.now(),
        },
      }),
      [conn.id], // Exclude the new connection
    );
  }

  /**
   * Called when a message is received from a connection
   */
  async onMessage(message: string | ArrayBuffer, _sender: Party.Connection) {
    // Parse message
    const messageStr = typeof message === "string" ? message : "";

    try {
      JSON.parse(messageStr); // Validate JSON
    } catch {
      console.error("[Partykit] Failed to parse message");
      return;
    }

    // Broadcast message to all connections (including sender)
    this.room.broadcast(messageStr);
  }

  /**
   * Called when a connection is closed
   */
  async onClose(conn: Party.Connection) {
    console.log(`[Partykit] Connection ${conn.id} left room ${this.room.id}`);

    // Broadcast to others that someone left
    this.room.broadcast(
      JSON.stringify({
        type: "system:participant-left",
        payload: {
          connectionId: conn.id,
          timestamp: Date.now(),
        },
      }),
    );
  }

  /**
   * Called when an error occurs
   */
  async onError(conn: Party.Connection, error: Error) {
    console.error(`[Partykit] Error on connection ${conn.id}:`, error);
  }
}

// Export server for Partykit runtime
MainServer satisfies Party.Worker;
