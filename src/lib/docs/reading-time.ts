/**
 * Reading Time Calculator
 * Calculates estimated reading time for documentation content
 */

import type { ReadingTime } from "./types";

// Average reading speed (words per minute)
const WORDS_PER_MINUTE = 200;

/**
 * Strip MDX/HTML tags and code blocks from content
 */
function stripMarkdown(content: string): string {
  return (
    content
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, "")
      // Remove inline code
      .replace(/`[^`]+`/g, "")
      // Remove MDX components
      .replace(/<[^>]+>/g, "")
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
      // Remove headers markers
      .replace(/^#{1,6}\s+/gm, "")
      // Remove bold/italic markers
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
      // Remove horizontal rules
      .replace(/^---+$/gm, "")
      // Remove blockquote markers
      .replace(/^>\s+/gm, "")
      // Remove list markers
      .replace(/^[-*+]\s+/gm, "")
      .replace(/^\d+\.\s+/gm, "")
  );
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  const cleanText = stripMarkdown(text);
  const words = cleanText
    .split(/\s+/)
    .filter((word) => word.length > 0 && /\w/.test(word));
  return words.length;
}

/**
 * Calculate reading time for content
 * @param content - Raw MDX content
 * @returns Reading time object with minutes, words, and formatted text
 */
export function calculateReadingTime(content: string): ReadingTime {
  const words = countWords(content);
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));

  return {
    minutes,
    words,
    text: `${minutes} min read`,
  };
}

/**
 * Format reading time from frontmatter estimatedTime
 * Falls back to calculated time if not provided
 * @param estimatedTime - Optional estimated time from frontmatter (e.g., "5 minutes")
 * @param content - Raw MDX content for calculation fallback
 */
export function getReadingTime(
  estimatedTime: string | undefined,
  content: string,
): ReadingTime {
  if (estimatedTime) {
    // Parse frontmatter estimated time
    const match = estimatedTime.match(/(\d+)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      return {
        minutes,
        words: 0, // Unknown when using frontmatter
        text: `${minutes} min read`,
      };
    }
  }

  // Calculate from content
  return calculateReadingTime(content);
}
