/**
 * Dependency Injection - Public API
 *
 * This barrel file exports the public API of the DI system.
 * Import from this file instead of individual modules.
 *
 * @example
 * ```typescript
 * // Good - Import from index
 * import { getContainer, DI_TOKENS } from '@/di';
 *
 * // Avoid - Import from individual files
 * import { getContainer } from '@/di/container';
 * import { DI_TOKENS } from '@/di/types';
 * ```
 */

// Export container functions and types
export {
  initContainer,
  getContainer,
  resetContainer,
  resolve,
  container,
  type Container,
} from "./container";

// Export DI tokens
export { DI_TOKENS, type DITokens, type TokenType } from "./types";

// Export module binding functions (for advanced usage)
export { bindDatabaseDependencies } from "./modules/database.module";
export { bindUseCaseDependencies } from "./modules/use-cases.module";
export { bindLoggerDependencies } from "./modules/logger.module";
export { bindCSVServiceDependencies } from "./modules/csv.module";
export { bindQueueDependencies } from "./modules/queue.module";
export { bindRealtimeDependencies } from "./modules/realtime.module";
export { bindEmailDependencies } from "./modules/email.module";
