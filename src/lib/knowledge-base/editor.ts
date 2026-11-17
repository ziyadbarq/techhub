import type { KnowledgeBlock } from "./schema";

export type BlockType = KnowledgeBlock["type"];

export const MAX_BLOCKS = 150;
export const MAX_BLOCK_TEXT = 12000;

const SHORTCUTS: ReadonlyArray<[RegExp, BlockType]> = [
  [/^##\s+/, "subheading"],
  [/^#\s+/, "heading"],
  [/^[-*•]\s+/, "bullet"],
  [/^\d+[.)]\s+/, "numbered"],
  [/^>\s*/, "quote"],
];

/**
 * Markdown-style shortcut typed at the start of a paragraph ("# ", "- ", "1. ", "> ").
 * Returns the new type and the text without the marker, or null when nothing matched.
 */
export function detectShortcut(
  text: string,
): { type: BlockType; text: string } | null {
  for (const [pattern, type] of SHORTCUTS) {
    const match = pattern.exec(text);
    if (match && (type !== "quote" || match[0].length > 1)) {
      return { type, text: text.slice(match[0].length) };
    }
  }
  return null;
}

/**
 * Turns pasted plain text into blocks. Each non-empty line becomes a block and
 * common Markdown/Word list markers are recognised. Nothing is ever parsed as HTML.
 */
export function parsePastedText(
  raw: string,
): Array<{ type: BlockType; text: string }> {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  const result: Array<{ type: BlockType; text: string }> = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const shortcut = detectShortcut(trimmed);
    const entry = shortcut ?? { type: "paragraph" as const, text: trimmed };
    result.push({
      type: entry.type,
      text: entry.text.slice(0, MAX_BLOCK_TEXT),
    });
  }
  return result;
}

/** Type a new block gets after pressing Enter in a block of the given type. */
export function nextBlockType(type: BlockType): BlockType {
  return type === "bullet" || type === "numbered" ? type : "paragraph";
}

export function countWords(blocks: readonly KnowledgeBlock[]): number {
  let words = 0;
  for (const block of blocks) {
    const trimmed = block.text.trim();
    if (trimmed) words += trimmed.split(/\s+/).length;
  }
  return words;
}

export function hasContent(blocks: readonly KnowledgeBlock[]): boolean {
  return blocks.some((block) => block.text.trim().length > 0);
}
