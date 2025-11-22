/**
 * Search DTOs
 * Zod schemas for validating search inputs and outputs
 */

import { z } from "zod";

/**
 * Search request validation schema
 */
export const SearchRequestSchema = z.object({
  query: z
    .string()
    .min(2, "Search query must be at least 2 characters")
    .max(200, "Search query must be 200 characters or less"),
  entityTypes: z
    .array(
      z.enum([
        "asset",
        "person",
        "vendor",
        "configuration-item",
        "contract",
        "license-product",
        "asset-category",
        "asset-model",
        "location",
        "stock-location",
      ]),
    )
    .optional(),
  limit: z.number().int().min(1).max(50).optional().default(5),
});

export type SearchRequestDTO = z.infer<typeof SearchRequestSchema>;

/**
 * Individual search result schema
 */
export const SearchResultSchema = z.object({
  id: z.string(),
  entityType: z.enum([
    "asset",
    "person",
    "vendor",
    "configuration-item",
    "contract",
    "license-product",
    "asset-category",
    "asset-model",
    "location",
    "stock-location",
  ]),
  title: z.string(),
  subtitle: z.string().nullable(),
  metadata: z.record(z.string(), z.string()).nullable(),
  url: z.string(),
});

export type SearchResultDTO = z.infer<typeof SearchResultSchema>;

/**
 * Search response schema
 */
export const SearchResponseSchema = z.object({
  results: z.array(SearchResultSchema),
  totalCount: z.number().int().min(0),
});

export type SearchResponseDTO = z.infer<typeof SearchResponseSchema>;
