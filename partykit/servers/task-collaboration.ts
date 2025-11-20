/**
 * Task Collaboration Server
 *
 * Partykit server for real-time task collaboration.
 * Handles multi-user task editing, cursor positions, and presence.
 *
 * Features:
 * - Real-time task updates broadcast to all participants
 * - Cursor position tracking
 * - Active field tracking (who's editing what)
 * - Participant presence management
 *
 * Message Types:
 * - task:update - Task data changed
 * - cursor:move - Cursor position updated
 * - field:focus - User started editing a field
 * - field:blur - User stopped editing a field
 * - presence:update - User presence data changed
 */

import type * as Party from "partykit/server";

/**
 * Participant metadata
 */
interface Participant {
  id: string;
  connectionId: string;
  name?: string;
  avatar?: string;
  color?: string;
  cursor?: { x: number; y: number };
  activeField?: string;
  lastActive: number;
}

/**
 * Task Collaboration Message
 */
interface CollaborationMessage {
  type: string;
  payload: unknown;
  senderId?: string;
  timestamp?: number;
}

/**
 * Task Collaboration Server
 */
export default class TaskCollaborationServer implements Party.Server {
  /** Map of connection ID to participant data */
  private participants = new Map<string, Participant>();

  constructor(readonly room: Party.Room) {}

  /**
   * Called when a new connection is established
   */
  async onConnect(conn: Party.Connection, _ctx: Party.ConnectionContext) {
    console.log(
      `[Task Collaboration] Connection ${conn.id} joined room ${this.room.id}`,
    );

    // Create participant
    const participant: Participant = {
      id: conn.id,
      connectionId: conn.id,
      lastActive: Date.now(),
    };

    this.participants.set(conn.id, participant);

    // Send current participants to new connection
    conn.send(
      JSON.stringify({
        type: "system:participants",
        payload: {
          participants: Array.from(this.participants.values()),
        },
        timestamp: Date.now(),
      }),
    );

    // Broadcast to others that someone joined
    this.room.broadcast(
      JSON.stringify({
        type: "system:participant-joined",
        payload: { participant },
        timestamp: Date.now(),
      }),
      [conn.id],
    );
  }

  /**
   * Called when a message is received
   */
  async onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    const messageStr = typeof message === "string" ? message : "";
    let parsedMessage: CollaborationMessage;

    try {
      parsedMessage = JSON.parse(messageStr);
    } catch {
      console.error("[Task Collaboration] Failed to parse message");
      return;
    }

    // Update participant last active time
    const participant = this.participants.get(sender.id);
    if (participant) {
      participant.lastActive = Date.now();
    }

    // Add sender ID and timestamp
    parsedMessage.senderId = sender.id;
    parsedMessage.timestamp = Date.now();

    // Handle different message types
    switch (parsedMessage.type) {
      case "presence:update":
        this.handlePresenceUpdate(sender.id, parsedMessage.payload);
        break;

      case "cursor:move":
        this.handleCursorMove(sender.id, parsedMessage.payload);
        break;

      case "field:focus":
      case "field:blur":
        this.handleFieldFocus(sender.id, parsedMessage);
        break;

      case "task:update":
        // Broadcast task updates to all participants
        this.room.broadcast(JSON.stringify(parsedMessage));
        break;

      default:
        // Broadcast unknown message types
        this.room.broadcast(JSON.stringify(parsedMessage));
    }
  }

  /**
   * Called when a connection is closed
   */
  async onClose(conn: Party.Connection) {
    console.log(
      `[Task Collaboration] Connection ${conn.id} left room ${this.room.id}`,
    );

    // Remove participant
    this.participants.delete(conn.id);

    // Broadcast to others
    this.room.broadcast(
      JSON.stringify({
        type: "system:participant-left",
        payload: { connectionId: conn.id },
        timestamp: Date.now(),
      }),
    );
  }

  /**
   * Handles presence updates
   */
  private handlePresenceUpdate(connectionId: string, payload: unknown) {
    const participant = this.participants.get(connectionId);
    if (!participant) return;

    // Update participant data
    const presenceData = payload as Partial<Participant>;
    Object.assign(participant, presenceData);

    // Broadcast presence update
    this.room.broadcast(
      JSON.stringify({
        type: "presence:updated",
        payload: { participant },
        senderId: connectionId,
        timestamp: Date.now(),
      }),
    );
  }

  /**
   * Handles cursor movement
   */
  private handleCursorMove(connectionId: string, payload: unknown) {
    const participant = this.participants.get(connectionId);
    if (!participant) return;

    const cursorData = payload as { x: number; y: number };
    participant.cursor = cursorData;

    // Broadcast cursor position (excluding sender for performance)
    this.room.broadcast(
      JSON.stringify({
        type: "cursor:moved",
        payload: {
          connectionId,
          cursor: cursorData,
        },
        senderId: connectionId,
        timestamp: Date.now(),
      }),
      [connectionId],
    );
  }

  /**
   * Handles field focus/blur events
   */
  private handleFieldFocus(
    connectionId: string,
    message: CollaborationMessage,
  ) {
    const participant = this.participants.get(connectionId);
    if (!participant) return;

    const fieldData = message.payload as { field?: string };

    if (message.type === "field:focus") {
      participant.activeField = fieldData.field;
    } else {
      participant.activeField = undefined;
    }

    // Broadcast field focus change
    this.room.broadcast(
      JSON.stringify({
        type:
          message.type === "field:focus" ? "field:focused" : "field:blurred",
        payload: {
          connectionId,
          field: fieldData.field,
        },
        senderId: connectionId,
        timestamp: Date.now(),
      }),
    );
  }

  /**
   * Called when an error occurs
   */
  async onError(conn: Party.Connection, error: Error) {
    console.error(
      `[Task Collaboration] Error on connection ${conn.id}:`,
      error,
    );
  }
}

// Export server for Partykit runtime
TaskCollaborationServer satisfies Party.Worker;
