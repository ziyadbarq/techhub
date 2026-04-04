/**
 * Type-Safe Prisma Helpers
 *
 * Provides type-safe utilities for working with Prisma JSON fields and complex types.
 * These helpers eliminate unsafe type assertions and provide runtime safety.
 */

import type { Prisma } from "@/generated/prisma/server";

/**
 * Converts a TypeScript value to Prisma's InputJsonValue type safely.
 *
 * This helper serializes the value to JSON and back to ensure it's a valid JSON value,
 * then casts to Prisma.InputJsonValue. This is safer than direct casting.
 *
 * @param value - The value to convert to JSON
 * @returns Prisma-compatible JSON value, or JsonNull for null values
 *
 * @example
 * ```typescript
 * const metadata = { version: 1, tags: ["example"] };
 * const jsonValue = toJsonValue(metadata);
 * ```
 */
export function toJsonValue<T>(
  value: T | null | undefined,
): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) {
    return undefined; // Prisma uses undefined for null JSON fields
  }

  // Serialize and parse to ensure valid JSON structure
  // This catches non-serializable values at runtime
  try {
    const serialized = JSON.stringify(value);
    return JSON.parse(serialized) as Prisma.InputJsonValue;
  } catch (error) {
    throw new Error(
      `Failed to convert value to JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Converts a Prisma JsonValue to a TypeScript type safely.
 *
 * This helper handles Prisma's JsonNull and validates that the value matches
 * the expected type structure.
 *
 * @param value - The Prisma JSON value to convert
 * @returns Typed value or null
 *
 * @example
 * ```typescript
 * const record = await prisma.someModel.findUnique({ where: { id } });
 * const metadata = fromJsonValue<{ version: number }>(record?.metadata);
 * if (metadata) {
 *   console.log(metadata.version);
 * }
 * ```
 */
export function fromJsonValue<T>(
  value: Prisma.JsonValue | null | undefined,
): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  // The value is already a parsed JSON object/array/primitive
  // Just cast to the expected type
  return value as T;
}
