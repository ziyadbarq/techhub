/**
 * Logger Module - DI Bindings
 *
 * This module configures logging dependencies for the application.
 *
 * Responsibilities:
 * - Bind ILoggerService interface to PinoLoggerService implementation
 * - Configure logger as singleton (shared across entire application)
 * - Enable dependency injection of logger into other services
 *
 * Architecture:
 * - Follows Dependency Inversion Principle (depend on interface, not implementation)
 * - Logger is bound as singleton for performance and consistent configuration
 * - Implementation can be easily swapped (e.g., for testing or different environments)
 */

import type { Container } from "inversify";
import { logger } from "@/lib/logger";
import { DI_TOKENS } from "../types";
import type { ILoggerService } from "@/core/services";
import { PinoLoggerService } from "@/infrastructure/services/logger/pino-logger.service";

/**
 * Binds logger service dependencies to the container
 *
 * This function registers the logger service as a singleton,
 * ensuring all components share the same logger instance.
 *
 * @param container - InversifyJS container instance
 *
 * @example
 * ```typescript
 * import { Container } from 'inversify';
 * import { bindLoggerDependencies } from './logger.module';
 *
 * const container = new Container();
 * bindLoggerDependencies(container);
 * ```
 */
export function bindLoggerDependencies(container: Container): void {
  // ==========================================
  // Bind Logger Service
  // ==========================================

  // Bind ILoggerService to PinoLoggerService implementation
  // Singleton ensures consistent configuration and shared state
  container
    .bind<ILoggerService>(DI_TOKENS.ILoggerService)
    .to(PinoLoggerService)
    .inSingletonScope();

  // Only log during development to avoid cluttering build output
  if (process.env.NODE_ENV === "development") {
    logger.scope("DI").debug("bind", "[DI] Logger dependencies bound");
  }
}

/**
 * Implementation Notes:
 *
 * 1. Singleton Scope:
 *    - Logger is bound as singleton to ensure consistent configuration
 *    - All components share the same logger instance
 *    - Reduces overhead of creating multiple logger instances
 *
 * 2. Implementation Flexibility:
 *    - Can easily swap PinoLoggerService for a different implementation
 *    - Useful for testing (e.g., MockLoggerService)
 *    - Can configure different loggers per environment
 *
 * 3. Usage in Services:
 *    Services inject logger via constructor:
 *    ```typescript
 *    @injectable()
 *    export class MyService {
 *      constructor(
 *        @inject(DI_TOKENS.ILoggerService)
 *        private logger: ILoggerService
 *      ) {}
 *    }
 *    ```
 *
 * 4. Testing:
 *    In tests, rebind to a mock implementation:
 *    ```typescript
 *    // InversifyJS v7: rebind is async
 *    await container.rebind<ILoggerService>(DI_TOKENS.ILoggerService)
 *      .to(MockLoggerService);
 *    // Or use sync alternative:
 *    container.rebindSync<ILoggerService>(DI_TOKENS.ILoggerService)
 *      .to(MockLoggerService);
 *    ```
 */
