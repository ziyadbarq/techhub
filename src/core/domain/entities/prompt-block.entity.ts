/**
 * PromptBlock Domain Entity
 *
 * Represents an atomic, reusable prompt block that can be composed into larger prompts.
 * Follows DRY principle - update once, propagates everywhere.
 */

import type { PromptBlockCategory } from "@/generated/prisma";

export interface PromptBlockMetadata {
  /**
   * Variables that this block uses (e.g., {{THEME_NAME}})
   */
  variables?: string[];

  /**
   * Other blocks this block depends on
   */
  dependencies?: string[];

  /**
   * Tags for categorization and search
   */
  tags?: string[];

  /**
   * Examples of how to use this block
   */
  examples?: string[];
}

/**
 * Data required to create a new PromptBlockEntity
 */
export interface CreatePromptBlockData {
  name: string;
  category: PromptBlockCategory;
  content: string;
  description: string | null;
  metadata: PromptBlockMetadata | null;
  version: number;
  isActive: boolean;
  parentBlockId: string | null;
}

export class PromptBlockEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly category: PromptBlockCategory,
    public content: string,
    public description: string | null,
    public metadata: PromptBlockMetadata | null,
    public version: number,
    public isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly parentBlockId: string | null = null,
  ) {
    this.validate();
  }

  /**
   * Factory method to create a new prompt block
   */
  static create(
    name: string,
    category: PromptBlockCategory,
    content: string,
    description?: string,
    metadata?: PromptBlockMetadata,
    parentBlockId?: string,
  ): CreatePromptBlockData {
    if (!name || name.trim().length === 0) {
      throw new Error("Prompt block name cannot be empty");
    }

    if (!content || content.trim().length === 0) {
      throw new Error("Prompt block content cannot be empty");
    }

    if (content.length > 100000) {
      throw new Error("Prompt block content exceeds maximum length (100KB)");
    }

    return {
      name: name.trim(),
      category,
      content: content.trim(),
      description: description?.trim() || null,
      metadata: metadata || null,
      version: 1,
      isActive: true,
      parentBlockId: parentBlockId || null,
    };
  }

  /**
   * Update block content
   */
  updateContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error("Prompt block content cannot be empty");
    }

    if (content.length > 100000) {
      throw new Error("Prompt block content exceeds maximum length (100KB)");
    }

    this.content = content.trim();
    this.version++;
  }

  /**
   * Update block metadata
   */
  updateMetadata(metadata: PromptBlockMetadata): void {
    this.metadata = metadata;
  }

  /**
   * Activate this block
   */
  activate(): void {
    this.isActive = true;
  }

  /**
   * Deactivate this block
   */
  deactivate(): void {
    this.isActive = false;
  }

  /**
   * Check if this block has variables
   */
  hasVariables(): boolean {
    return (
      (this.metadata?.variables && this.metadata.variables.length > 0) ||
      this.content.includes("{{")
    );
  }

  /**
   * Extract variables from content
   */
  extractVariables(): string[] {
    const variableMatches = this.content.match(/\{\{([A-Z_]+)\}\}/g);
    if (!variableMatches) return [];

    return Array.from(
      new Set(
        variableMatches.map((match) => match.replace(/\{\{|\}\}/g, "").trim()),
      ),
    );
  }

  /**
   * Get block summary
   */
  getSummary(): string {
    return `${this.name} (${this.category}) - ${this.content.substring(0, 100)}...`;
  }

  /**
   * Validate entity invariants
   */
  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error("Prompt block name cannot be empty");
    }

    if (!this.content || this.content.trim().length === 0) {
      throw new Error("Prompt block content cannot be empty");
    }

    if (this.version < 1) {
      throw new Error("Prompt block version must be at least 1");
    }
  }
}
