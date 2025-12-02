/**
 * Update Conflict Status Use Case - DTOs
 */

export interface UpdateConflictStatusInput {
  assignmentId: string;
  hasConflict: boolean;
  conflictNote?: string | null;
}
