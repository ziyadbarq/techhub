/**
 * Human labels for workflow enum values ("IN_REVIEW" -> "In review"), so
 * pages show the same sentence-case text as the rest of TechHub instead of
 * raw database enums.
 */
export function workflowLabel(value: string | null | undefined): string {
  if (!value) return "";
  const words = value.toLowerCase().split("_").filter(Boolean).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
