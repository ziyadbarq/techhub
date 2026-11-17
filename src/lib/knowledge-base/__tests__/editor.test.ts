import { describe, expect, it } from "vitest";
import {
  countWords,
  detectShortcut,
  hasContent,
  nextBlockType,
  parsePastedText,
} from "../editor";

describe("knowledge editor helpers", () => {
  it("detects markdown shortcuts at the start of a block", () => {
    expect(detectShortcut("# Purpose")).toEqual({
      type: "heading",
      text: "Purpose",
    });
    expect(detectShortcut("## Scope")).toEqual({
      type: "subheading",
      text: "Scope",
    });
    expect(detectShortcut("- item")).toEqual({ type: "bullet", text: "item" });
    expect(detectShortcut("* item")).toEqual({ type: "bullet", text: "item" });
    expect(detectShortcut("1. step")).toEqual({
      type: "numbered",
      text: "step",
    });
    expect(detectShortcut("> note")).toEqual({ type: "quote", text: "note" });
    expect(detectShortcut("plain text")).toBeNull();
    expect(detectShortcut("#hashtag")).toBeNull();
  });

  it("splits pasted text into typed blocks and drops blank lines", () => {
    expect(
      parsePastedText(
        "# Policy\r\n\r\nIntro line\n- one\n• two\n2) step\n> quoted",
      ),
    ).toEqual([
      { type: "heading", text: "Policy" },
      { type: "paragraph", text: "Intro line" },
      { type: "bullet", text: "one" },
      { type: "bullet", text: "two" },
      { type: "numbered", text: "step" },
      { type: "quote", text: "quoted" },
    ]);
  });

  it("continues lists on enter but returns to paragraphs otherwise", () => {
    expect(nextBlockType("bullet")).toBe("bullet");
    expect(nextBlockType("numbered")).toBe("numbered");
    expect(nextBlockType("heading")).toBe("paragraph");
    expect(nextBlockType("quote")).toBe("paragraph");
  });

  it("counts words and detects content", () => {
    const blocks = [
      { id: "a", type: "paragraph" as const, text: "  two words " },
      { id: "b", type: "bullet" as const, text: "" },
    ];
    expect(countWords(blocks)).toBe(2);
    expect(hasContent(blocks)).toBe(true);
    expect(hasContent([{ id: "c", type: "paragraph", text: "   " }])).toBe(
      false,
    );
  });
});
