/**
 * Dependency Injection Container
 *
 * This file configures and exports the InversifyJS container instance.
 * The container manages dependency resolution and lifecycle of all services.
 *
 * Architecture:
 * - Follows SOLID principles, particularly Dependency Inversion Principle
 * - Uses constructor injection for explicit dependencies
 * - Supports singleton and transient scopes
 * - Enables testability through interface-based design
 *
 * Usage:
 * 1. Import getContainer() to access the configured container
 * 2. Call initContainer() once at application startup
 * 3. Use container.get(DI_TOKENS.ServiceName) to resolve dependencies
 */

// IMPORTANT: Must import reflect-metadata before any InversifyJS usage
// This enables TypeScript decorators and metadata reflection
import "reflect-metadata";
import { Container } from "inversify";
import { logger } from "@/lib/logger";

// Import module binding functions
import { bindLoggerDependencies } from "./modules/logger.module";
import { bindFileStorageDependencies } from "./modules/file-storage.module";
import { bindCodeGeneratorDependencies } from "./modules/code-generator.module";
import { bindDatabaseDependencies } from "./modules/database.module";
import { bindRBACDependencies } from "./modules/rbac.module";
import { bindSystemSetupDependencies } from "./modules/system-setup.module";
import { bindFoundationDependencies } from "./modules/foundation.module";
import { bindAssetDependencies } from "./modules/asset.module";
import { bindInventoryDependencies } from "./modules/inventory.module";
import { bindCMDBDependencies } from "./modules/cmdb.module";
import { bindContractsDependencies } from "./modules/contracts.module";
import { bindLicensesDependencies } from "./modules/licenses.module";
import { bindGovernanceDependencies } from "./modules/governance.module";
import { bindAttachmentsDependencies } from "./modules/attachments.module";
import { bindServiceDependencies } from "./modules/service.module";
import { loadDisposalModule } from "./modules/disposal.module";
import { loadAssetKitsModule } from "./modules/asset-kits.module";
import { loadReservationsModule } from "./modules/reservations.module";

/**
 * AI Services Module - Currently Disabled
 *
 * The AI services infrastructure is complete but not currently bound in the container.
 * This is intentional as the code contains presentation-specific concepts (Slidev) that
 * need to be adapted for your use case.
 *
 * To re-enable:
 * 1. Review src/infrastructure/services/ai/ for your domain requirements
 * 2. Update OpenAI integration code (remove Slidev references)
 * 3. Uncomment the import and binding below
 * 4. Uncomment the cache warming code in initContainer()
 * 5. See CLAUDE.md "Future Features" section for full documentation
 */
// import { bindAIServiceDependencies } from "./modules/ai-services.module";

import { bindUseCaseDependencies } from "./modules/use-cases.module";
import { bindCSVServiceDependencies } from "./modules/csv.module";
import { bindRealtimeDependencies } from "./modules/realtime.module";
import { bindQueueDependencies } from "./modules/queue.module";
import { bindEmailDependencies } from "./modules/email.module";
import { bindSearchDependencies } from "./modules/search.module";

/**
 * AI Service Interfaces - Uncomment when enabling AI services
 *
 * These are needed for prompt cache warming on container initialization.
 */
// import type { IAIPromptManagerService } from "@/core/services";

/**
 * Global container instance
 * Singleton pattern ensures one container per application
 */
let container: Container | null = null;

/**
 * Creates and configures the DI container
 *
 * This function initializes the container and binds all dependencies
 * via module-specific binding functions.
 *
 * @returns Configured Container instance
 */
function createContainer(): Container {
  const newContainer = new Container({
    // Strict mode options for better error detection
    defaultScope: "Singleton", // Default to singleton lifecycle
  });

  // ==========================================
  // Module Bindings
  // ==========================================

  // Bind logger dependencies (must be first for other modules to use)
  bindLoggerDependencies(newContainer);

  // Bind file storage dependencies (depends on logger)
  bindFileStorageDependencies(newContainer);

  // Bind code generator dependencies (depends on logger and database)
  bindCodeGeneratorDependencies(newContainer);

  // Bind database dependencies (repositories, Prisma client)
  bindDatabaseDependencies(newContainer);

  // Bind RBAC dependencies (role, permission, user-role management)
  bindRBACDependencies(newContainer);

  // Bind System Setup dependencies (health checks, migration status, seeding)
  bindSystemSetupDependencies(newContainer);

  // Bind Foundation dependencies (lifecycle, vendor, organization, location, person)
  bindFoundationDependencies(newContainer);

  // Bind CMDB dependencies (CIs, relationships)
  bindCMDBDependencies(newContainer);

  // Bind Contracts dependencies (contract types, contracts)
  bindContractsDependencies(newContainer);

  // Bind Licenses dependencies (license products, entitlements, allocations)
  bindLicensesDependencies(newContainer);

  // Bind Governance dependencies (data domains, ownerships, verification campaigns/items)
  bindGovernanceDependencies(newContainer);

  // Bind Attachments dependencies (attachment types, attachments)
  bindAttachmentsDependencies(newContainer);
  // Bind Service Management dependencies (services, business processes, infrastructure)
  bindServiceDependencies(newContainer);

  // Bind Asset dependencies (asset categories, asset models, assets, assignments)
  bindAssetDependencies(newContainer);

  // Bind Inventory dependencies (stock locations, stock movements)
  bindInventoryDependencies(newContainer);

  // Bind Disposal dependencies (disposal workflow, approvals, documents)
  loadDisposalModule(newContainer);

  // Bind Asset Kits dependencies (kits, kit items, checkouts)
  loadAssetKitsModule(newContainer);

  // Bind Reservations dependencies (reservations, conflicts, availability)
  loadReservationsModule(newContainer);

  // Bind Search dependencies (global search across entities)
  bindSearchDependencies(newContainer);

  /**
   * AI Services - Currently Disabled
   *
   * Uncomment the line below to enable AI services:
   * - AIDebugTraceService (debug tracing for AI operations)
   * - AIPromptManagerService (modular prompt system with 24h caching)
   * - FileStorageService (file operations for AI artifacts)
   * - OpenAI integration (content generation)
   *
   * See CLAUDE.md "Future Features" section before enabling.
   */
  // bindAIServiceDependencies(newContainer);

  // Bind use case dependencies (business logic orchestration)
  bindUseCaseDependencies(newContainer);

  // Bind CSV service dependencies
  bindCSVServiceDependencies(newContainer);

  // Bind real-time service dependencies (SSE, Partykit)
  bindRealtimeDependencies(newContainer);

  // Bind job queue dependencies (BullMQ, background jobs)
  bindQueueDependencies(newContainer);

  // Bind email service dependencies
  bindEmailDependencies(newContainer);

  return newContainer;
}

/**
 * Initializes the DI container with automatic cache warming
 *
 * Should be called once at application startup, typically in:
 * - Next.js: app/layout.tsx or a root provider
 * - Standalone: index.ts or main.ts
 *
 * Cache warming runs in the background and does not block initialization.
 *
 * @returns The initialized container instance
 *
 * @example
 * ```typescript
 * // In app/layout.tsx or root provider
 * import { initContainer } from '@/di/container';
 *
 * export default function RootLayout() {
 *   useEffect(() => {
 *     initContainer(); // Cache warming happens automatically in background
 *   }, []);
 *
 *   return <html>...</html>;
 * }
 * ```
 */
export function initContainer(): Container {
  const scopedLogger = logger.scope("DIContainer");

  if (!container) {
    container = createContainer();

    // Mark container as initialized so logger can start using DI
    // This must happen after createContainer() completes to avoid circular dependency
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { markContainerInitialized } = require("@/lib/logger");
    markContainerInitialized();

    scopedLogger.debug("initContainer", "Container initialized successfully");

    /**
     * Prompt Cache Warming - Currently Disabled
     *
     * When AI services are enabled, uncomment this block to warm the prompt cache
     * on application startup. This eliminates the first-request penalty for AI operations.
     *
     * Cache warming is fire-and-forget - it runs in the background and does not
     * block container initialization.
     */
    // const promptManager = container.get<IAIPromptManagerService>(
    //   DI_TOKENS.IAIPromptManagerService,
    // );
    // promptManager.warmCache().catch((error) => {
    //   logger.warn("Prompt cache warming failed (non-critical)", error instanceof Error ? error : new Error(String(error)));
    // });
  }
  return container;
}

/**
 * Gets the current container instance
 *
 * Lazily initializes the container if it hasn't been created yet.
 * Prefer calling initContainer() during startup, but this helper
 * guarantees callers never receive an uninitialized container.
 *
 * @returns The active container instance
 *
 * @example
 * ```typescript
 * import { getContainer } from '@/di/container';
 * import { type DI_TOKENS } from '@/di/types';
 *
 * const container = getContainer();
 * const repo = container.get<ITaskRepository>(
 *   DI_TOKENS.ITaskRepository
 * );
 * ```
 */
export function getContainer(): Container {
  if (!container) {
    return initContainer();
  }
  return container;
}

/**
 * Resets the container (useful for testing)
 *
 * WARNING: Only use this in test environments!
 * Calling this in production will break dependency resolution.
 *
 * @example
 * ```typescript
 * // In test setup
 * import { resetContainer } from '@/di/container';
 *
 * afterEach(() => {
 *   resetContainer();
 * });
 * ```
 */
export function resetContainer(): void {
  if (container) {
    // Log before unbinding (while logger still works)
    logger.scope("DIContainer").debug("resetContainer", "Container reset");

    container.unbindAll();
    container = null;

    // Reset logger's container initialization flag
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { resetLoggerState } = require("@/lib/logger");
    resetLoggerState();
  }
}

/**
 * Type-safe dependency resolution helper
 *
 * Provides better TypeScript inference when resolving dependencies
 *
 * @param token - DI token symbol
 * @returns Resolved dependency instance
 *
 * @example
 * ```typescript
 * import { resolve } from '@/di/container';
 * import { type DI_TOKENS } from '@/di/types';
 *
 * const repo = resolve<ITaskRepository>(
 *   DI_TOKENS.ITaskRepository
 * );
 * ```
 */
export function resolve<T>(token: symbol): T {
  const currentContainer = getContainer();
  return currentContainer.get<T>(token);
}

/**
 * Export container instance for direct access
 * Prefer using getContainer() for better initialization checks
 */
export { container };

/**
 * Export Container type for type annotations
 */
export type { Container };
