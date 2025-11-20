/**
 * PromptBlock Repository Interface
 *
 * Defines operations for managing atomic prompt blocks.
 */

import type { PromptBlockCategory } from "@/generated/prisma";
import type { PromptBlockEntity } from "../domain/entities/prompt-block.entity";

export interface IPromptBlockRepository {
  /**
   * Create a new prompt block
   */
  create(block: PromptBlockEntity): Promise<PromptBlockEntity>;

  /**
   * Find a block by ID
   */
  findById(id: string): Promise<PromptBlockEntity | null>;

  /**
   * Find a block by unique name
   */
  findByName(name: string): Promise<PromptBlockEntity | null>;

  /**
   * Find all blocks by category
   */
  findByCategory(category: PromptBlockCategory): Promise<PromptBlockEntity[]>;

  /**
   * Find all active blocks
   */
  findAllActive(): Promise<PromptBlockEntity[]>;

  /**
   * Find all blocks (active and inactive)
   */
  findAll(): Promise<PromptBlockEntity[]>;

  /**
   * Update an existing block
   */
  update(
    id: string,
    updates: Partial<PromptBlockEntity>,
  ): Promise<PromptBlockEntity>;

  /**
   * Delete a block
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a block exists by name
   */
  existsByName(name: string): Promise<boolean>;

  /**
   * Get total block count
   */
  count(): Promise<number>;
}
