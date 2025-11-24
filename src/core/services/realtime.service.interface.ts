/**
 * Real-time Service Interface (WebSocket/Partykit)
 *
 * Defines the contract for bi-directional real-time communication.
 * This is ideal for collaborative features, chat, and interactive experiences.
 *
 * Use Cases:
 * - Multi-user collaboration
 * - Real-time chat
 * - Cursor positions/presence
 * - Live editing
 * - Game-like interactions
 *
 * When to use Realtime vs SSE:
 * - Realtime: Bi-directional, collaborative features, complex state sync
 * - SSE: One-way, notifications, progress updates, simpler scenarios
 */

/**
 * Real-time message structure
 */
export interface RealtimeMessage<T = unknown> {
  /** Message type identifier (e.g., 'cursor:move', 'task:update') */
  type: string;
  /** Message payload */
  payload: T;
  /** Sender identifier (optional, set by server) */
  senderId?: string;
  /** Message timestamp (optional, set by server) */
  timestamp?: number;
}

/**
 * Room participant information
 */
export interface RoomParticipant {
  /** Unique participant ID */
  id: string;
  /** User metadata (name, avatar, etc.) */
  metadata?: Record<string, unknown>;
  /** When the participant joined */
  joinedAt: number;
}

/**
 * Room information
 */
export interface RoomInfo {
  /** Room ID */
  id: string;
  /** Number of participants */
  participantCount: number;
  /** List of participants (if available) */
  participants?: RoomParticipant[];
  /** Room metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Connection state
 */
export enum ConnectionState {
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  RECONNECTING = "reconnecting",
  ERROR = "error",
}

/**
 * Real-time Service Interface
 *
 * Provides methods for managing WebSocket connections, rooms, and message broadcasting.
 */
export interface IRealtimeService {
  /**
   * Connects to a room
   *
   * @param roomId - Room identifier
   * @param participant - Participant information
   * @returns Promise that resolves when connected
   *
   * @example
   * ```typescript
   * await realtimeService.connect('task-123', {
   *   id: 'user-456',
   *   metadata: { name: 'Name', avatar: '/avatar.jpg' }
   * });
   * ```
   */
  connect(roomId: string, participant: RoomParticipant): Promise<void>;

  /**
   * Disconnects from a room
   *
   * @param roomId - Room identifier
   * @returns Promise that resolves when disconnected
   */
  disconnect(roomId: string): Promise<void>;

  /**
   * Sends a message to a room
   *
   * @param roomId - Room identifier
   * @param message - Message to send
   * @returns Promise that resolves when message is sent
   *
   * @example
   * ```typescript
   * await realtimeService.sendMessage('task-123', {
   *   type: 'task:update',
   *   payload: { id: '123', status: 'completed' }
   * });
   * ```
   */
  sendMessage<T>(roomId: string, message: RealtimeMessage<T>): Promise<void>;

  /**
   * Broadcasts a message to all participants in a room
   *
   * @param roomId - Room identifier
   * @param message - Message to broadcast
   * @returns Promise that resolves when message is broadcast
   */
  broadcast<T>(roomId: string, message: RealtimeMessage<T>): Promise<void>;

  /**
   * Subscribes to messages from a room
   *
   * @param roomId - Room identifier
   * @returns Async generator yielding messages
   *
   * @example
   * ```typescript
   * const messages = realtimeService.subscribe('task-123');
   * for await (const message of messages) {
   *   console.log('Received:', message);
   * }
   * ```
   */
  subscribe<T>(roomId: string): AsyncGenerator<RealtimeMessage<T>>;

  /**
   * Gets room information
   *
   * @param roomId - Room identifier
   * @returns Room information or null if room doesn't exist
   */
  getRoomInfo(roomId: string): Promise<RoomInfo | null>;

  /**
   * Gets connection state for a room
   *
   * @param roomId - Room identifier
   * @returns Current connection state
   */
  getConnectionState(roomId: string): ConnectionState;

  /**
   * Closes all connections and cleans up resources
   */
  cleanup(): Promise<void>;
}

/**
 * Presence information for a participant
 */
export interface PresenceInfo {
  /** Participant ID */
  id: string;
  /** Current cursor position (if applicable) */
  cursor?: { x: number; y: number };
  /** Current selection/focus (if applicable) */
  selection?: string;
  /** Custom presence data */
  data?: Record<string, unknown>;
  /** Last activity timestamp */
  lastActive: number;
}

/**
 * Extended real-time service with presence tracking
 *
 * Useful for collaborative features that need to track participant state.
 */
export interface IRealtimePresenceService extends IRealtimeService {
  /**
   * Updates presence information for current participant
   *
   * @param roomId - Room identifier
   * @param presence - Presence information to update
   */
  updatePresence(
    roomId: string,
    presence: Partial<PresenceInfo>,
  ): Promise<void>;

  /**
   * Gets presence information for all participants in a room
   *
   * @param roomId - Room identifier
   * @returns Map of participant ID to presence info
   */
  getPresence(roomId: string): Promise<Map<string, PresenceInfo>>;

  /**
   * Subscribes to presence updates
   *
   * @param roomId - Room identifier
   * @returns Async generator yielding presence updates
   */
  subscribeToPresence(
    roomId: string,
  ): AsyncGenerator<Map<string, PresenceInfo>>;
}
