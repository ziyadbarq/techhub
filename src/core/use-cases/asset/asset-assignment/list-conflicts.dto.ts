/**
 * List Assignment Conflicts Use Case - DTOs
 */

import type { AssignmentSource } from "@/core/domain/entities/asset-assignment.entity";

export interface ListConflictsInput {
  assetId?: string;
  personId?: string;
  source?: AssignmentSource;
  limit?: number;
  offset?: number;
}
