/**
 * Cache Performance Tracker
 *
 * Extracted from openai-content-generator.service.ts
 * Handles logging and tracking of OpenAI prompt cache performance
 */

import type OpenAI from "openai";
import { serviceLogger } from "@/lib/logger";

/**
 * Log cache performance metrics from OpenAI API response
 *
 * Tracks cache hit rates and estimates cost savings from Extended Prompt Caching
 * Cache hits provide ~90% cost savings on cached tokens
 */
export function logCachePerformance(
  functionName: string,
  usage: OpenAI.CompletionUsage | undefined,
): void {
  if (!usage?.prompt_tokens_details) return;

  const cached =
    (usage.prompt_tokens_details as { cached_tokens?: number })
      .cached_tokens || 0;
  const total = usage.prompt_tokens;

  if (cached > 0) {
    const cacheHitRate = ((cached / total) * 100).toFixed(2);
    serviceLogger.info(
      functionName,
      `🎯 Cache hit! ${cacheHitRate}% tokens cached`,
      {
        cachedTokens: cached,
        totalPromptTokens: total,
        cacheHitRate: `${cacheHitRate}%`,
        estimatedSavings: "~90% on cached tokens",
      },
    );
  }
}

/**
 * Build messages with extended prompt caching enabled
 *
 * Marks system prompt for 24-hour extended caching
 * This provides 90% cost savings on cached tokens
 */
export function buildCachedMessages(
  systemPrompt: string,
  userPrompt: string,
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return [
    {
      role: "system",
      content: systemPrompt,
      // Enable 24-hour extended caching (90% cost savings!)
      cache_control: { type: "ephemeral" },
    } as OpenAI.Chat.ChatCompletionMessageParam, // Cast entire object due to cache_control not in types
    {
      role: "user",
      content: userPrompt,
    },
  ];
}
