/**
 * AssetAssignment Repository Interface
 * Defines data access patterns for AssetAssignment entities
 */

import type {
  AssetAssignment,
  AssigneeType,
} from "../domain/entities/asset-assignment.entity";

export interface IAssetAssignmentRepository {
  /**
   * Create a new asset assignment
   */
  create(assignment: AssetAssignment): Promise<AssetAssignment>;

  /**
   * Find assignment by ID
   */
  findById(id: string): Promise<AssetAssignment | null>;

  /**
   * Find all assignments for an asset
   */
  findByAsset(assetId: string): Promise<AssetAssignment[]>;

  /**
   * Find active assignments for an asset
   * (no end date or end date in the future)
   */
  findActiveByAsset(assetId: string): Promise<AssetAssignment[]>;

  /**
   * Find primary assignment for an asset
   */
  findPrimaryByAsset(assetId: string): Promise<AssetAssignment | null>;

  /**
   * Find all assignments for a specific assignee
   */
  findByAssignee(
    assigneeType: AssigneeType,
    assigneeId: string,
  ): Promise<AssetAssignment[]>;

  /**
   * Find active assignments for a specific assignee
   */
  findActiveByAssignee(
    assigneeType: AssigneeType,
    assigneeId: string,
  ): Promise<AssetAssignment[]>;

  /**
   * Find assignments by assignee type
   */
  findByAssigneeType(assigneeType: AssigneeType): Promise<AssetAssignment[]>;

  /**
   * Find assignments within a date range
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<AssetAssignment[]>;

  /**
   * Find all assignments (with pagination)
   */
  findAll(limit?: number, offset?: number): Promise<AssetAssignment[]>;

  /**
   * Count total assignments
   */
  count(): Promise<number>;

  /**
   * Count active assignments
   */
  countActive(): Promise<number>;

  /**
   * Update an existing assignment
   */
  update(assignment: AssetAssignment): Promise<AssetAssignment>;

  /**
   * Delete an assignment
   */
  delete(id: string): Promise<void>;

  /**
   * Check if asset has overlapping assignments
   * Used to prevent double-booking of assets
   */
  hasOverlappingAssignments(
    assetId: string,
    startDate: Date,
    endDate: Date | null,
    excludeId?: string,
  ): Promise<boolean>;

  /**
   * End all active assignments for an asset
   * Used when retiring or disposing of assets
   */
  endActiveAssignments(assetId: string, endDate?: Date): Promise<void>;

  /**
   * Set an assignment as primary
   * Automatically unsets other primary assignments for the same asset
   */
  setPrimaryAssignment(assignmentId: string): Promise<void>;
}
