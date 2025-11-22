/**
 * Code Generator Service Interface
 *
 * Defines the contract for auto-generating unique codes and tags for entities.
 * This interface belongs to the Core layer and is implementation-agnostic.
 *
 * Architecture:
 * - Interface in core/services (domain layer)
 * - Implementation in infrastructure/services (e.g., CodeGeneratorService)
 * - Injected via dependency injection container
 *
 * Usage:
 * ```typescript
 * @injectable()
 * export class CreateVendorUseCase {
 *   constructor(
 *     @inject(DI_TOKENS.ICodeGeneratorService)
 *     private codeGenerator: ICodeGeneratorService
 *   ) {}
 *
 *   async execute(props: CreateVendorProps): Promise<Vendor> {
 *     const code = props.code ?? await this.codeGenerator.generateCode('VENDOR', 'VENDOR');
 *     // ... create vendor with generated code
 *   }
 * }
 * ```
 */

/**
 * Code generation options
 *
 * Configuration for code generation behavior
 */
export interface CodeGenerationOptions {
  /**
   * Number of digits for padding (default: 6)
   * Example: padding 6 produces "000001"
   */
  padding?: number;

  /**
   * Whether to include timestamp in code (default: false)
   * Example: VENDOR-20250122-000001
   */
  includeTimestamp?: boolean;

  /**
   * Custom separator (default: "-")
   */
  separator?: string;

  /**
   * Scope identifier for scoped sequences (e.g., lifecycleModelId)
   * Used for entities with composite unique constraints
   */
  scopeId?: string;
}

/**
 * Code Generator Service Interface
 *
 * Provides auto-generation of unique codes and tags for entities with support
 * for sequential numbering, timestamp-based codes, and scoped sequences.
 *
 * Features:
 * - Sequential code generation with database-backed sequences
 * - Timestamp-based codes for temporal uniqueness
 * - Scoped sequences for composite unique constraints
 * - Customizable formatting (padding, separators)
 * - Concurrent-safe code generation
 * - Code format validation
 */
export interface ICodeGeneratorService {
  /**
   * Generate a unique code for an entity
   *
   * Uses a database-backed sequence to ensure uniqueness. The sequence
   * is scoped to the entity type (or entity type + scope for composite keys).
   *
   * @param entityType - Type of entity (e.g., "VENDOR", "ASSET_KIT")
   * @param prefix - Prefix for the code (e.g., "VENDOR", "KIT")
   * @param options - Optional generation options
   * @returns Promise resolving to unique code (e.g., "VENDOR-000001")
   *
   * @example
   * ```typescript
   * // Simple sequential code
   * const code = await codeGenerator.generateCode('VENDOR', 'VENDOR');
   * // Result: "VENDOR-000001"
   *
   * // With custom padding
   * const code = await codeGenerator.generateCode('ASSET_KIT', 'KIT', { padding: 4 });
   * // Result: "KIT-0001"
   *
   * // Scoped sequence (for LifecycleState with modelId)
   * const code = await codeGenerator.generateCode(
   *   'LIFECYCLE_STATE',
   *   'STATE',
   *   { scopeId: 'model-123' }
   * );
   * // Result: "STATE-000001" (unique within model-123 scope)
   * ```
   */
  generateCode(
    entityType: string,
    prefix: string,
    options?: CodeGenerationOptions,
  ): Promise<string>;

  /**
   * Generate a timestamp-based code
   *
   * Creates a code with embedded timestamp for temporal uniqueness.
   * Useful as a fallback or for entities requiring date-based codes.
   *
   * @param prefix - Prefix for the code (e.g., "VENDOR")
   * @param options - Optional generation options
   * @returns Timestamp-based code (e.g., "VENDOR-20250122-000001")
   *
   * @example
   * ```typescript
   * const code = codeGenerator.generateTimestampCode('VENDOR');
   * // Result: "VENDOR-20250122-000001"
   *
   * // With custom separator
   * const code = codeGenerator.generateTimestampCode('KIT', { separator: '_' });
   * // Result: "KIT_20250122_000001"
   * ```
   */
  generateTimestampCode(
    prefix: string,
    options?: CodeGenerationOptions,
  ): string;

  /**
   * Validate code format
   *
   * Checks if a code matches the expected format (uppercase alphanumeric,
   * hyphens, underscores).
   *
   * @param code - Code to validate
   * @returns True if code format is valid
   *
   * @example
   * ```typescript
   * codeGenerator.validateFormat('VENDOR-000001'); // true
   * codeGenerator.validateFormat('vendor-001');    // false (lowercase)
   * codeGenerator.validateFormat('VEN 001');       // false (space)
   * ```
   */
  validateFormat(code: string): boolean;

  /**
   * Get next sequence number without incrementing
   *
   * Retrieves the next sequence number for preview/validation purposes
   * without actually incrementing the sequence.
   *
   * @param entityType - Type of entity
   * @param scopeId - Optional scope identifier
   * @returns Promise resolving to next sequence number
   *
   * @example
   * ```typescript
   * const nextNum = await codeGenerator.peekNextSequence('VENDOR');
   * // Result: 42 (if last generated was VENDOR-000041)
   * ```
   */
  peekNextSequence(entityType: string, scopeId?: string): Promise<number>;

  /**
   * Reset sequence for an entity type
   *
   * Resets the sequence counter to a specific value. Use with caution
   * as this can cause duplicate code generation if not coordinated.
   *
   * @param entityType - Type of entity
   * @param value - New sequence value (default: 0)
   * @param scopeId - Optional scope identifier
   * @returns Promise resolving when reset is complete
   *
   * @example
   * ```typescript
   * // Reset to start
   * await codeGenerator.resetSequence('VENDOR');
   *
   * // Reset to specific value
   * await codeGenerator.resetSequence('ASSET_KIT', 1000);
   * ```
   */
  resetSequence(
    entityType: string,
    value?: number,
    scopeId?: string,
  ): Promise<void>;
}
