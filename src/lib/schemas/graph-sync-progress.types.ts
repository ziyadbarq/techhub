/**
 * Microsoft Graph Sync Progress Types
 *
 * Defines callback interfaces for progress reporting during
 * user synchronization from Microsoft Graph.
 */

/**
 * Sync phases for progress tracking
 */
export type GraphSyncPhase =
  | "initializing"
  | "fetching-users"
  | "syncing-users"
  | "linking-managers"
  | "deactivating-removed"
  | "complete";

/**
 * Progress data passed to the callback
 */
export interface GraphSyncProgress {
  /** Current sync phase */
  phase: GraphSyncPhase;

  /** Human-readable phase description */
  phaseLabel: string;

  /** Current item index within phase (1-based for display, 0 for phase start) */
  currentIndex: number;

  /** Total items in current phase */
  totalItems: number;

  /** Running totals */
  stats: {
    created: number;
    updated: number;
    excluded: number;
    deactivated: number;
    errors: number;
  };

  /** Elapsed time in milliseconds */
  elapsedMs: number;
}

/**
 * Progress callback function type
 */
export type GraphSyncProgressCallback = (progress: GraphSyncProgress) => void;
