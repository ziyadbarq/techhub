/**
 * Database Module - DI Bindings
 *
 * This module configures all database-related dependencies:
 * - PrismaClient (database connection)
 * - Repository implementations (data access layer)
 *
 * Responsibilities:
 * - Bind Prisma client as singleton (one connection pool)
 * - Bind repository interfaces to their concrete implementations
 * - Inject PrismaClient into repositories that need database access
 *
 * Architecture:
 * - Follows Repository Pattern for data access abstraction
 * - Ensures single database connection pool via singleton scope
 * - Enables easy mocking for testing by binding to interfaces
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import type { PrismaClient } from "@/generated/prisma/client";
import { logger } from "@/lib/logger";
import { prisma as singletonPrisma } from "@/infrastructure/database/prisma/client";
// NOTE: Middleware imports commented out - Prisma 5+ deprecated middleware API
// import {
//   createLoggingMiddleware,
//   createProductionLoggingMiddleware,
// } from "@/infrastructure/database/prisma/logging-middleware";

// Repository interfaces from core layer
import type { IPromptBlockRepository } from "../../core/repositories/prompt-block.repository.interface";
import type { IPromptCompositionRepository } from "../../core/repositories/prompt-composition.repository.interface";
import type { ITaskRepository } from "../../core/repositories/task.repository.interface";

// Repository implementations from infrastructure layer
import { PrismaPromptBlockRepository } from "../../infrastructure/repositories/prisma-prompt-block.repository";
import { PrismaPromptCompositionRepository } from "../../infrastructure/repositories/prisma-prompt-composition.repository";
import { PrismaTaskRepository } from "../../infrastructure/repositories/prisma-task.repository";

/**
 * Binds all database-related dependencies to the container
 *
 * This function is called during container initialization to register:
 * 1. PrismaClient - Database connection (singleton)
 * 2. Repository implementations - Data access layer (singleton)
 *
 * @param container - InversifyJS container instance
 *
 * @example
 * ```typescript
 * import { Container } from 'inversify';
 * import { bindDatabaseDependencies } from './database.module';
 *
 * const container = new Container();
 * bindDatabaseDependencies(container);
 * ```
 */
export function bindDatabaseDependencies(container: Container): void {
  const scopedLogger = logger.scope("DatabaseModule");

  // ==========================================
  // Bind PrismaClient
  // ==========================================

  // Bind PrismaClient as singleton
  // IMPORTANT: Uses the singleton from client.ts to ensure single connection pool
  // This prevents connection exhaustion and improves performance
  container
    .bind<PrismaClient>(DI_TOKENS.PrismaClient)
    .toDynamicValue(() => {
      // Connect to database on initialization
      singletonPrisma.$connect().catch((error) => {
        scopedLogger.error(
          "bindDatabaseDependencies",
          "Failed to connect to database. Connection will be retried on first query.",
          error instanceof Error ? error : new Error(String(error)),
        );
      });

      return singletonPrisma;
    })
    .inSingletonScope()
    .onDeactivation((prisma) => {
      // Clean up connection when container is destroyed
      return prisma.$disconnect();
    });

  // ==========================================
  // Bind Repository Implementations
  // ==========================================

  // Bind IPromptBlockRepository to PrismaPromptBlockRepository
  // Manages atomic prompt blocks for AI system
  container
    .bind<IPromptBlockRepository>(DI_TOKENS.IPromptBlockRepository)
    .to(PrismaPromptBlockRepository)
    .inSingletonScope();

  // Bind IPromptCompositionRepository to PrismaPromptCompositionRepository
  // Manages prompt compositions for AI system
  container
    .bind<IPromptCompositionRepository>(DI_TOKENS.IPromptCompositionRepository)
    .to(PrismaPromptCompositionRepository)
    .inSingletonScope();

  // Bind ITaskRepository to PrismaTaskRepository
  // Example CRUD repository demonstrating the architecture
  container
    .bind<ITaskRepository>(DI_TOKENS.ITaskRepository)
    .to(PrismaTaskRepository)
    .inSingletonScope();

  scopedLogger.debug("bindDatabaseDependencies", "Database dependencies bound");
}

/**
 * Implementation Notes:
 *
 * 1. Singleton vs Transient Scope:
 *    - PrismaClient: MUST be singleton (one connection pool)
 *    - Repositories: Singleton recommended (stateless, shared connection)
 *    - Use .inTransientScope() only for stateful services
 *
 * 2. Repository Constructor Pattern:
 *    All repository implementations should:
 *    - Be decorated with @injectable()
 *    - Inject PrismaClient via constructor with @inject decorator
 *    - Implement the corresponding interface from core layer
 *
 * 3. Connection Management:
 *    - PrismaClient connects lazily on first query
 *    - Use onDeactivation to ensure clean disconnect
 *    - Consider connection pooling limits in production
 *
 * 4. Testing:
 *    - In tests, rebind repositories to mock implementations
 *    - InversifyJS v7: Use `await container.rebind()` or `container.rebindSync()` to replace bindings
 *    - Reset container between tests using resetContainer()
 *
 * 5. Error Handling:
 *    - Let Prisma errors bubble up to repositories
 *    - Repositories should transform Prisma errors to domain errors
 *    - Log connection errors during initialization
 */
