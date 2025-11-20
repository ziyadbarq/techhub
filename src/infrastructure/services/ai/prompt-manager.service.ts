/**
 * AI Prompt Manager Service Implementation (V2 - Composition-Based)
 *
 * Manages modular prompt system with block composition.
 * Implements 24-hour extended caching for 90% cost savings.
 */

import { injectable, inject } from "inversify";
import { PromptPurpose } from "@/generated/prisma";
import type {
  IAIPromptManagerService,
  CachedPrompt,
  PromptVariables,
} from "@/core/services/ai-prompt-manager.service.interface";
import type { IPromptBlockRepository } from "@/core/repositories/prompt-block.repository.interface";
import type { IPromptCompositionRepository } from "@/core/repositories/prompt-composition.repository.interface";
import { DI_TOKENS } from "@/di/types";
import { logger } from "@/lib/logger";

@injectable()
export class AIPromptManagerService implements IAIPromptManagerService {
  /**
   * Logger instance
   */
  private readonly scopedLogger = logger.scope("AIPromptManagerService");

  /**
   * Instance-level cache for composed prompts
   * Key format: "{purpose}:{JSON.stringify(variables)}"
   */
  private readonly compositionCache = new Map<string, CachedPrompt>();

  /**
   * Cache statistics for analytics
   */
  private readonly cacheStats = {
    hits: 0,
    misses: 0,
    lastReset: new Date(),
  };

  constructor(
    @inject(DI_TOKENS.IPromptBlockRepository)
    private readonly blockRepo: IPromptBlockRepository,
    @inject(DI_TOKENS.IPromptCompositionRepository)
    private readonly compositionRepo: IPromptCompositionRepository,
  ) {}

  // ========================================
  // Prompt Retrieval & Caching
  // ========================================

  async getSystemPrompt(
    purpose: PromptPurpose,
    variables?: PromptVariables,
  ): Promise<string> {
    const cacheKey = this.getCacheKey(purpose, variables);
    const cached = this.compositionCache.get(cacheKey);

    // Check if cache is valid
    if (cached && !this.isExpired(cached)) {
      this.cacheStats.hits++;
      return cached.content;
    }

    // Cache miss - compose from blocks
    this.cacheStats.misses++;
    const composed = await this.composePrompt(purpose, variables);

    // Cache for 24 hours
    const cachedPrompt: CachedPrompt = {
      content: composed.content,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      purpose,
      compositionId: composed.compositionId,
      version: composed.version,
      tokensEstimate: Math.ceil(composed.content.length / 4),
    };

    this.compositionCache.set(cacheKey, cachedPrompt);

    return composed.content;
  }

  async getSystemPrompts(
    purposes: PromptPurpose[],
    variables?: PromptVariables,
  ): Promise<Map<PromptPurpose, string>> {
    const prompts = new Map<PromptPurpose, string>();

    await Promise.all(
      purposes.map(async (purpose) => {
        const prompt = await this.getSystemPrompt(purpose, variables);
        prompts.set(purpose, prompt);
      }),
    );

    return prompts;
  }

  async refreshCache(purpose: PromptPurpose): Promise<void> {
    // Remove all cache entries for this purpose (any variables)
    for (const key of this.compositionCache.keys()) {
      if (key.startsWith(`${purpose}:`)) {
        this.compositionCache.delete(key);
      }
    }

    // Reload into cache
    await this.getSystemPrompt(purpose);
  }

  async clearAllCaches(): Promise<void> {
    this.compositionCache.clear();
    this.scopedLogger.info("clearAllCaches", "All caches cleared");
  }

  async warmCache(): Promise<void> {
    this.scopedLogger.info("warmCache", "Starting cache warming...");
    const startTime = Date.now();

    const allPurposes: PromptPurpose[] = [
      PromptPurpose.OUTLINE,
      PromptPurpose.CONTENT,
      PromptPurpose.THEME,
      PromptPurpose.REVIEW,
      PromptPurpose.REFINEMENT,
    ];

    try {
      await Promise.all(
        allPurposes.map(async (purpose) => {
          try {
            await this.getSystemPrompt(purpose);
            this.scopedLogger.debug("warmCache", `✓ Warmed ${purpose} prompt`);
          } catch (error) {
            this.scopedLogger.warn(
              "warmCache",
              `⚠ Failed to warm ${purpose} prompt: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }),
      );

      const duration = Date.now() - startTime;
      const cachedCount = this.compositionCache.size;
      this.scopedLogger.info(
        "warmCache",
        `Cache warming completed: ${cachedCount}/${allPurposes.length} prompts cached in ${duration}ms`,
      );
    } catch (error) {
      this.scopedLogger.error(
        "warmCache",
        "Cache warming failed",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  // ========================================
  // Block & Composition Management
  // ========================================

  async getBlock(name: string): Promise<string> {
    const block = await this.blockRepo.findByName(name);
    if (!block) {
      throw new Error(`Block not found: ${name}`);
    }
    return block.content;
  }

  async updateBlock(name: string, content: string): Promise<void> {
    const block = await this.blockRepo.findByName(name);
    if (!block) {
      throw new Error(`Block not found: ${name}`);
    }

    block.updateContent(content);
    await this.blockRepo.update(block.id, block);

    // Invalidate ALL caches (any composition using this block)
    this.compositionCache.clear();
    this.scopedLogger.info(
      "updatePromptBlock",
      `Block "${name}" updated, all caches invalidated`,
    );
  }

  async getComposition(purpose: PromptPurpose): Promise<{
    id: string;
    name: string;
    blocks: Array<{ name: string; order: number }>;
    variables: PromptVariables | null;
  }> {
    const composition = await this.compositionRepo.findActiveByPurpose(purpose);
    if (!composition) {
      throw new Error(`No active composition found for purpose: ${purpose}`);
    }

    const blocks = composition.getOrderedBlocks().map((b) => ({
      name: b.blockName,
      order: b.order,
    }));

    return {
      id: composition.id,
      name: composition.name,
      blocks,
      variables: composition.variables,
    };
  }

  // ========================================
  // Analytics & Optimization
  // ========================================

  async getCacheStats(): Promise<{
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    estimatedSavings: number;
  }> {
    const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate =
      totalRequests > 0 ? (this.cacheStats.hits / totalRequests) * 100 : 0;

    // Calculate cost savings
    const avgPromptTokens = 2000;
    const uncachedCost = (avgPromptTokens / 1_000_000) * 1.25;
    const cachedCost = (avgPromptTokens / 1_000_000) * 0.125;

    const savingsPerHit = uncachedCost - cachedCost;
    const estimatedSavings = this.cacheStats.hits * savingsPerHit;

    return {
      totalRequests,
      cacheHits: this.cacheStats.hits,
      cacheMisses: this.cacheStats.misses,
      hitRate,
      estimatedSavings,
    };
  }

  estimateCachingImpact(
    dailyRequests: number,
    avgPromptTokens: number,
  ): {
    withoutCaching: number;
    withCaching: number;
    savings: number;
    savingsPercentage: number;
  } {
    const uncachedCostPerRequest = (avgPromptTokens / 1_000_000) * 1.25;
    const cachedCostPerRequest = (avgPromptTokens / 1_000_000) * 0.125;

    const assumedHitRate = 0.7; // 70% cache hit rate

    const withoutCaching = dailyRequests * uncachedCostPerRequest;
    const withCaching =
      dailyRequests * assumedHitRate * cachedCostPerRequest +
      dailyRequests * (1 - assumedHitRate) * uncachedCostPerRequest;

    const savings = withoutCaching - withCaching;
    const savingsPercentage = (savings / withoutCaching) * 100;

    return {
      withoutCaching,
      withCaching,
      savings,
      savingsPercentage,
    };
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  private getCacheKey(
    purpose: PromptPurpose,
    variables?: PromptVariables,
  ): string {
    const varKey = variables ? this.serializeVariables(variables) : "{}";
    return `${purpose}:${varKey}`;
  }

  /**
   * Deterministically serialize variables for cache keys.
   * Sorts object keys alphabetically to ensure same cache key
   * regardless of property order.
   */
  private serializeVariables(variables: PromptVariables): string {
    if (!variables || Object.keys(variables).length === 0) {
      return "{}";
    }

    // Sort keys alphabetically for deterministic serialization
    const sortedKeys = Object.keys(variables).sort();
    const sortedObj: Record<string, string> = {};

    for (const key of sortedKeys) {
      sortedObj[key] = variables[key];
    }

    return JSON.stringify(sortedObj);
  }

  private isExpired(cached: CachedPrompt): boolean {
    return new Date() > cached.expiresAt;
  }

  /**
   * Compose a complete prompt from blocks
   */
  private async composePrompt(
    purpose: PromptPurpose,
    variables?: PromptVariables,
  ): Promise<{ content: string; compositionId: string; version: number }> {
    // Get active composition for this purpose
    const composition = await this.compositionRepo.findActiveByPurpose(purpose);
    if (!composition) {
      throw new Error(`No active composition found for purpose: ${purpose}`);
    }

    // Get blocks in order
    const blocks = await this.compositionRepo.getBlocksForComposition(
      composition.id,
    );

    if (blocks.length === 0) {
      throw new Error(`Composition "${composition.name}" has no blocks`);
    }

    // Merge composition variables with provided variables (provided takes precedence)
    const mergedVariables: PromptVariables = {
      ...(composition.variables || {}),
      ...(variables || {}),
    };

    // Compose blocks into single prompt
    let composedContent = "";

    for (const block of blocks) {
      composedContent += block.content + "\n\n";
    }

    // Apply variable substitution
    if (Object.keys(mergedVariables).length > 0) {
      for (const [key, value] of Object.entries(mergedVariables)) {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        composedContent = composedContent.replace(placeholder, value);
      }
    }

    // Add final output instruction
    composedContent +=
      "\nOUTPUT: Generate valid Slidev markdown that renders beautifully and communicates effectively.";

    return {
      content: composedContent.trim(),
      compositionId: composition.id,
      version: composition.version,
    };
  }
}
