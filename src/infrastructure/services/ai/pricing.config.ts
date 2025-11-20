/**
 * OpenAI Pricing Configuration
 *
 * Centralized pricing information for all OpenAI models used in the application.
 * Prices are per 1M tokens.
 *
 * @see https://openai.com/api/pricing/
 * @updated 2025-01-15
 */

import type OpenAI from "openai";

/**
 * Model pricing rates (USD per 1M tokens)
 */
export const AI_MODEL_PRICING = {
  "gpt-5-mini": {
    input: 0.25,
    output: 2.0,
    cached: 0.025, // Extended caching: 90% discount
  },
  "gpt-5": {
    input: 1.25,
    output: 10.0,
    cached: 0.125, // Extended caching: 90% discount
  },
  "gpt-5.1": {
    input: 1.25,
    output: 10.0,
    cached: 0.125, // Extended caching: 90% discount
  },
} as const;

export type AIModel = keyof typeof AI_MODEL_PRICING;

/**
 * Token usage data from OpenAI API
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens?: number;
}

/**
 * Cost breakdown for an AI generation operation
 */
export interface CostBreakdown {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  cachedCost: number;
  totalCost: number;
  formattedTotalCost: string;
  cacheHitRate?: number;
}

/**
 * Convert OpenAI CompletionUsage to TokenUsage
 */
export function convertToTokenUsage(usage: OpenAI.CompletionUsage): TokenUsage {
  const cachedTokens = usage.prompt_tokens_details?.cached_tokens ?? 0;

  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
    cachedTokens,
  };
}

/**
 * Calculate actual cost from OpenAI token usage
 *
 * @param usage - Token usage from OpenAI API response
 * @param model - The AI model used
 * @returns Detailed cost breakdown
 */
export function calculateActualCost(
  usage: TokenUsage,
  model: AIModel,
): CostBreakdown {
  const pricing = AI_MODEL_PRICING[model];

  // Cached tokens use discounted rate
  const cachedTokens = usage.cachedTokens ?? 0;
  const uncachedInputTokens = usage.promptTokens - cachedTokens;

  // Calculate costs (convert from per-1M to actual)
  const inputCost = (uncachedInputTokens / 1_000_000) * pricing.input;
  const cachedCost = (cachedTokens / 1_000_000) * pricing.cached;
  const outputCost = (usage.completionTokens / 1_000_000) * pricing.output;
  const totalCost = inputCost + cachedCost + outputCost;

  // Calculate cache hit rate if caching is used
  const cacheHitRate =
    usage.promptTokens > 0
      ? (cachedTokens / usage.promptTokens) * 100
      : undefined;

  return {
    inputTokens: uncachedInputTokens,
    outputTokens: usage.completionTokens,
    cachedTokens,
    totalTokens: usage.totalTokens,
    inputCost,
    outputCost,
    cachedCost,
    totalCost,
    formattedTotalCost: `$${totalCost.toFixed(6)}`,
    cacheHitRate,
  };
}

/**
 * Format cost for display with intelligent precision
 *
 * - Zero cost: "$0.00"
 * - Micro costs (< $0.0001): "< $0.0001"
 * - Small costs (< $1): 4 decimal places (e.g., "$0.0049")
 * - Larger costs: 2 decimal places (e.g., "$12.34")
 */
export function formatCost(cost: number): string {
  if (cost === 0) return "$0.00";
  if (cost < 0.0001) return "< $0.0001";
  if (cost < 1) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

/**
 * Estimate cost before API call (for planning purposes)
 * Note: This is less accurate than calculateActualCost
 *
 * @param estimatedInputTokens - Estimated prompt tokens
 * @param estimatedOutputTokens - Estimated completion tokens
 * @param model - The AI model to use
 * @returns Estimated cost breakdown
 */
export function estimateCost(
  estimatedInputTokens: number,
  estimatedOutputTokens: number,
  model: AIModel,
): Pick<CostBreakdown, "totalCost" | "formattedTotalCost"> {
  const pricing = AI_MODEL_PRICING[model];

  const inputCost = (estimatedInputTokens / 1_000_000) * pricing.input;
  const outputCost = (estimatedOutputTokens / 1_000_000) * pricing.output;
  const totalCost = inputCost + outputCost;

  return {
    totalCost,
    formattedTotalCost: formatCost(totalCost),
  };
}
