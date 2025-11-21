/**
 * Repository Logging Utility
 *
 * Provides standardized logging for repository operations with:
 * - Structured logging for all CRUD operations
 * - Performance timing for database queries
 * - Error logging with context
 * - Consistent log format across all repositories
 */

import { logger } from "@/lib/logger";

/**
 * Creates a scoped logger for a repository
 *
 * @param repositoryName - Name of the repository (e.g., "PresentationRepository")
 * @returns Scoped logger with repository-specific context
 *
 * @example
 * ```typescript
 * export class PrismaPresentationRepository {
 *   private readonly logger = createRepositoryLogger('PresentationRepository');
 *
 *   async create(entity: PresentationEntity): Promise<PresentationEntity> {
 *     const timer = this.logger.startTimer();
 *     this.logger.debug('create', 'Creating presentation', { name: entity.name });
 *
 *     try {
 *       const created = await this.prisma.presentation.create({ ... });
 *       this.logger.timed('create', 'Presentation created successfully', timer(), {
 *         id: created.id,
 *       });
 *       return this.toDomain(created);
 *     } catch (_error) {
 *       this.logger.error('create', 'Failed to create presentation', error, {
 *         name: entity.name,
 *       });
 *       throw error;
 *     }
 *   }
 * }
 * ```
 */
export function createRepositoryLogger(repositoryName: string) {
  const scoped = logger.scope(repositoryName);

  return {
    ...scoped,
    logOperation: async <T>(
      operation: string,
      fn: () => Promise<T>,
      context?: Record<string, unknown>,
    ): Promise<T> => logRepositoryOperation(scoped, operation, fn, context),
  };
}

/**
 * Logs a repository operation with automatic timing
 *
 * @param logger - The repository logger
 * @param operation - Operation name (e.g., "create", "findById")
 * @param fn - Async function to execute and time
 * @param context - Additional context for logging
 * @returns Result of the function
 *
 * @example
 * ```typescript
 * async findById(id: string): Promise<Entity | null> {
 *   return logRepositoryOperation(
 *     this.logger,
 *     'findById',
 *     () => this.prisma.entity.findUnique({ where: { id } }),
 *     { id },
 *   );
 * }
 * ```
 */
export async function logRepositoryOperation<T>(
  repoLogger: ReturnType<typeof logger.scope>,
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>,
): Promise<T> {
  const timer = repoLogger.startTimer();

  try {
    const result = await fn();
    repoLogger.timed(operation, `Operation completed`, timer(), context);
    return result;
  } catch (error) {
    repoLogger.error(operation, `Operation failed`, error, context);
    throw error;
  }
}
