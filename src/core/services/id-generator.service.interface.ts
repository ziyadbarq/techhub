/**
 * ID Generator Service Interface
 *
 * Provides a centralized, DI-injectable service for generating unique identifiers.
 * This abstraction allows the application to use a consistent ID generation strategy
 * without coupling domain entities to specific implementation details.
 *
 * Implementation: Uses CUID2 format (Collision-resistant Unique IDentifier)
 * - 24-25 characters long
 * - URL-safe, sortable, collision-resistant
 * - Starts with 'c' prefix
 *
 * Usage:
 * - Inject via DI: @inject(DI_TOKENS.IIdGenerator)
 * - Pass to entity create methods: Entity.create(props, idGenerator)
 * - Mock in tests for deterministic IDs
 */
export interface IIdGenerator {
  /**
   * Generates a single unique identifier
   * @returns A CUID2 formatted string (e.g., "clx7abc123def456ghi789")
   */
  generateId(): string;
}
