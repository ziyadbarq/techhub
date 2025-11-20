/**
 * Prompt Blocks and Compositions Seed Data
 *
 * Modular, reusable prompt system following DRY and SOLID principles.
 * Each block is atomic and can be composed into different prompts.
 *
 * This is a minimal example to demonstrate the prompt system.
 * Replace these with your own prompt blocks and compositions.
 */

import type { PrismaClient } from "../../../generated/prisma/client.js";
import {
  PromptBlockCategory,
  PromptPurpose,
} from "../../../generated/prisma/client.js";

export async function seedPrompts(prisma: PrismaClient) {
  console.log("🌱 Seeding prompt blocks and compositions...");

  // ============================================
  // ATOMIC PROMPT BLOCKS - DATA DEFINITIONS
  // ============================================

  const promptBlocksData = {
    // Example: Core writing guidelines
    writingStyle: {
      name: "writing-style",
      category: PromptBlockCategory.CONTENT_GUIDELINES,
      content: `WRITING STYLE GUIDELINES:
- Write clear, concise sentences
- Use active voice and action verbs
- Maintain consistent tone throughout
- Ensure content matches the intended audience level
- Use examples and analogies for complex concepts
- Avoid jargon unless audience-appropriate
- One main idea per paragraph`,
      description: "General writing style and tone guidelines",
      version: 1,
      isActive: true,
    },

    // Example: Content structure
    contentStructure: {
      name: "content-structure",
      category: PromptBlockCategory.CONTENT_GUIDELINES,
      content: `CONTENT STRUCTURE:
- Follow logical progression (problem → solution, general → specific)
- Use headers to organize sections
- Limit to 3-5 main points per section
- Build complexity gradually
- Include call-to-action or key takeaway
- Create narrative flow between sections`,
      description: "Content organization and structure",
      version: 1,
      isActive: true,
    },

    // Example: Technical accuracy
    technicalAccuracy: {
      name: "technical-accuracy",
      category: PromptBlockCategory.VALIDATION,
      content: `TECHNICAL ACCURACY:
- Verify all technical details and specifications
- Use correct terminology and definitions
- Include version numbers for libraries/frameworks
- Validate code examples for syntax correctness
- Cite sources for statistical claims
- Double-check dates, names, and facts`,
      description: "Technical accuracy validation criteria",
      version: 1,
      isActive: true,
    },

    // Example: Output formatting
    outputFormatting: {
      name: "output-formatting",
      category: PromptBlockCategory.CORE_SYNTAX,
      content: `OUTPUT FORMATTING:
- Use markdown for text formatting
- Code blocks should include language identifier
- Use tables for structured data
- Include headings for sections
- Use bullet points for lists
- Add line breaks for readability`,
      description: "Standard output formatting rules",
      version: 1,
      isActive: true,
    },
  };

  // ============================================
  // UPSERT PROMPT BLOCKS
  // ============================================

  const writingStyle = await prisma.promptBlock.upsert({
    where: { name: promptBlocksData.writingStyle.name },
    update: promptBlocksData.writingStyle,
    create: promptBlocksData.writingStyle,
  });

  const contentStructure = await prisma.promptBlock.upsert({
    where: { name: promptBlocksData.contentStructure.name },
    update: promptBlocksData.contentStructure,
    create: promptBlocksData.contentStructure,
  });

  const technicalAccuracy = await prisma.promptBlock.upsert({
    where: { name: promptBlocksData.technicalAccuracy.name },
    update: promptBlocksData.technicalAccuracy,
    create: promptBlocksData.technicalAccuracy,
  });

  const outputFormatting = await prisma.promptBlock.upsert({
    where: { name: promptBlocksData.outputFormatting.name },
    update: promptBlocksData.outputFormatting,
    create: promptBlocksData.outputFormatting,
  });

  console.log(`✅ Created/updated 4 prompt blocks`);

  // ============================================
  // PROMPT COMPOSITIONS - DATA DEFINITIONS
  // ============================================

  const compositionsData = {
    // Example: Content generation composition
    contentGeneration: {
      name: "content-generation-v1",
      purpose: PromptPurpose.CONTENT,
      description: "Generates well-structured content with proper formatting",
      version: 1,
      isActive: true,
      variables: {
        TONE: "professional",
        AUDIENCE: "general",
      },
    },

    // Example: Content review composition
    contentReview: {
      name: "content-review-v1",
      purpose: PromptPurpose.REVIEW,
      description: "Reviews content for quality and accuracy",
      version: 1,
      isActive: true,
    },
  };

  // ============================================
  // UPSERT PROMPT COMPOSITIONS
  // ============================================

  // 1. CONTENT GENERATION COMPOSITION
  const contentComposition = await prisma.promptComposition.upsert({
    where: { name: compositionsData.contentGeneration.name },
    update: compositionsData.contentGeneration,
    create: compositionsData.contentGeneration,
  });

  await prisma.promptCompositionBlock.deleteMany({
    where: { compositionId: contentComposition.id },
  });

  await prisma.promptCompositionBlock.createMany({
    data: [
      {
        compositionId: contentComposition.id,
        blockId: outputFormatting.id,
        order: 1,
      },
      {
        compositionId: contentComposition.id,
        blockId: writingStyle.id,
        order: 2,
      },
      {
        compositionId: contentComposition.id,
        blockId: contentStructure.id,
        order: 3,
      },
    ],
  });

  // 2. CONTENT REVIEW COMPOSITION
  const reviewComposition = await prisma.promptComposition.upsert({
    where: { name: compositionsData.contentReview.name },
    update: compositionsData.contentReview,
    create: compositionsData.contentReview,
  });

  await prisma.promptCompositionBlock.deleteMany({
    where: { compositionId: reviewComposition.id },
  });

  await prisma.promptCompositionBlock.createMany({
    data: [
      {
        compositionId: reviewComposition.id,
        blockId: technicalAccuracy.id,
        order: 1,
      },
      {
        compositionId: reviewComposition.id,
        blockId: writingStyle.id,
        order: 2,
      },
      {
        compositionId: reviewComposition.id,
        blockId: contentStructure.id,
        order: 3,
      },
    ],
  });

  console.log(`✅ Created/updated 2 prompt compositions`);
  console.log(`✅ Prompt system seed complete!`);
}
