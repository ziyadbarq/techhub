/**
 * CUID ID Generator Service
 *
 * Implementation of IIdGenerator using CUID2 (Collision-resistant Unique IDentifier).
 *
 * CUID2 Characteristics:
 * - 24-25 characters long
 * - URL-safe (no special characters)
 * - Sortable (contains timestamp component)
 * - Collision-resistant (cryptographically strong randomness)
 * - Starts with 'c' prefix for easy identification
 *
 * This service is registered in the DI container and injected wherever
 * ID generation is needed, providing a single source of truth for ID format.
 */

import { createId } from "@paralleldrive/cuid2";
import { injectable } from "inversify";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

@injectable()
export class CuidIdGeneratorService implements IIdGenerator {
  /**
   * Generates a single CUID2 identifier
   *
   * @returns A CUID2 formatted string
   * @example
   * const id = idGenerator.generateId();
   * // Returns: "clx7abc123def456ghi789"
   */
  generateId(): string {
    return createId();
  }
}
