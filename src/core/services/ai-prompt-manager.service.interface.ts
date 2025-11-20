/**
 * AI Prompt Manager Service Interface (V2 - Composition-Based)
 *
 * Manages modular prompt system with composition-based prompts.
 * Supports 24-hour extended caching for 90% cost savings.
 */

import type { PromptPurpose } from "@/generated/prisma";

/**
 * Cached composed prompt with expiration tracking
 */
export interface CachedPrompt {
  content: string;
  cachedAt: Date;
  expiresAt: Date;
  purpose: PromptPurpose;
  compositionId: string;
  version: number;
  tokensEstimate: number;
}

/**
 * Variables for prompt composition
 */
export interface PromptVariables {
  [key: string]: string;
}

/**
 * Service interface for managing AI prompts with modular composition.
 *
 * This service is responsible for:
 * - Composing prompts from modular blocks
 * - Loading and caching composed prompts
 * - Managing prompt blocks and compositions
 * - Optimizing costs through extended prompt caching
 * - Tracking cache hit rates for analytics
 */
export interface IAIPromptManagerService {
  // ========================================
  // Prompt Retrieval & Caching (Composition-Based)
  // ========================================

  /**
   * Gets a composed system prompt for the specified purpose.
   *
   * Composes blocks into final prompt and implements 24-hour caching:
   * - Cache miss: Costs $1.25/1M tokens
   * - Cache hit: Costs $0.125/1M tokens (90% savings)
   *
   * @param purpose - Purpose of prompt (OUTLINE, CONTENT, THEME, etc.)
   * @param variables - Optional variables for substitution (e.g., {THEME_NAME: "barq"})
   * @returns Composed and cached prompt content
   * @throws {Error} If no active composition found for purpose
   */
  getSystemPrompt(
    purpose: PromptPurpose,
    variables?: PromptVariables,
  ): Promise<string>;

  /**
   * Gets multiple composed prompts at once.
   *
   * @param purposes - Array of prompt purposes
   * @param variables - Optional variables for all prompts
   * @returns Map of purpose to composed prompt content
   */
  getSystemPrompts(
    purposes: PromptPurpose[],
    variables?: PromptVariables,
  ): Promise<Map<PromptPurpose, string>>;

  /**
   * Forces a cache refresh for a specific purpose.
   *
   * @param purpose - Purpose to refresh
   */
  refreshCache(purpose: PromptPurpose): Promise<void>;

  /**
   * Clears all cached prompts.
   */
  clearAllCaches(): Promise<void>;

  /**
   * Warms cache by pre-loading all prompt purposes.
   *
   * Should be called on container initialization.
   */
  warmCache(): Promise<void>;

  // ========================================
  // Block & Composition Management
  // ========================================

  /**
   * Get a single block by name (for inspection/editing)
   *
   * @param name - Block name (e.g., "slidev-mdc-syntax")
   * @returns Block content
   */
  getBlock(name: string): Promise<string>;

  /**
   * Update a block's content (invalidates all caches using this block)
   *
   * @param name - Block name
   * @param content - New content
   */
  updateBlock(name: string, content: string): Promise<void>;

  /**
   * Get composition info for a purpose
   *
   * @param purpose - Prompt purpose
   * @returns Composition with block list
   */
  getComposition(purpose: PromptPurpose): Promise<{
    id: string;
    name: string;
    blocks: Array<{ name: string; order: number }>;
    variables: PromptVariables | null;
  }>;

  // ========================================
  // Analytics & Optimization
  // ========================================

  /**
   * Gets cache statistics for cost optimization analysis.
   *
   * @returns Cache performance metrics
   */
  getCacheStats(): Promise<{
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number; // percentage
    estimatedSavings: number; // USD
  }>;

  /**
   * Estimates the cost impact of caching for a given usage pattern.
   *
   * @param dailyRequests - Expected daily request volume
   * @param avgPromptTokens - Average prompt token count
   * @returns Cost comparison with and without caching
   */
  estimateCachingImpact(
    dailyRequests: number,
    avgPromptTokens: number,
  ): {
    withoutCaching: number; // USD per day
    withCaching: number; // USD per day
    savings: number; // USD per day
    savingsPercentage: number;
  };
}
