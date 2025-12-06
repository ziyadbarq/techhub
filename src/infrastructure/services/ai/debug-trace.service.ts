/**
 * AI Debug Trace Service Implementation
 *
 * Captures comprehensive debug information for AI generation operations.
 * Writes detailed artifacts to `.ai-debug/` folder when enabled.
 */

import { injectable, inject } from "inversify";
import type {
  IAIDebugTraceService,
  IFileStorageService,
  IIdGenerator,
} from "@/core/services";
import { DI_TOKENS } from "@/di/types";
import type {
  DebugSession,
  OperationCategory,
  TraceEvent,
  RequestTraceData,
  RetryTraceData,
  DebugTimeline,
  AggregatedMetrics,
} from "./debug-trace.schema";
import { env } from "@/infrastructure/config/env";
import { logger } from "@/lib/logger";

@injectable()
export class AIDebugTraceService implements IAIDebugTraceService {
  /**
   * Logger instance - using direct DI logger for simpler API
   */
  private readonly logger = (() => {
    const baseLogger = logger.scope("AIDebugTraceService");
    // Wrap to support both single and multi-param calls
    return {
      debug: (msg: string, data?: Record<string, unknown>) =>
        baseLogger.debug("trace", msg, data || {}),
      info: (msg: string, data?: Record<string, unknown>) =>
        baseLogger.info("trace", msg, data || {}),
      warn: (msg: string, data?: Record<string, unknown>) =>
        baseLogger.warn("trace", msg, data || {}),
      error: (
        msg: string,
        err?: Error | unknown,
        data?: Record<string, unknown>,
      ) => baseLogger.error("trace", msg, err, data || {}),
    };
  })();

  /**
   * Whether debug mode is enabled (from environment)
   */
  private readonly debugEnabled: boolean;

  /**
   * Current active session
   */
  private currentSession: DebugSession | null = null;

  /**
   * Prompts to save (category -> {system, user})
   */
  private readonly prompts = new Map<
    string,
    { system: string; user: string; cached?: boolean }
  >();

  /**
   * Responses to save (category -> response object)
   */
  private readonly responses = new Map<string, unknown>();

  /**
   * Errors encountered
   */
  private readonly errors: Array<{
    timestamp: string;
    error: Error;
    context?: Record<string, unknown>;
  }> = [];

  constructor(
    @inject(DI_TOKENS.IFileStorageService)
    private readonly fileStorage: IFileStorageService,
    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {
    // Check environment variable
    this.debugEnabled = env.AI_DEBUG_MODE ?? false;

    if (this.debugEnabled) {
      this.logger.info("Debug mode ENABLED - artifacts will be saved");
    }
  }

  // ========================================
  // Public API
  // ========================================

  isEnabled(): boolean {
    return this.debugEnabled;
  }

  startSession(
    presentationId: string,
    operation: OperationCategory,
    context?: Record<string, unknown>,
  ): string {
    if (!this.debugEnabled) {
      return "";
    }

    // Generate session ID
    const sessionId = this.idGenerator.generateId();
    const now = new Date().toISOString();

    // Initialize session
    this.currentSession = {
      sessionId,
      presentationId,
      operation,
      startTime: now,
      endTime: now, // Will be updated on endSession
      duration: 0,
      status: "success",
      trace: [],
      metrics: {
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        cachedTokens: 0,
        totalCost: 0,
        cacheHitRate: 0,
        apiCalls: 0,
        retries: 0,
        avgResponseTime: 0,
      },
      context,
    };

    // Clear temporary storage
    this.prompts.clear();
    this.responses.clear();
    this.errors.length = 0;

    this.logger.info(
      `Started session ${sessionId} for ${operation} on presentation ${presentationId}`,
    );

    return sessionId;
  }

  async logPrompt(
    category: string,
    systemPrompt: string,
    userPrompt: string,
    cached?: boolean,
  ): Promise<void> {
    if (!this.debugEnabled || !this.currentSession) {
      return;
    }

    // Store prompts for later writing
    this.prompts.set(category, {
      system: systemPrompt,
      user: userPrompt,
      cached,
    });

    // Add trace event
    const event: TraceEvent = {
      timestamp: new Date().toISOString(),
      type: "prompt",
      category,
      data: {
        systemPromptPath: `prompts/${category}-system.txt`,
        userPromptPath: `prompts/${category}-user.txt`,
        systemPromptTokens: this.estimateTokens(systemPrompt),
        userPromptTokens: this.estimateTokens(userPrompt),
        cached: cached ?? false,
      },
    };

    this.currentSession.trace.push(event);

    this.logger.debug(
      `Logged prompt for ${category} (system: ${systemPrompt.length} chars, user: ${userPrompt.length} chars, cached: ${cached ?? false})`,
    );
  }

  logRequest(requestData: RequestTraceData): void {
    if (!this.debugEnabled || !this.currentSession) {
      return;
    }

    const event: TraceEvent = {
      timestamp: new Date().toISOString(),
      type: "request",
      category: "openai",
      data: requestData,
    };

    this.currentSession.trace.push(event);
    this.currentSession.metrics.apiCalls++;

    this.logger.debug(
      `Logged request (model: ${requestData.model}, temperature: ${requestData.temperature})`,
    );
  }

  async logResponse(
    category: string,
    response: unknown,
    duration: number,
  ): Promise<void> {
    if (!this.debugEnabled || !this.currentSession) {
      return;
    }

    // Store response for later writing
    this.responses.set(category, response);

    // Extract usage data
    const rawUsage =
      response &&
      typeof response === "object" &&
      "usage" in response &&
      response.usage &&
      typeof response.usage === "object"
        ? response.usage
        : {};
    const usage = rawUsage as {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
      prompt_tokens_details?: { cached_tokens?: number };
    };
    const cachedTokens = usage.prompt_tokens_details?.cached_tokens ?? 0;

    // Update metrics
    this.currentSession.metrics.promptTokens += usage.prompt_tokens || 0;
    this.currentSession.metrics.completionTokens +=
      usage.completion_tokens || 0;
    this.currentSession.metrics.cachedTokens += cachedTokens;
    this.currentSession.metrics.totalTokens += usage.total_tokens || 0;

    // Add trace event
    const event: TraceEvent = {
      timestamp: new Date().toISOString(),
      type: "response",
      category,
      data: {
        responsePath: `responses/${category}-raw.json`,
        usage: {
          prompt_tokens: usage.prompt_tokens || 0,
          completion_tokens: usage.completion_tokens || 0,
          total_tokens: usage.total_tokens || 0,
          cached_tokens: cachedTokens,
        },
        duration,
        finish_reason:
          response &&
          typeof response === "object" &&
          "choices" in response &&
          Array.isArray(response.choices) &&
          response.choices[0] &&
          typeof response.choices[0] === "object" &&
          "finish_reason" in response.choices[0]
            ? (response.choices[0] as { finish_reason?: string }).finish_reason
            : undefined,
        id:
          response && typeof response === "object" && "id" in response
            ? String((response as { id?: unknown }).id)
            : undefined,
      },
      duration,
    };

    this.currentSession.trace.push(event);

    this.logger.debug(
      `Logged response for ${category} (${usage.total_tokens || 0} tokens, ${duration}ms)`,
    );
  }

  logError(error: Error, context?: Record<string, unknown>): void {
    if (!this.debugEnabled || !this.currentSession) {
      return;
    }

    // Store error for later writing
    this.errors.push({
      timestamp: new Date().toISOString(),
      error,
      context,
    });

    // Add trace event
    const event: TraceEvent = {
      timestamp: new Date().toISOString(),
      type: "error",
      category: "generation",
      data: {
        message: error.message,
        code: (error as { code?: string }).code || "UNKNOWN",
        retryable: (error as { retryable?: boolean }).retryable || false,
        statusCode: (error as { statusCode?: number }).statusCode,
        stack: error.stack,
        metadata: context,
      },
    };

    this.currentSession.trace.push(event);

    this.logger.error(`Logged error: ${error.message}`, error);
  }

  logRetry(retryData: RetryTraceData): void {
    if (!this.debugEnabled || !this.currentSession) {
      return;
    }

    this.currentSession.metrics.retries++;

    const event: TraceEvent = {
      timestamp: new Date().toISOString(),
      type: "retry",
      category: "retry-logic",
      data: retryData as unknown as Record<string, unknown>,
    };

    this.currentSession.trace.push(event);

    this.logger.warn(
      `Logged retry attempt ${retryData.attempt}/${retryData.maxRetries} (delay: ${retryData.delayMs}ms)`,
    );
  }

  logCacheHit(category: string, tokens?: number): void {
    if (!this.debugEnabled || !this.currentSession) {
      return;
    }

    const event: TraceEvent = {
      timestamp: new Date().toISOString(),
      type: "cache_hit",
      category,
      data: {
        tokens: tokens ?? 0,
      },
    };

    this.currentSession.trace.push(event);

    this.logger.debug(
      `Cache hit for ${category}${tokens ? ` (${tokens} tokens)` : ""}`,
    );
  }

  logCacheMiss(category: string): void {
    if (!this.debugEnabled || !this.currentSession) {
      return;
    }

    const event: TraceEvent = {
      timestamp: new Date().toISOString(),
      type: "cache_miss",
      category,
      data: {},
    };

    this.currentSession.trace.push(event);

    this.logger.debug(`Cache miss for ${category}`);
  }

  async endSession(
    status: "success" | "error" | "cancelled",
    error?: Error,
  ): Promise<DebugSession | null> {
    if (!this.debugEnabled || !this.currentSession) {
      return null;
    }

    const now = new Date().toISOString();
    const startTime = new Date(this.currentSession.startTime).getTime();
    const endTime = new Date(now).getTime();
    const duration = endTime - startTime;

    // Update session
    this.currentSession.endTime = now;
    this.currentSession.duration = duration;
    this.currentSession.status = status;

    // Calculate average response time
    const responseTimes = this.currentSession.trace
      .filter((e) => e.type === "response" && e.duration)
      .map((e) => e.duration!);
    this.currentSession.metrics.avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0;

    // Calculate cache hit rate
    if (this.currentSession.metrics.promptTokens > 0) {
      this.currentSession.metrics.cacheHitRate =
        (this.currentSession.metrics.cachedTokens /
          this.currentSession.metrics.promptTokens) *
        100;
    }

    // Add error if provided
    if (error) {
      this.currentSession.error = {
        message: error.message,
        code: (error as { code?: string }).code || "UNKNOWN",
        stack: error.stack,
      };
    }

    this.logger.info(
      `Ended session ${this.currentSession.sessionId} (status: ${status}, duration: ${duration}ms, cost: $${this.currentSession.metrics.totalCost.toFixed(6)})`,
    );

    const session = { ...this.currentSession };
    return session;
  }

  async writeArtifacts(): Promise<void> {
    if (!this.debugEnabled || !this.currentSession) {
      return;
    }

    const { presentationId, sessionId } = this.currentSession;

    try {
      // Create .ai-debug directory structure
      await this.ensureDebugDirectoryExists();

      // 1. Write prompts
      await this.writePrompts(presentationId);

      // 2. Write responses
      await this.writeResponses(presentationId);

      // 3. Write errors (if any)
      await this.writeErrors(presentationId);

      // 4. Write session trace
      await this.writeSessionTrace(presentationId);

      // 5. Update timeline
      await this.updateTimeline(presentationId);

      // 6. Update aggregated metrics
      await this.updateMetrics(presentationId);

      this.logger.info(
        `Wrote all artifacts for session ${sessionId} to .ai-debug/`,
      );
    } catch (error) {
      this.logger.error("Failed to write artifacts:", error as Error);
      // Don't throw - debug artifacts are non-critical
    }
  }

  getCurrentSession(): DebugSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  clearSession(): void {
    this.currentSession = null;
    this.prompts.clear();
    this.responses.clear();
    this.errors.length = 0;
    this.logger.info("Cleared session");
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Ensure .ai-debug directory exists
   */
  private async ensureDebugDirectoryExists(): Promise<void> {
    // FileStorageService doesn't expose mkdir, so we'll rely on write operations
    // creating parent directories automatically. If needed, we can extend the service.
    // For now, this is a no-op placeholder.
  }

  /**
   * Write prompt files
   */
  private async writePrompts(_presentationId: string): Promise<void> {
    for (const [category, { system, user }] of this.prompts.entries()) {
      // Write system prompt
      const systemPath = `.ai-debug/prompts/${category}-system.txt`;
      await this.fileStorage.writeFile(systemPath, system);

      // Write user prompt
      const userPath = `.ai-debug/prompts/${category}-user.txt`;
      await this.fileStorage.writeFile(userPath, user);
    }

    this.logger.debug(`Wrote ${this.prompts.size} prompt pairs`);
  }

  /**
   * Write response files
   */
  private async writeResponses(_presentationId: string): Promise<void> {
    for (const [category, response] of this.responses.entries()) {
      const path = `.ai-debug/responses/${category}-raw.json`;
      const content = JSON.stringify(response, null, 2);
      await this.fileStorage.writeFile(path, content);
    }

    this.logger.debug(`Wrote ${this.responses.size} response files`);
  }

  /**
   * Write error files
   */
  private async writeErrors(_presentationId: string): Promise<void> {
    if (this.errors.length === 0) {
      return;
    }

    for (const { timestamp, error, context } of this.errors) {
      const filename = `error-${timestamp.replace(/[:.]/g, "-")}.json`;
      const path = `.ai-debug/errors/${filename}`;
      const content = JSON.stringify(
        {
          timestamp,
          message: error.message,
          code: (error as { code?: string }).code,
          stack: error.stack,
          context,
        },
        null,
        2,
      );
      await this.fileStorage.writeFile(path, content);
    }

    this.logger.debug(`Wrote ${this.errors.length} error files`);
  }

  /**
   * Write session trace file
   */
  private async writeSessionTrace(_presentationId: string): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    const timestamp = this.currentSession.startTime
      .replace(/[:.]/g, "-")
      .replace("T", "-")
      .substring(0, 19);
    const filename = `session-${timestamp}.json`;
    const path = `.ai-debug/${filename}`;
    const content = JSON.stringify(this.currentSession, null, 2);

    await this.fileStorage.writeFile(path, content);

    this.logger.debug(`Wrote session trace: ${filename}`);
  }

  /**
   * Update timeline.json
   */
  private async updateTimeline(presentationId: string): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    const path = `.ai-debug/timeline.json`;

    // Try to read existing timeline
    let timeline: DebugTimeline;
    try {
      const existing = await this.fileStorage.readFile(path);
      timeline = JSON.parse(existing);
    } catch {
      // Create new timeline
      timeline = {
        presentationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sessions: [],
      };
    }

    // Add current session
    timeline.sessions.push({
      sessionId: this.currentSession.sessionId,
      operation: this.currentSession.operation,
      startTime: this.currentSession.startTime,
      duration: this.currentSession.duration,
      status: this.currentSession.status,
      cost: this.currentSession.metrics.totalCost,
    });

    timeline.updatedAt = new Date().toISOString();

    // Write timeline
    const content = JSON.stringify(timeline, null, 2);
    await this.fileStorage.writeFile(path, content);

    this.logger.debug(
      `Updated timeline (${timeline.sessions.length} sessions)`,
    );
  }

  /**
   * Update aggregated metrics.json
   */
  private async updateMetrics(presentationId: string): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    const path = `.ai-debug/metrics.json`;

    // Try to read existing metrics
    let metrics: AggregatedMetrics;
    try {
      const existing = await this.fileStorage.readFile(path);
      metrics = JSON.parse(existing);
    } catch {
      // Create new metrics
      metrics = {
        presentationId,
        totalSessions: 0,
        totalDuration: 0,
        totalCost: 0,
        totalTokens: 0,
        totalApiCalls: 0,
        totalRetries: 0,
        cacheHitRate: 0,
        avgCostPerSession: 0,
        avgDurationPerSession: 0,
        byOperation: {} as Partial<AggregatedMetrics["byOperation"]>,
      } as AggregatedMetrics;
    }

    // Update aggregates
    metrics.totalSessions++;
    metrics.totalDuration += this.currentSession.duration;
    metrics.totalCost += this.currentSession.metrics.totalCost;
    metrics.totalTokens += this.currentSession.metrics.totalTokens;
    metrics.totalApiCalls += this.currentSession.metrics.apiCalls;
    metrics.totalRetries += this.currentSession.metrics.retries;

    // Calculate averages
    metrics.avgCostPerSession = metrics.totalCost / metrics.totalSessions;
    metrics.avgDurationPerSession =
      metrics.totalDuration / metrics.totalSessions;

    // Calculate overall cache hit rate
    // Note: This is a simple weighted average, could be more sophisticated
    const currentWeight = this.currentSession.metrics.totalTokens;
    const totalWeight = metrics.totalTokens;
    if (totalWeight > 0) {
      metrics.cacheHitRate =
        (metrics.cacheHitRate * (totalWeight - currentWeight) +
          this.currentSession.metrics.cacheHitRate * currentWeight) /
        totalWeight;
    }

    // Update by-operation metrics
    const op = this.currentSession.operation;
    if (!metrics.byOperation[op]) {
      metrics.byOperation[op] = {
        count: 0,
        totalCost: 0,
        totalTokens: 0,
        avgDuration: 0,
      };
    }

    const opMetrics = metrics.byOperation[op];
    const previousCount = opMetrics.count;
    opMetrics.count++;
    opMetrics.totalCost += this.currentSession.metrics.totalCost;
    opMetrics.totalTokens += this.currentSession.metrics.totalTokens;
    opMetrics.avgDuration =
      (opMetrics.avgDuration * previousCount + this.currentSession.duration) /
      opMetrics.count;

    // Write metrics
    const content = JSON.stringify(metrics, null, 2);
    await this.fileStorage.writeFile(path, content);

    this.logger.debug(
      `Updated metrics (total sessions: ${metrics.totalSessions}, total cost: $${metrics.totalCost.toFixed(6)})`,
    );
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
