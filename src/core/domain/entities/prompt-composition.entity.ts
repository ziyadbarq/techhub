/**
 * PromptComposition Domain Entity
 *
 * Represents an ordered composition of prompt blocks that form a complete system prompt.
 * Supports variable substitution and block ordering.
 */

import type { PromptPurpose } from "@/generated/prisma";

export interface CompositionBlock {
  blockId: string;
  blockName: string;
  order: number;
  overrides?: Record<string, string>; // Variable overrides for this block
}

export interface CompositionVariables {
  /**
   * Variable definitions with defaults
   * e.g., { THEME_NAME: "default", AVAILABLE_LAYOUTS: "center, two-cols" }
   */
  [key: string]: string;
}

/**
 * Data required to create a new PromptCompositionEntity
 */
export interface CreatePromptCompositionData {
  name: string;
  purpose: PromptPurpose;
  description: string | null;
  variables: CompositionVariables | null;
  version: number;
  isActive: boolean;
  blocks: CompositionBlock[];
}

export class PromptCompositionEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly purpose: PromptPurpose,
    public description: string | null,
    public variables: CompositionVariables | null,
    public version: number,
    public isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public blocks: CompositionBlock[] = [],
  ) {
    this.validate();
  }

  /**
   * Factory method to create a new composition
   */
  static create(
    name: string,
    purpose: PromptPurpose,
    description?: string,
    variables?: CompositionVariables,
  ): CreatePromptCompositionData {
    if (!name || name.trim().length === 0) {
      throw new Error("Composition name cannot be empty");
    }

    return {
      name: name.trim(),
      purpose,
      description: description?.trim() || null,
      variables: variables || null,
      version: 1,
      isActive: true,
      blocks: [],
    };
  }

  /**
   * Add a block to the composition
   */
  addBlock(
    blockId: string,
    blockName: string,
    overrides?: Record<string, string>,
  ): void {
    const order = this.blocks.length + 1;

    // Check for duplicates
    if (this.blocks.some((b) => b.blockId === blockId)) {
      throw new Error(`Block ${blockName} is already in this composition`);
    }

    this.blocks.push({
      blockId,
      blockName,
      order,
      overrides,
    });
  }

  /**
   * Remove a block from the composition
   */
  removeBlock(blockId: string): void {
    const index = this.blocks.findIndex((b) => b.blockId === blockId);
    if (index === -1) {
      throw new Error("Block not found in composition");
    }

    this.blocks.splice(index, 1);

    // Re-order remaining blocks
    this.blocks.forEach((block, idx) => {
      block.order = idx + 1;
    });
  }

  /**
   * Reorder blocks
   */
  reorderBlocks(blockOrder: string[]): void {
    if (blockOrder.length !== this.blocks.length) {
      throw new Error("Block order must include all blocks");
    }

    const newBlocks: CompositionBlock[] = [];

    blockOrder.forEach((blockId, index) => {
      const block = this.blocks.find((b) => b.blockId === blockId);
      if (!block) {
        throw new Error(`Block ${blockId} not found in composition`);
      }

      newBlocks.push({
        ...block,
        order: index + 1,
      });
    });

    this.blocks = newBlocks;
  }

  /**
   * Update composition variables
   */
  updateVariables(variables: CompositionVariables): void {
    this.variables = variables;
  }

  /**
   * Set a single variable
   */
  setVariable(key: string, value: string): void {
    if (!this.variables) {
      this.variables = {};
    }
    this.variables[key] = value;
  }

  /**
   * Get ordered blocks
   */
  getOrderedBlocks(): CompositionBlock[] {
    return [...this.blocks].sort((a, b) => a.order - b.order);
  }

  /**
   * Get block count
   */
  getBlockCount(): number {
    return this.blocks.length;
  }

  /**
   * Check if composition is empty
   */
  isEmpty(): boolean {
    return this.blocks.length === 0;
  }

  /**
   * Activate this composition
   */
  activate(): void {
    this.isActive = true;
  }

  /**
   * Deactivate this composition
   */
  deactivate(): void {
    this.isActive = false;
  }

  /**
   * Get composition summary
   */
  getSummary(): string {
    return `${this.name} (${this.purpose}) - ${this.blocks.length} blocks`;
  }

  /**
   * Validate entity invariants
   */
  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error("Composition name cannot be empty");
    }

    if (this.version < 1) {
      throw new Error("Composition version must be at least 1");
    }

    // Validate block ordering is sequential
    const orders = this.blocks.map((b) => b.order).sort((a, b) => a - b);
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        throw new Error("Block ordering must be sequential starting from 1");
      }
    }
  }
}
