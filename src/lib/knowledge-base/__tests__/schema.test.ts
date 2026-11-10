import { describe, expect, it } from "vitest";
import {
  blocksToText, createKnowledgeSchema, editKnowledgeSchema,
  knowledgeBlocksSchema, pdfMetadataSchema,
} from "../schema";

const good = {
  title: "Information Security Policy",
  summary: "Rules for handling company information.",
  category: "CYBERSECURITY",
  classification: "RESTRICTED",
  requiresAcknowledgement: true,
} as const;

describe("Knowledge Base document validation", () => {
  it("accepts structured knowledge without HTML interpretation", () => {
    const blocks = [
      { id: "h1", type: "heading", text: "Policy overview" },
      { id: "p1", type: "paragraph", text: "<script>alert('x')</script>" },
    ];
    const parsed = createKnowledgeSchema.parse({
      ...good, sourceType: "EDITOR", blocks,
    });
    expect(parsed.blocks[1].text).toContain("<script>");
    // Text is persisted in typed blocks; consumers render as escaped React text.
    expect(blocksToText(parsed.blocks)).toContain("Policy overview");
  });

  it("rejects unsupported block types and excessive content", () => {
    expect(() => knowledgeBlocksSchema.parse([{ id: "p", type: "html", text: "X" }])).toThrow();
    expect(() => knowledgeBlocksSchema.parse([{ id: "p", type: "paragraph", text: "x".repeat(12001) }])).toThrow();
    expect(() => knowledgeBlocksSchema.parse([])).toThrow();
  });

  it("rejects unknown classifications", () => {
    expect(() => pdfMetadataSchema.parse({ ...good, classification: "PUBLIC" })).toThrow();
  });

  it("uses optimistic version checks for editing", () => {
    expect(() => editKnowledgeSchema.parse({ ...good, expectedVersion: 0, blocks: [] })).toThrow();
    expect(editKnowledgeSchema.parse({
      ...good, expectedVersion: 4, blocks: [{ id: "p", type: "paragraph", text: "Current policy" }],
    }).expectedVersion).toBe(4);
  });
});
