/**
 * Sync Asset Assignment From Intune Device Use Case DTOs
 *
 * Input/Output types for automatically synchronizing asset assignments
 * based on Intune device links (asset + person)
 */

import type { AssignmentSource } from "@/core/domain/entities/asset-assignment.entity";

export interface SyncAssetAssignmentFromIntuneDeviceInput {
  /**
   * Intune device ID to sync assignment from
   */
  deviceId: string;

  /**
   * Source of the sync operation
   * - INTUNE_SYNC: Triggered by daily automated sync
   * - INTUNE_MANUAL: Triggered by manual device linking action
   */
  source: Extract<AssignmentSource, "INTUNE_SYNC" | "INTUNE_MANUAL">;
}

export interface SyncAssetAssignmentFromIntuneDeviceOutput {
  /**
   * Action taken by the sync operation
   * - created: New assignment created
   * - updated: Existing assignment updated (person/asset changed)
   * - ended: Assignment ended (incomplete links)
   * - skipped: Device missing asset or person link
   * - conflict_detected: Assignment created but conflict with manual assignment
   * - no_change: Assignment already up-to-date
   */
  action:
    | "created"
    | "updated"
    | "ended"
    | "skipped"
    | "conflict_detected"
    | "no_change";

  /**
   * ID of the assignment that was created/updated
   * null if action was skipped or ended
   */
  assignmentId?: string | null;

  /**
   * Conflict details if conflict was detected
   */
  conflictDetails?: {
    intunePersonId: string;
    intunePersonName: string;
    manualPersonId: string;
    manualPersonName: string;
  } | null;

  /**
   * Human-readable message about the action taken
   */
  message: string;
}
