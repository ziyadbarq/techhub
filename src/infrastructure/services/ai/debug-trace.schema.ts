/**
 * AI Debug Trace Schema
 *
 * Type definitions for debug tracing artifacts.
 * Used to capture and serialize OpenAI interactions for debugging.
 */

/**
 * Type of trace event
 */
export type TraceEventType =
  | "prompt" // System and user prompts sent to OpenAI
  | "request" // OpenAI API request parameters
  | "response" // OpenAI API response
  | "error" // Error occurred during generation
  | "retry" // Retry attempt
  | "cache_hit" // Cache hit on prompt
  | "cache_miss"; // Cache miss on prompt

/**
 * AI operation category
 */
export type OperationCategory =
  | "generateOutline"
  | "generateOutlineVariations"
  | "generateSlideContent"
  | "generateMultipleSlides"
  | "refineSlideContent"
  | "generateSlideVariations"
  | "recommendTheme"
  | "reviewQuality";

/**
 * Single trace event in the debug timeline
 */
export interface TraceEvent {
  /** ISO timestamp of the event */
  timestamp: string;

  /** Type of event */
  type: TraceEventType;

  /** Category or operation name */
  category: string;

  /** Event data (varies by type) */
  data: Record<string, unknown>;

  /** Duration in milliseconds (if applicable) */
  duration?: number;
}

/**
 * Prompt trace data
 */
export interface PromptTraceData {
  /** Path to system prompt file */
  systemPromptPath: string;

  /** Path to user prompt file */
  userPromptPath: string;

  /** Estimated system prompt tokens */
  systemPromptTokens?: number;

  /** Estimated user prompt tokens */
  userPromptTokens?: number;

  /** Whether system prompt was cached */
  cached?: boolean;
}

/**
 * Request trace data
 */
export interface RequestTraceData {
  /** OpenAI model used */
  model: string;

  /** Temperature parameter */
  temperature?: number;

  /** Max tokens limit */
  max_tokens?: number | null;

  /** Response format type */
  response_format?: string;

  /** Additional request parameters */
  [key: string]: unknown;
}

/**
 * Response trace data
 */
export interface ResponseTraceData {
  /** Path to raw response JSON file */
  responsePath: string;

  /** Token usage details */
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cached_tokens?: number;
  };

  /** API call duration in milliseconds */
  duration: number;

  /** Finish reason */
  finish_reason?: string;

  /** Response ID */
  id?: string;
}

/**
 * Error trace data
 */
export interface ErrorTraceData {
  /** Error message */
  message: string;

  /** Error code */
  code: string;

  /** Whether error is retryable */
  retryable: boolean;

  /** HTTP status code (if applicable) */
  statusCode?: number;

  /** Full error stack trace */
  stack?: string;

  /** Additional error metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Retry trace data
 */
export interface RetryTraceData {
  /** Retry attempt number (1-indexed) */
  attempt: number;

  /** Delay before retry in milliseconds */
  delayMs: number;

  /** Error that triggered retry */
  error: {
    message: string;
    code: string;
  };

  /** Max retries configured */
  maxRetries: number;
}

/**
 * Aggregated session metrics
 */
export interface SessionMetrics {
  /** Total tokens used */
  totalTokens: number;

  /** Prompt tokens */
  promptTokens: number;

  /** Completion tokens */
  completionTokens: number;

  /** Cached tokens */
  cachedTokens: number;

  /** Total cost in USD */
  totalCost: number;

  /** Cache hit rate percentage */
  cacheHitRate: number;

  /** Number of API calls made */
  apiCalls: number;

  /** Number of retries performed */
  retries: number;

  /** Average response time in milliseconds */
  avgResponseTime: number;
}

/**
 * Complete debug session trace
 */
export interface DebugSession {
  /** Unique session ID */
  sessionId: string;

  /** Presentation ID */
  presentationId: string;

  /** Operation type */
  operation: OperationCategory;

  /** Session start time (ISO) */
  startTime: string;

  /** Session end time (ISO) */
  endTime: string;

  /** Total session duration in milliseconds */
  duration: number;

  /** Session status */
  status: "success" | "error" | "cancelled";

  /** Ordered list of trace events */
  trace: TraceEvent[];

  /** Aggregated metrics */
  metrics: SessionMetrics;

  /** Error details (if status === 'error') */
  error?: {
    message: string;
    code: string;
    stack?: string;
  };

  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Timeline of all sessions for a presentation
 */
export interface DebugTimeline {
  /** Presentation ID */
  presentationId: string;

  /** Created timestamp */
  createdAt: string;

  /** Last updated timestamp */
  updatedAt: string;

  /** All debug sessions */
  sessions: Array<{
    sessionId: string;
    operation: OperationCategory;
    startTime: string;
    duration: number;
    status: "success" | "error" | "cancelled";
    cost: number;
  }>;
}

/**
 * Aggregated metrics across all sessions
 */
export interface AggregatedMetrics {
  /** Presentation ID */
  presentationId: string;

  /** Total number of sessions */
  totalSessions: number;

  /** Total duration across all sessions (ms) */
  totalDuration: number;

  /** Total cost in USD */
  totalCost: number;

  /** Total tokens used */
  totalTokens: number;

  /** Total API calls */
  totalApiCalls: number;

  /** Total retries */
  totalRetries: number;

  /** Overall cache hit rate */
  cacheHitRate: number;

  /** Average cost per session */
  avgCostPerSession: number;

  /** Average duration per session (ms) */
  avgDurationPerSession: number;

  /** Breakdown by operation type */
  byOperation: Record<
    OperationCategory,
    {
      count: number;
      totalCost: number;
      totalTokens: number;
      avgDuration: number;
    }
  >;
}
