import { z } from "zod";

// Block editor: typed text only. Never persist or render arbitrary HTML.
export const BLOCK_TYPES = ["paragraph", "heading", "subheading", "bullet", "numbered", "quote"] as const;
export const knowledgeBlockSchema = z.object({
  id: z.string().min(1).max(80),
  type: z.enum(BLOCK_TYPES),
  text: z.string().max(12000),
});
export const knowledgeBlocksSchema = z.array(knowledgeBlockSchema).min(1).max(150);
export type KnowledgeBlock = z.infer<typeof knowledgeBlockSchema>;

export const KNOWLEDGE_CATEGORIES = [
  "GENERAL", "CYBERSECURITY", "IT_OPERATIONS", "GOVERNANCE",
  "HUMAN_RESOURCES", "POLICIES", "PROCEDURES", "GUIDES",
] as const;

export const knowledgeFolderIdSchema = z.string().trim().min(1).max(80).nullable();
export const createKnowledgeFolderSchema = z.object({
  name: z.string().trim().min(1).max(80),
  parentId: knowledgeFolderIdSchema.default(null),
});
export const editKnowledgeFolderSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  parentId: knowledgeFolderIdSchema.optional(),
}).refine((data) => data.name !== undefined || data.parentId !== undefined, {
  message: "FOLDER_CHANGE_REQUIRED",
});
export const moveKnowledgeArticleSchema = z.object({
  folderId: knowledgeFolderIdSchema,
  expectedVersion: z.number().int().positive(),
});

const metadata = z.object({
  title: z.string().trim().min(4).max(200),
  summary: z.string().trim().max(1500).default(""),
  category: z.enum(KNOWLEDGE_CATEGORIES),
  classification: z.enum(["INTERNAL", "RESTRICTED"]),
  requiresAcknowledgement: z.boolean().default(false),
  folderId: knowledgeFolderIdSchema.optional(),
});

export const createKnowledgeSchema = metadata.extend({
  sourceType: z.literal("EDITOR"),
  blocks: knowledgeBlocksSchema,
});

export const editKnowledgeSchema = metadata.extend({
  expectedVersion: z.number().int().positive(),
  blocks: knowledgeBlocksSchema.optional(),
});

export const pdfMetadataSchema = metadata.extend({
  expectedVersion: z.number().int().positive().optional(),
});

export const knowledgeActionSchema = z.object({
  action: z.enum(["publish", "archive"]),
  expectedVersion: z.number().int().positive(),
});

export type KnowledgeInput = z.infer<typeof createKnowledgeSchema>;
export type KnowledgeEditInput = z.infer<typeof editKnowledgeSchema>;
export type PdfMetadataInput = z.infer<typeof pdfMetadataSchema>;

export function blocksToText(blocks: KnowledgeBlock[]): string {
  return blocks.map((block) => block.text).join("\n").slice(0, 120000);
}

export function parseBlocks(input: unknown): KnowledgeBlock[] {
  return knowledgeBlocksSchema.parse(input);
}
