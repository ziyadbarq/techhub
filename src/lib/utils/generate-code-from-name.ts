/**
 * Generate a code/slug from a name string
 *
 * Converts a human-readable name into an uppercase code suitable for identifiers.
 * Similar to WordPress post slug generation.
 *
 * @param name - The name to convert to a code
 * @param maxLength - Maximum length of the generated code (default: 50)
 * @returns Uppercase code with only letters, numbers, hyphens, and underscores
 *
 * @example
 * generateCodeFromName("Laptop Computers") // "LAPTOP-COMPUTERS"
 * generateCodeFromName("IT & Security") // "IT-SECURITY"
 * generateCodeFromName("Server Room #1") // "SERVER-ROOM-1"
 */
export function generateCodeFromName(name: string, maxLength = 50): string {
  if (!name || typeof name !== "string") {
    return "";
  }

  return (
    name
      .trim()
      // Convert to uppercase
      .toUpperCase()
      // Replace common word separators with hyphens
      .replace(/[\s_]+/g, "-")
      // Remove special characters except hyphens
      .replace(/[^A-Z0-9-]/g, "")
      // Replace multiple consecutive hyphens with single hyphen
      .replace(/-+/g, "-")
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, "")
      // Truncate to max length
      .slice(0, maxLength)
  );
}
