/**
 * TypeScript types for Spring Cloud Config integration
 */

/**
 * Options for loading configuration from Spring Cloud Config Server
 */
export interface CloudConfigLoaderOptions {
  /** Config server endpoint URL (e.g., http://config-server.baraq.com:8888) */
  endpoint: string;

  /** Application name (e.g., 'techhub') */
  name: string;

  /** Spring profiles to load (e.g., ['dev'], ['prod']) */
  profiles: string[];

  /** Connection timeout in milliseconds (default: 5000) */
  timeout?: number;

  /** Number of retry attempts on failure (default: 3) */
  retries?: number;
}

/**
 * Result from loading configuration from Spring Cloud Config Server
 */
export interface CloudConfigLoaderResult {
  /** Whether config was successfully loaded from server */
  success: boolean;

  /** Flat key-value configuration object */
  config: Record<string, string>;

  /** Source of configuration */
  source: "config-server" | "local-fallback";

  /** Metadata about the config load operation */
  metadata: {
    /** Spring profile used */
    profile: string;

    /** Config server endpoint */
    endpoint: string;

    /** ISO timestamp when config was loaded */
    loadedAt: string;

    /** Number of retry attempts made */
    retryAttempts: number;

    /** Error message if load failed (only if success=false) */
    error?: string;
  };
}
