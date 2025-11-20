/**
 * AI Debug Trace Service Interface
 *
 * Provides comprehensive debug tracing for AI generation operations.
 * Captures prompts, requests, responses, and errors for transparent debugging.
 *
 * Only activates when AI_DEBUG_MODE=true in environment.
 */

import type {
  DebugSession,
  OperationCategory,
  RequestTraceData,
  RetryTraceData,
} from "@/infrastructure/services/ai/debug-trace.schema";

/**
 * Service interface for AI debug tracing
 */
export interface IAIDebugTraceService {
  /**
   * Check if debug mode is enabled
   *
   * @returns True if AI_DEBUG_MODE=true
   */
  isEnabled(): boolean;

  /**
   * Start a new debug session
   *
   * @param presentationId - Presentation being generated
   * @param operation - Type of operation
   * @param context - Additional context data
   * @returns Session ID
   */
  startSession(
    presentationId: string,
    operation: OperationCategory,
    context?: Record<string, unknown>,
  ): string;

  /**
   * Log prompt sent to OpenAI
   *
   * @param category - Prompt category (e.g., "outline", "slide-1")
   * @param systemPrompt - System prompt content
   * @param userPrompt - User prompt content
   * @param cached - Whether system prompt was cached
   */
  logPrompt(
    category: string,
    systemPrompt: string,
    userPrompt: string,
    cached?: boolean,
  ): Promise<void>;

  /**
   * Log OpenAI API request parameters
   *
   * @param requestData - Request parameters
   */
  logRequest(requestData: RequestTraceData): void;

  /**
   * Log OpenAI API response
   *
   * @param category - Response category (e.g., "outline", "slide-1")
   * @param response - Full OpenAI response object
   * @param duration - API call duration in milliseconds
   */
  logResponse(
    category: string,
    response: unknown,
    duration: number,
  ): Promise<void>;

  /**
   * Log error during generation
   *
   * @param error - Error object
   * @param context - Additional error context
   */
  logError(error: Error, context?: Record<string, unknown>): void;

  /**
   * Log retry attempt
   *
   * @param retryData - Retry details
   */
  logRetry(retryData: RetryTraceData): void;

  /**
   * Log cache hit
   *
   * @param category - What was cached
   * @param tokens - Cached token count
   */
  logCacheHit(category: string, tokens?: number): void;

  /**
   * Log cache miss
   *
   * @param category - What was not cached
   */
  logCacheMiss(category: string): void;

  /**
   * End the current debug session
   *
   * @param status - Final session status
   * @param error - Error object if status is 'error'
   * @returns Complete debug session
   */
  endSession(
    status: "success" | "error" | "cancelled",
    error?: Error,
  ): Promise<DebugSession | null>;

  /**
   * Write all debug artifacts to disk
   *
   * Creates the .ai-debug/ folder structure with:
   * - session-{timestamp}.json - Complete session trace
   * - prompts/{category}-system.txt - System prompts
   * - prompts/{category}-user.txt - User prompts
   * - responses/{category}-raw.json - Raw OpenAI responses
   * - errors/{timestamp}.json - Error details (if any)
   * - timeline.json - Updated timeline
   * - metrics.json - Updated aggregated metrics
   */
  writeArtifacts(): Promise<void>;

  /**
   * Get current session trace (for inspection)
   *
   * @returns Current session or null if no active session
   */
  getCurrentSession(): DebugSession | null;

  /**
   * Clear current session without writing artifacts
   */
  clearSession(): void;
}
