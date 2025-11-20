/**
 * Markdown File Handler
 *
 * Utility functions for markdown file operations.
 * Provides validation, frontmatter extraction, and frontmatter updates.
 *
 * **Ported from slidev-ai-rag-task-manager with enhancements**
 */

/**
 * Valid YAML value types
 */
export type YamlValue =
  | string
  | number
  | boolean
  | null
  | YamlValue[]
  | { [key: string]: YamlValue };

/**
 * Frontmatter data structure
 */
export interface Frontmatter {
  [key: string]: YamlValue;
}

/**
 * Validates markdown content.
 *
 * Checks for:
 * - Non-empty content
 * - Valid UTF-8 encoding (no control characters except newlines/tabs)
 * - Reasonable file size (< 10MB)
 *
 * @param content - Markdown content to validate
 * @returns True if valid, false otherwise
 *
 * @example
 * ```typescript
 * if (!validateMarkdown(userInput)) {
 *   throw new Error('Invalid markdown content');
 * }
 * ```
 */
export function validateMarkdown(content: string): boolean {
  try {
    // Check for empty content
    if (!content || content.trim().length === 0) {
      return false;
    }

    // Check for reasonable size (10MB limit)
    const sizeInBytes = Buffer.byteLength(content, "utf-8");
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (sizeInBytes > maxSize) {
      return false;
    }

    // Check for null bytes or invalid control characters
    // Allow: newline (\n), carriage return (\r), tab (\t)
    // eslint-disable-next-line no-control-regex
    const invalidChars = /[\x00-\x08\x0B\x0C\x0E-\x1F]/;
    if (invalidChars.test(content)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts frontmatter from markdown content.
 *
 * Frontmatter format:
 * ```
 * ---
 * key: value
 * another: value
 * ---
 * ```
 *
 * @param content - Markdown content with optional frontmatter
 * @returns Parsed frontmatter object, or empty object if no frontmatter
 *
 * @example
 * ```typescript
 * const content = `---
 * title: My Document
 * author: John Doe
 * ---
 * # Content here`;
 *
 * const frontmatter = extractFrontmatter(content);
 * // { title: 'My Document', author: 'John Doe' }
 * ```
 */
export function extractFrontmatter(content: string): Frontmatter {
  try {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return {};
    }

    const frontmatterText = match[1];
    const frontmatter: Frontmatter = {};

    // Parse YAML-like frontmatter (simple key: value pairs)
    const lines = frontmatterText.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        continue;
      }

      // Parse key: value pairs
      const colonIndex = trimmedLine.indexOf(":");
      if (colonIndex === -1) {
        continue;
      }

      const key = trimmedLine.substring(0, colonIndex).trim();
      const valueStr = trimmedLine.substring(colonIndex + 1).trim();

      // Parse value (handle strings, numbers, booleans, arrays)
      frontmatter[key] = parseYamlValue(valueStr);
    }

    return frontmatter;
  } catch {
    return {};
  }
}

/**
 * Updates frontmatter in markdown content.
 *
 * If frontmatter exists, updates the specified keys.
 * If frontmatter doesn't exist, creates new frontmatter.
 * Preserves existing keys not specified in updates.
 *
 * @param content - Original markdown content
 * @param updates - Key-value pairs to update in frontmatter
 * @returns Updated markdown content with modified frontmatter
 *
 * @example
 * ```typescript
 * const updated = updateFrontmatter(content, {
 *   layout: 'cover',
 *   theme: 'default'
 * });
 * ```
 */
export function updateFrontmatter(
  content: string,
  updates: Record<string, YamlValue>,
): string {
  try {
    // Extract existing frontmatter
    const existingFrontmatter = extractFrontmatter(content);

    // Merge with updates
    const newFrontmatter = { ...existingFrontmatter, ...updates };

    // Remove existing frontmatter from content
    const contentWithoutFrontmatter = content.replace(
      /^---\n[\s\S]*?\n---\n*/,
      "",
    );

    // Build new frontmatter string
    const frontmatterLines = ["---"];
    for (const [key, value] of Object.entries(newFrontmatter)) {
      frontmatterLines.push(`${key}: ${formatYamlValue(value)}`);
    }
    frontmatterLines.push("---");

    // Combine frontmatter with content
    return frontmatterLines.join("\n") + "\n" + contentWithoutFrontmatter;
  } catch (error) {
    throw new Error(
      `Failed to update frontmatter: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Parses a YAML value string into a JavaScript value.
 *
 * Supports:
 * - Strings (quoted or unquoted)
 * - Numbers
 * - Booleans (true/false)
 * - Arrays ([item1, item2])
 * - null
 *
 * @param valueStr - YAML value string
 * @returns Parsed JavaScript value
 */
function parseYamlValue(valueStr: string): YamlValue {
  const trimmed = valueStr.trim();

  // Handle null
  if (trimmed === "null" || trimmed === "~") {
    return null;
  }

  // Handle booleans
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;

  // Handle numbers
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  // Handle arrays [item1, item2]
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const arrayContent = trimmed.slice(1, -1);
    return arrayContent
      .split(",")
      .map((item) => parseYamlValue(item.trim()))
      .filter((item) => item !== "");
  }

  // Handle quoted strings
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  // Default to string
  return trimmed;
}

/**
 * Formats a JavaScript value as a YAML value string.
 *
 * @param value - JavaScript value to format
 * @returns YAML-formatted string
 */
function formatYamlValue(value: YamlValue): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return "null";
  }

  // Handle booleans
  if (typeof value === "boolean") {
    return String(value);
  }

  // Handle numbers
  if (typeof value === "number") {
    return String(value);
  }

  // Handle arrays
  if (Array.isArray(value)) {
    const formattedItems = value.map((item) => formatYamlValue(item));
    return `[${formattedItems.join(", ")}]`;
  }

  // Handle objects (convert to JSON string)
  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  // Handle strings
  const str = String(value);

  // Quote strings that contain special characters or spaces
  if (
    str.includes(":") ||
    str.includes("#") ||
    str.includes("[") ||
    str.includes("]") ||
    str.includes(",") ||
    str.includes(" ") ||
    str.trim() !== str
  ) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }

  return str;
}

/**
 * Extracts the body content (without frontmatter) from markdown.
 *
 * @param content - Markdown content with optional frontmatter
 * @returns Body content without frontmatter
 *
 * @example
 * ```typescript
 * const body = extractBody(markdown);
 * // Returns content after frontmatter block
 * ```
 */
export function extractBody(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n*/, "");
}

/**
 * Checks if markdown content has frontmatter.
 *
 * @param content - Markdown content
 * @returns True if frontmatter exists
 *
 * @example
 * ```typescript
 * if (hasFrontmatter(content)) {
 *   const frontmatter = extractFrontmatter(content);
 * }
 * ```
 */
export function hasFrontmatter(content: string): boolean {
  return /^---\n[\s\S]*?\n---/.test(content);
}

/**
 * Removes frontmatter from markdown content.
 *
 * @param content - Markdown content
 * @returns Content without frontmatter
 *
 * @example
 * ```typescript
 * const cleanContent = removeFrontmatter(markdown);
 * ```
 */
export function removeFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n*/, "");
}

/**
 * Adds frontmatter to markdown content (if it doesn't exist).
 *
 * @param content - Markdown content
 * @param frontmatter - Frontmatter data to add
 * @returns Content with frontmatter
 *
 * @example
 * ```typescript
 * const withFrontmatter = addFrontmatter(content, {
 *   title: 'My Document',
 *   author: 'John Doe'
 * });
 * ```
 */
export function addFrontmatter(
  content: string,
  frontmatter: Record<string, YamlValue>,
): string {
  if (hasFrontmatter(content)) {
    return updateFrontmatter(content, frontmatter);
  }

  const frontmatterLines = ["---"];
  for (const [key, value] of Object.entries(frontmatter)) {
    frontmatterLines.push(`${key}: ${formatYamlValue(value)}`);
  }
  frontmatterLines.push("---");

  return frontmatterLines.join("\n") + "\n" + content;
}
