/**
 * Lookup Resolver with Fuzzy Matching
 *
 * Handles resolution of reference fields (codes, names) to database IDs.
 * Provides fuzzy matching for typos and variations.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  EntityFieldConfig,
  LookupMap,
  FuzzyMatchResult,
} from "./entity-config.types";

/**
 * Lookup resolution strategy
 */
export type LookupStrategy = "exact" | "fuzzy" | "create" | "fail";

/**
 * Main lookup resolver class
 */
export class LookupResolver {
  /**
   * Normalize lookup keys (trim, uppercase, replace spaces with underscores, strip invalid chars)
   */
  private normalizeLookupKey(value: string): string {
    return value
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/[^A-Z0-9_-]/g, "");
  }

  /**
   * Build lookup map from database records
   */
  buildLookupMap(
    targetEntity: string,
    lookupField: string,
    displayField: string,
    records: Array<Record<string, any>>,
  ): LookupMap {
    const entries = new Map<string, string>();
    const reverseEntries = new Map<string, string>();
    const allValues: string[] = [];

    for (const record of records) {
      const lookupValue = String(record[lookupField]);
      const id = String(record.id);

      entries.set(lookupValue, id);
      reverseEntries.set(id, lookupValue);
      allValues.push(lookupValue);
    }

    return {
      targetEntity,
      lookupField,
      displayField,
      entries,
      reverseEntries,
      allValues,
    };
  }

  /**
   * Resolve a single lookup value to ID
   */
  resolve(
    value: string,
    lookupMap: LookupMap,
    strategy: LookupStrategy = "exact",
  ): string | null {
    const normalizedValue = this.normalizeLookupKey(value);

    // Try normalized match (matches the way lookup maps are built)
    const normalizedMatch = lookupMap.entries.get(normalizedValue);
    if (normalizedMatch) {
      return normalizedMatch;
    }

    // Try exact match first
    const exactMatch = lookupMap.entries.get(value);
    if (exactMatch) {
      return exactMatch;
    }

    // Try case-insensitive exact match
    const caseInsensitiveMatch = this.findCaseInsensitiveMatch(
      value,
      lookupMap,
    );
    if (caseInsensitiveMatch) {
      return caseInsensitiveMatch;
    }

    // If exact strategy or no fuzzy matches found, return null
    if (strategy === "exact" || strategy === "fail") {
      return null;
    }

    // Try fuzzy matching
    if (strategy === "fuzzy") {
      const fuzzyMatch = this.findFuzzyMatch(value, lookupMap);
      if (fuzzyMatch && fuzzyMatch.confidence !== "none") {
        // Only return high confidence matches for automatic resolution
        if (fuzzyMatch.confidence === "high") {
          return lookupMap.entries.get(fuzzyMatch.closestMatch!) || null;
        }
      }
    }

    return null;
  }

  /**
   * Resolve multiple lookup values in batch
   */
  resolveBatch(
    values: string[],
    lookupMap: LookupMap,
    strategy: LookupStrategy = "exact",
  ): Map<string, string | null> {
    const results = new Map<string, string | null>();

    for (const value of values) {
      results.set(value, this.resolve(value, lookupMap, strategy));
    }

    return results;
  }

  /**
   * Find case-insensitive match
   */
  private findCaseInsensitiveMatch(
    value: string,
    lookupMap: LookupMap,
  ): string | null {
    const lowerValue = value.toLowerCase();

    for (const [key, id] of lookupMap.entries) {
      if (key.toLowerCase() === lowerValue) {
        return id;
      }
    }

    return null;
  }

  /**
   * Find fuzzy match using Levenshtein distance
   */
  findFuzzyMatch(value: string, lookupMap: LookupMap): FuzzyMatchResult {
    if (lookupMap.allValues.length === 0) {
      return {
        input: value,
        closestMatch: null,
        similarity: 0,
        confidence: "none",
        suggestions: [],
      };
    }

    // Calculate distances for all values
    const distances = lookupMap.allValues.map((candidate) => ({
      value: candidate,
      distance: this.levenshteinDistance(
        value.toLowerCase(),
        candidate.toLowerCase(),
      ),
      similarity: this.calculateSimilarity(value, candidate),
    }));

    // Sort by similarity (highest first)
    distances.sort((a, b) => b.similarity - a.similarity);

    // Get top suggestions
    const suggestions = distances
      .slice(0, 5)
      .filter((d) => d.similarity > 50)
      .map((d) => ({
        value: d.value,
        similarity: d.similarity,
      }));

    const closestMatch = distances[0];

    return {
      input: value,
      closestMatch: closestMatch.value,
      similarity: closestMatch.similarity,
      confidence: this.getConfidenceLevel(closestMatch.similarity),
      suggestions,
    };
  }

  /**
   * Calculate similarity percentage between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(
      str1.toLowerCase(),
      str2.toLowerCase(),
    );
    const maxLength = Math.max(str1.length, str2.length);

    if (maxLength === 0) return 100;

    return Math.round(((maxLength - distance) / maxLength) * 100);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    // Initialize first column and row
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get confidence level based on similarity percentage
   */
  private getConfidenceLevel(
    similarity: number,
  ): "high" | "medium" | "low" | "none" {
    if (similarity >= 85) return "high";
    if (similarity >= 70) return "medium";
    if (similarity >= 50) return "low";
    return "none";
  }

  /**
   * Get all unresolved values from a dataset
   */
  getUnresolvedValues(
    rows: Array<Record<string, any>>,
    field: EntityFieldConfig,
    lookupMap: LookupMap,
  ): Set<string> {
    const unresolved = new Set<string>();

    for (const row of rows) {
      const value = row[field.name];
      if (value && !lookupMap.entries.has(String(value))) {
        unresolved.add(String(value));
      }
    }

    return unresolved;
  }

  /**
   * Get suggestions for unresolved values
   */
  getSuggestionsForUnresolved(
    unresolvedValues: Set<string>,
    lookupMap: LookupMap,
  ): Map<string, FuzzyMatchResult> {
    const suggestions = new Map<string, FuzzyMatchResult>();

    for (const value of unresolvedValues) {
      const fuzzyMatch = this.findFuzzyMatch(value, lookupMap);
      if (fuzzyMatch.confidence !== "none") {
        suggestions.set(value, fuzzyMatch);
      }
    }

    return suggestions;
  }

  /**
   * Auto-resolve values with high confidence matches
   */
  autoResolve(
    rows: Array<Record<string, any>>,
    field: EntityFieldConfig,
    lookupMap: LookupMap,
  ): {
    resolved: Array<Record<string, any>>;
    autoResolvedCount: number;
    corrections: Array<{ original: string; corrected: string }>;
  } {
    const resolved: Array<Record<string, any>> = [];
    const corrections: Array<{ original: string; corrected: string }> = [];
    let autoResolvedCount = 0;

    for (const row of rows) {
      const value = row[field.name];

      if (!value) {
        resolved.push(row);
        continue;
      }

      const strValue = String(value);

      // If exact match exists, keep it
      if (lookupMap.entries.has(strValue)) {
        resolved.push(row);
        continue;
      }

      // Try fuzzy matching for high confidence corrections
      const fuzzyMatch = this.findFuzzyMatch(strValue, lookupMap);

      if (fuzzyMatch.confidence === "high" && fuzzyMatch.closestMatch) {
        // Auto-correct to closest match
        const correctedRow = { ...row };
        correctedRow[field.name] = fuzzyMatch.closestMatch;
        resolved.push(correctedRow);

        corrections.push({
          original: strValue,
          corrected: fuzzyMatch.closestMatch,
        });
        autoResolvedCount++;
      } else {
        // Keep original value (will fail validation)
        resolved.push(row);
      }
    }

    return {
      resolved,
      autoResolvedCount,
      corrections,
    };
  }

  /**
   * Validate all lookup fields in a row
   */
  validateLookups(
    row: Record<string, any>,
    fields: EntityFieldConfig[],
    lookupMaps: Map<string, LookupMap>,
  ): Array<{
    field: string;
    value: string;
    resolved: boolean;
    suggestion?: string;
  }> {
    const results: Array<{
      field: string;
      value: string;
      resolved: boolean;
      suggestion?: string;
    }> = [];

    for (const field of fields) {
      if (field.type !== "lookup" || !field.lookupTarget) {
        continue;
      }

      const value = row[field.name];
      if (!value) {
        continue;
      }

      const lookupMap = lookupMaps.get(field.lookupTarget);
      if (!lookupMap) {
        continue;
      }

      const resolved = this.resolve(String(value), lookupMap, "exact");
      const result: {
        field: string;
        value: string;
        resolved: boolean;
        suggestion?: string;
      } = {
        field: field.name,
        value: String(value),
        resolved: resolved !== null,
      };

      // Add suggestion if not resolved
      if (!result.resolved) {
        const fuzzyMatch = this.findFuzzyMatch(String(value), lookupMap);
        if (fuzzyMatch.confidence !== "none" && fuzzyMatch.closestMatch) {
          result.suggestion = fuzzyMatch.closestMatch;
        }
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Resolve all lookup fields in a row to IDs
   */
  resolveRowLookups(
    row: Record<string, any>,
    fields: EntityFieldConfig[],
    lookupMaps: Map<string, LookupMap>,
    strategy: LookupStrategy = "exact",
  ): Record<string, any> {
    const resolved = { ...row };

    for (const field of fields) {
      if (field.type !== "lookup" || !field.lookupTarget) {
        continue;
      }

      const value = row[field.name];
      if (!value) {
        continue;
      }

      const lookupMap = lookupMaps.get(field.lookupTarget);
      if (!lookupMap) {
        continue;
      }

      const id = this.resolve(String(value), lookupMap, strategy);
      if (id) {
        // Replace the code/name with the actual ID
        const idFieldName = field.name.replace(/Code$|Name$/, "Id");
        resolved[idFieldName] = id;

        // Keep the original value for reference
        resolved[`${field.name}_original`] = value;
      }
    }

    return resolved;
  }
}

/**
 * Singleton instance
 */
export const lookupResolver = new LookupResolver();
