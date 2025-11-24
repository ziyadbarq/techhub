/**
 * String Matching Utilities
 *
 * Fuzzy matching and string similarity algorithms for finding closest matches
 * in lookup values and validation suggestions.
 */

/**
 * Result of a closest match search
 */
export interface ClosestMatchResult {
  match: string;
  similarity: number;
}

/**
 * Find closest match using Levenshtein distance
 *
 * @param input - The input string to match
 * @param validValues - Array of valid values to search
 * @returns Object with match and similarity percentage (0-100), or null if no values provided
 *
 * @example
 * ```ts
 * findClosestMatch("appl", ["apple", "banana", "orange"])
 * // => { match: "apple", similarity: 80 }
 * ```
 */
export function findClosestMatch(
  input: string,
  validValues: string[],
): ClosestMatchResult | null {
  if (validValues.length === 0) return null;

  let closestMatch = validValues[0];
  let minDistance = levenshteinDistance(
    input.toLowerCase(),
    closestMatch.toLowerCase(),
  );

  for (const value of validValues.slice(1)) {
    const distance = levenshteinDistance(
      input.toLowerCase(),
      value.toLowerCase(),
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestMatch = value;
    }
  }

  // Calculate similarity percentage
  const maxLength = Math.max(input.length, closestMatch.length);
  const similarity = Math.round(((maxLength - minDistance) / maxLength) * 100);

  return { match: closestMatch, similarity };
}

/**
 * Calculate Levenshtein distance between two strings
 *
 * The Levenshtein distance is the minimum number of single-character edits
 * (insertions, deletions, or substitutions) required to change one string into another.
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Number of edits required
 *
 * @example
 * ```ts
 * levenshteinDistance("kitten", "sitting")
 * // => 3 (substitute k->s, substitute e->i, insert g)
 * ```
 */
export function levenshteinDistance(str1: string, str2: string): number {
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
