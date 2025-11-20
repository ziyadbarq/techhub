/**
 * AI Services Module - DI Bindings
 *
 * This module configures all AI-related service dependencies:
 * - AI content generator (GPT-5 powered presentation generation)
 * - AI prompt manager (extended caching for 90% cost savings)
 *
 * Responsibilities:
 * - Bind AI service interfaces to their concrete implementations
 * - Configure AI service dependencies (OpenAI client, prompt caching)
 * - Set appropriate lifecycle scopes (singleton for caching efficiency)
 *
 * Architecture:
 * - Uses GPT-5 family models for structured outputs
 * - Implements 24-hour extended prompt caching
 * - Follows Clean Architecture with interface-based design
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";

// AI service interfaces from core layer
import type { IAIContentGeneratorService } from "@/core/services/ai-content-generator.service.interface";
import type { IAIPromptManagerService } from "@/core/services/ai-prompt-manager.service.interface";
import type { IAIDebugTraceService } from "@/core/services/ai-debug-trace.service.interface";
import type { IFileStorageService } from "@/core/services/file-storage.service.interface";

// AI service implementations from infrastructure layer
import { OpenAIContentGeneratorService } from "@/infrastructure/services/ai/openai-content-generator.service";
import { AIPromptManagerService } from "@/infrastructure/services/ai/prompt-manager.service";
import { AIDebugTraceService } from "@/infrastructure/services/ai/debug-trace.service";
import { FileStorageService } from "@/infrastructure/services/file-storage";
import { logger } from "@/lib/logger";

const diLogger = logger.scope("DI");

/**
 * Binds all AI service dependencies to the container
 *
 * This function is called during container initialization to register:
 * 1. AI Content Generator - GPT-5 powered presentation generation
 * 2. AI Prompt Manager - Extended prompt caching for cost optimization
 *
 * @param container - InversifyJS container instance
 *
 * @example
 * ```typescript
 * import { Container } from 'inversify';
 * import { bindAIServiceDependencies } from './ai-services.module';
 *
 * const container = new Container();
 * bindAIServiceDependencies(container);
 * ```
 */
export function bindAIServiceDependencies(container: Container): void {
  // ==========================================
  // Bind File Storage Service
  // ==========================================

  // Bind IFileStorageService to FileStorageService
  // This service provides file system operations for debug artifacts
  // Singleton scope is appropriate as the service is stateless
  container
    .bind<IFileStorageService>(DI_TOKENS.IFileStorageService)
    .to(FileStorageService)
    .inSingletonScope();

  // ==========================================
  // Bind AI Prompt Manager Service
  // ==========================================

  // Bind IAIPromptManagerService to AIPromptManagerService
  // This service manages prompt templates and implements 24-hour extended caching
  // Singleton scope is critical for in-memory cache to work across requests
  // Cache stats: 90% cost savings on cache hits ($1.25 -> $0.125 per 1M tokens)
  container
    .bind<IAIPromptManagerService>(DI_TOKENS.IAIPromptManagerService)
    .to(AIPromptManagerService)
    .inSingletonScope();

  // ==========================================
  // Bind AI Content Generator Service
  // ==========================================

  // Bind IAIContentGeneratorService to OpenAIContentGeneratorService
  // This service handles all AI-powered presentation generation:
  // - Outline generation (gpt-5-mini: fast & cheap)
  // - Content generation (gpt-5.1: adaptive reasoning)
  // - Quality review (gpt-5: balanced)
  // - Theme recommendations and refinements
  // Singleton scope is appropriate as the service is stateless
  container
    .bind<IAIContentGeneratorService>(DI_TOKENS.IAIContentGeneratorService)
    .to(OpenAIContentGeneratorService)
    .inSingletonScope();

  // ==========================================
  // Bind AI Debug Trace Service
  // ==========================================

  // Bind IAIDebugTraceService to AIDebugTraceService
  // This service provides debug tracing for AI operations
  // Only activates when AI_DEBUG_MODE=true in environment
  // Captures prompts, requests, responses, and errors for debugging
  // Singleton scope maintains session state across calls
  container
    .bind<IAIDebugTraceService>(DI_TOKENS.IAIDebugTraceService)
    .to(AIDebugTraceService)
    .inSingletonScope();

  diLogger.debug("bindAIServiceDependencies", "AI service dependencies bound");
}

/**
 * Implementation Notes:
 *
 * 1. Cost Optimization Strategy:
 *    - Extended Prompt Caching: 24-hour retention, 90% savings
 *    - Cache hit: $0.125/1M tokens (vs $1.25/1M uncached)
 *    - Singleton scope ensures cache persistence across requests
 *    - In-memory cache with expiration tracking
 *
 * 2. Model Selection:
 *    - gpt-5-mini: Outlines, refinements ($0.25 input / $2.00 output)
 *    - gpt-5.1: Content generation with adaptive reasoning ($1.25 input / $10.00 output)
 *    - gpt-5: Quality reviews, theme recommendations ($1.25 input / $10.00 output)
 *
 * 3. Structured Outputs:
 *    - 100% schema compliance via Zod schemas
 *    - No validation/retry logic needed
 *    - Type-safe responses guaranteed by GPT-5
 *
 * 4. Service Dependencies:
 *    - OpenAIContentGeneratorService depends on AIPromptManagerService
 *    - Both services depend on PrismaClient for database access
 *    - Dependency injection handles automatic resolution
 *
 * 5. Error Handling:
 *    - Services throw domain-specific errors
 *    - OpenAI API errors are caught and transformed
 *    - Cache failures gracefully fall back to database
 *
 * 6. Testing:
 *    - Mock OpenAI client by rebinding IAIContentGeneratorService
 *    - Mock prompt manager by rebinding IAIPromptManagerService
 *    - InversifyJS v7: rebind is async
 *    - Example:
 *      await container.rebind(DI_TOKENS.IAIContentGeneratorService)
 *               .toConstantValue(mockGenerator);
 *      // Or use sync alternative:
 *      container.rebindSync(DI_TOKENS.IAIContentGeneratorService)
 *               .toConstantValue(mockGenerator);
 *
 * 7. Environment Requirements:
 *    - OPENAI_API_KEY must be set in .env
 *    - Services will fail fast on initialization if key is missing
 *
 * 8. Caching Behavior:
 *    - In-memory cache cleared on service restart
 *    - 24-hour expiration matches OpenAI's extended cache
 *    - Cache stats tracked for analytics and optimization
 *
 * 9. Performance Considerations:
 *    - Parallel generation for multiple slides
 *    - Streaming support for real-time updates (future)
 *    - Batch operations to reduce API calls
 *
 * 10. Cost Monitoring:
 *     - Track tokens used per generation job
 *     - Calculate actual costs vs estimates
 *     - Monitor cache hit rates for optimization
 *     - Store metrics in AIGenerationJob table
 */
