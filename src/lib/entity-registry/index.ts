/**
 * Entity Registry Module
 *
 * Central registry for entities that support custom field definitions.
 * Provides metadata for UI components, validation, and future extensibility.
 *
 * @example
 * ```typescript
 * import { getCustomFieldsEnabledEntities, isValidEntityKey } from "@/lib/entity-registry";
 *
 * const entities = getCustomFieldsEnabledEntities();
 * const isValid = isValidEntityKey("Asset"); // true
 * ```
 */

export {
  // Types
  type EntityCategory,
  type EntityRegistryEntry,
  // Constants
  ENTITY_CATEGORY_LABELS,
  ENTITY_REGISTRY,
  // Helper Functions
  getCustomFieldsEnabledEntities,
  getEntityByKey,
  getEntitiesByCategory,
  isValidEntityKey,
  getValidEntityKeys,
} from "./entity-registry";
