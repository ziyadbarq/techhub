/**
 * PromptComposition Repository Interface
 *
 * Defines operations for managing prompt compositions and their block associations.
 */

import type { PromptPurpose } from "@/generated/prisma";
import type { PromptCompositionEntity } from "../domain/entities/prompt-composition.entity";
import type { PromptBlockEntity } from "../domain/entities/prompt-block.entity";

export interface IPromptCompositionRepository {
  /**
   * Create a new composition
   */
  create(
    composition: PromptCompositionEntity,
  ): Promise<PromptCompositionEntity>;

  /**
   * Find a composition by ID
   */
  findById(id: string): Promise<PromptCompositionEntity | null>;

  /**
   * Find a composition by unique name
   */
  findByName(name: string): Promise<PromptCompositionEntity | null>;

  /**
   * Find the active composition for a given purpose
   */
  findActiveByPurpose(
    purpose: PromptPurpose,
  ): Promise<PromptCompositionEntity | null>;

  /**
   * Find all compositions for a given purpose
   */
  findByPurpose(purpose: PromptPurpose): Promise<PromptCompositionEntity[]>;

  /**
   * Find all active compositions
   */
  findAllActive(): Promise<PromptCompositionEntity[]>;

  /**
   * Find all compositions (active and inactive)
   */
  findAll(): Promise<PromptCompositionEntity[]>;

  /**
   * Update an existing composition
   */
  update(
    id: string,
    updates: Partial<PromptCompositionEntity>,
  ): Promise<PromptCompositionEntity>;

  /**
   * Delete a composition
   */
  delete(id: string): Promise<void>;

  /**
   * Get blocks for a composition (in order)
   */
  getBlocksForComposition(compositionId: string): Promise<PromptBlockEntity[]>;

  /**
   * Add a block to a composition
   */
  addBlockToComposition(
    compositionId: string,
    blockId: string,
    order: number,
    overrides?: Record<string, string>,
  ): Promise<void>;

  /**
   * Remove a block from a composition
   */
  removeBlockFromComposition(
    compositionId: string,
    blockId: string,
  ): Promise<void>;

  /**
   * Reorder blocks in a composition
   */
  reorderBlocks(
    compositionId: string,
    blockOrder: Array<{ blockId: string; order: number }>,
  ): Promise<void>;

  /**
   * Check if a composition exists by name
   */
  existsByName(name: string): Promise<boolean>;

  /**
   * Get total composition count
   */
  count(): Promise<number>;
}
