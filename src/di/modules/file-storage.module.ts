/**
 * File Storage Module - DI Bindings
 *
 * This module configures file storage dependencies for the application.
 *
 * Responsibilities:
 * - Bind IFileStorageService interface to LocalFileStorageService implementation
 * - Configure file storage as singleton (shared across entire application)
 * - Enable dependency injection of file storage into other services
 *
 * Architecture:
 * - Follows Dependency Inversion Principle (depend on interface, not implementation)
 * - File storage is bound as singleton for performance and consistent configuration
 * - Implementation can be easily swapped (e.g., for S3, Azure Blob, etc.)
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import type { IFileStorageService } from "@/core/services/file-storage.service.interface";
import { LocalFileStorageService } from "@/infrastructure/services/local-file-storage.service";

/**
 * Binds file storage service dependencies to the container
 *
 * This function registers the file storage service as a singleton,
 * ensuring all components share the same service instance.
 *
 * @param container - InversifyJS container instance
 *
 * @example
 * ```typescript
 * import { Container } from 'inversify';
 * import { bindFileStorageDependencies } from './file-storage.module';
 *
 * const container = new Container();
 * bindFileStorageDependencies(container);
 * ```
 */
export function bindFileStorageDependencies(container: Container): void {
  // ==========================================
  // Bind File Storage Service
  // ==========================================

  // Bind IFileStorageService to LocalFileStorageService implementation
  // Singleton ensures consistent storage operations and shared state
  container
    .bind<IFileStorageService>(DI_TOKENS.IFileStorageService)
    .to(LocalFileStorageService)
    .inSingletonScope();

  // Only log during development to avoid cluttering build output
  if (process.env.NODE_ENV === "development") {
    console.log("[DI] File Storage dependencies bound");
  }
}

/**
 * Implementation Notes:
 *
 * 1. Singleton Scope:
 *    - File storage is bound as singleton to ensure consistent operations
 *    - All components share the same service instance
 *    - Reduces overhead of creating multiple service instances
 *
 * 2. Implementation Flexibility:
 *    - Can easily swap LocalFileStorageService for a cloud storage implementation
 *    - Useful for different environments (local dev, staging with S3, production with Azure)
 *    - Can configure different storage backends per environment
 *
 * 3. Storage Strategy:
 *    - Local: Files stored in /public/uploads/{year}/{month}/{cuid}.{ext}
 *    - Cloud alternatives: S3FileStorageService, AzureBlobStorageService, etc.
 *    - Interface remains the same regardless of implementation
 *
 * 4. Usage in Services and Use Cases:
 *    Services inject file storage via constructor:
 *    ```typescript
 *    @injectable()
 *    export class CreateAttachmentUseCase {
 *      constructor(
 *        @inject(DI_TOKENS.IFileStorageService)
 *        private fileStorage: IFileStorageService,
 *        @inject(DI_TOKENS.ILoggerService)
 *        private logger: ILoggerService
 *      ) {}
 *
 *      async execute(file: Buffer, fileName: string, mimeType: string) {
 *        const storagePath = await this.fileStorage.uploadFile(file, fileName, mimeType);
 *        // Store storagePath in database
 *      }
 *    }
 *    ```
 *
 * 5. Testing:
 *    In tests, rebind to a mock implementation:
 *    ```typescript
 *    // InversifyJS v7: rebind is async
 *    await container.rebind<IFileStorageService>(DI_TOKENS.IFileStorageService)
 *      .to(MockFileStorageService);
 *    // Or use sync alternative:
 *    container.rebindSync<IFileStorageService>(DI_TOKENS.IFileStorageService)
 *      .to(MockFileStorageService);
 *    ```
 *
 * 6. Environment Configuration:
 *    - Local: LocalFileStorageService (default)
 *    - Staging/Production: S3FileStorageService or AzureBlobStorageService
 *    - Can be configured via environment variables
 *
 * 7. Security Considerations:
 *    - Path traversal protection built into LocalFileStorageService
 *    - Validates all paths stay within uploads directory
 *    - CUID ensures collision-free unique file names
 *    - File extension validation prevents malicious files
 *
 * 8. Scalability:
 *    - Local storage suitable for development and small deployments
 *    - For production at scale, swap to cloud storage (S3, Azure Blob)
 *    - Same interface, zero code changes in consuming services
 */
