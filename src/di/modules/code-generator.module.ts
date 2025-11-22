/**
 * Code Generator Module - DI Bindings
 *
 * This module configures code generation service dependencies for the application.
 *
 * Responsibilities:
 * - Bind ICodeGeneratorService interface to CodeGeneratorService implementation
 * - Configure service as singleton (shared across entire application)
 * - Enable dependency injection of code generator into use cases
 *
 * Architecture:
 * - Follows Dependency Inversion Principle (depend on interface, not implementation)
 * - Service is bound as singleton for consistent sequence management
 * - Implementation can be easily swapped (e.g., for testing or different strategies)
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";
import { CodeGeneratorService } from "@/infrastructure/services/code-generator/code-generator.service";

/**
 * Binds code generator service dependencies to the container
 *
 * This function registers the code generator service as a singleton,
 * ensuring all components share the same service instance for
 * consistent sequence management.
 *
 * @param container - InversifyJS container instance
 *
 * @example
 * ```typescript
 * import { Container } from 'inversify';
 * import { bindCodeGeneratorDependencies } from './code-generator.module';
 *
 * const container = new Container();
 * bindCodeGeneratorDependencies(container);
 * ```
 */
export function bindCodeGeneratorDependencies(container: Container): void {
  // ==========================================
  // Bind Code Generator Service
  // ==========================================

  // Bind ICodeGeneratorService to CodeGeneratorService implementation
  // Singleton ensures consistent sequence management and thread safety
  container
    .bind<ICodeGeneratorService>(DI_TOKENS.ICodeGeneratorService)
    .to(CodeGeneratorService)
    .inSingletonScope();

  // Only log during development to avoid cluttering build output
  if (process.env.NODE_ENV === "development") {
    console.log("[DI] Code Generator dependencies bound");
  }
}

/**
 * Implementation Notes:
 *
 * 1. Singleton Scope:
 *    - Service is bound as singleton to ensure consistent sequence management
 *    - All use cases share the same service instance
 *    - Database-backed sequences ensure thread-safe code generation
 *
 * 2. Implementation Flexibility:
 *    - Can easily swap CodeGeneratorService for a different implementation
 *    - Useful for testing (e.g., MockCodeGeneratorService)
 *    - Can configure different strategies per environment
 *
 * 3. Usage in Use Cases:
 *    Use cases inject service via constructor:
 *    ```typescript
 *    @injectable()
 *    export class CreateVendorUseCase {
 *      constructor(
 *        @inject(DI_TOKENS.ICodeGeneratorService)
 *        private codeGenerator: ICodeGeneratorService
 *      ) {}
 *
 *      async execute(props: CreateVendorProps) {
 *        const code = props.code ??
 *          await this.codeGenerator.generateCode('VENDOR', 'VENDOR');
 *        // ... create vendor with generated code
 *      }
 *    }
 *    ```
 *
 * 4. Testing:
 *    In tests, rebind to a mock implementation:
 *    ```typescript
 *    // InversifyJS v7: rebind is async
 *    await container.rebind<ICodeGeneratorService>(DI_TOKENS.ICodeGeneratorService)
 *      .to(MockCodeGeneratorService);
 *    // Or use sync alternative:
 *    container.rebindSync<ICodeGeneratorService>(DI_TOKENS.ICodeGeneratorService)
 *      .to(MockCodeGeneratorService);
 *    ```
 */
