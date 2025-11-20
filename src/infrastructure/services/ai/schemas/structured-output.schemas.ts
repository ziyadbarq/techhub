/**
 * Structured Output Schemas for GPT-5
 *
 * Zod schemas that define the exact structure for AI responses.
 * GPT-5's Structured Outputs feature guarantees 100% schema compliance.
 *
 * Key benefits:
 * - No validation or retry logic needed
 * - Type-safe responses
 * - Cost-efficient (no malformed responses)
 */

import { z } from "zod";

// ============================================
// ENUMS & CONSTANTS
// ============================================

/**
 * Supported Slidev layouts
 */
export const SlidevLayoutSchema = z.enum([
  "default",
  "center",
  "two-cols",
  "statement",
  "image-right",
  "cover",
]);

export type SlidevLayout = z.infer<typeof SlidevLayoutSchema>;

/**
 * Presentation audiences
 */
export const AudienceSchema = z.enum([
  "investors",
  "customers",
  "students",
  "general",
]);

export type Audience = z.infer<typeof AudienceSchema>;

/**
 * Presentation purposes
 */
export const PurposeSchema = z.enum([
  "inform",
  "persuade",
  "educate",
  "entertain",
]);

export type Purpose = z.infer<typeof PurposeSchema>;

/**
 * Presentation tones
 */
export const ToneSchema = z.enum([
  "professional",
  "casual",
  "technical",
  "creative",
]);

export type Tone = z.infer<typeof ToneSchema>;

// ============================================
// OUTLINE GENERATION SCHEMAS
// ============================================

/**
 * Schema for click animations (progressive disclosure)
 */
export const ClickAnimationSchema = z.object({
  element: z.string().describe("CSS selector or element description"),
  order: z.number().int().positive().describe("Animation order (1-based)"),
});

export type ClickAnimation = z.infer<typeof ClickAnimationSchema>;

/**
 * Schema for a single slide in the outline
 */
export const SlideOutlineSchema = z.object({
  slideNumber: z.number().int().positive(),
  title: z.string().min(1).max(100),
  layout: SlidevLayoutSchema,
  contentPoints: z.array(z.string()).min(1).max(5),
  speakerNotes: z.string().nullish(),
  suggestedVisuals: z.array(z.string()).max(3).nullish(),
  clickAnimations: z
    .array(ClickAnimationSchema)
    .max(10)
    .nullish()
    .describe("Elements to reveal progressively with v-click"),
});

export type SlideOutline = z.infer<typeof SlideOutlineSchema>;

/**
 * Schema for presentation metadata
 */
export const PresentationMetadataSchema = z.object({
  title: z.string().min(1).max(200),
  audience: AudienceSchema,
  purpose: PurposeSchema,
  estimatedDuration: z
    .number()
    .int()
    .positive()
    .describe("Duration in minutes"),
});

export type PresentationMetadata = z.infer<typeof PresentationMetadataSchema>;

/**
 * Complete presentation outline schema
 * This is what GPT-5 returns with 100% guarantee
 */
export const PresentationOutlineSchema = z.object({
  metadata: PresentationMetadataSchema,
  slides: z.array(SlideOutlineSchema).min(3).max(50),
});

export type PresentationOutline = z.infer<typeof PresentationOutlineSchema>;

// ============================================
// SLIDE CONTENT GENERATION SCHEMAS
// ============================================

/**
 * Schema for generated slide frontmatter (YAML)
 */
export const SlideFrontmatterSchema = z
  .record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  )
  .nullish();

export type SlideFrontmatter = z.infer<typeof SlideFrontmatterSchema>;

/**
 * Schema for layout-specific regions (e.g., left/right columns)
 */
export const LayoutRegionsSchema = z.record(z.string(), z.string()).nullish();

export type LayoutRegions = z.infer<typeof LayoutRegionsSchema>;

/**
 * Schema for code block metadata (Phase 2.1)
 * Used to enhance code blocks with syntax highlighting and file names
 */
export const CodeBlockMetadataSchema = z
  .object({
    /** Line highlighting syntax for Shiki (e.g., "{2-3|5|all}") */
    codeHighlights: z
      .string()
      .nullish()
      .describe("Line numbers to highlight, e.g., {2-3|5|all}"),
    /** Optional file name to display above code block */
    fileName: z.string().nullish().describe("File name for code context"),
  })
  .nullish();

export type CodeBlockMetadata = z.infer<typeof CodeBlockMetadataSchema>;

/**
 * Schema for Mermaid diagram (Phase 2.2)
 * Supports architecture diagrams, flowcharts, and sequence diagrams
 */
export const DiagramSchema = z
  .object({
    /** Diagram type - currently only Mermaid is supported */
    type: z.literal("mermaid"),
    /** Mermaid diagram code */
    code: z
      .string()
      .min(1)
      .describe("Valid Mermaid diagram syntax for architecture/flow/sequence"),
  })
  .nullish();

export type Diagram = z.infer<typeof DiagramSchema>;

/**
 * Schema for slide transitions (Phase 2.3)
 * Defines visual transition effects between slides
 */
export const SlideTransitionSchema = z
  .enum(["slide-left", "slide-right", "slide-up", "slide-down", "fade", "zoom"])
  .nullish()
  .describe("Transition effect when navigating to this slide");

export type SlideTransition = z.infer<typeof SlideTransitionSchema>;

/**
 * Schema for element animation (Phase 4.2)
 * Applies motion animations to specific slide elements
 */
export const ElementAnimationSchema = z.object({
  /** CSS selector or element identifier */
  element: z
    .string()
    .min(1)
    .describe("CSS selector or description of element to animate"),
  /** Animation preset name */
  preset: z.enum([
    "slide-in-left",
    "slide-in-right",
    "fade-in",
    "scale-up",
    "bounce-in",
  ]),
});

export type ElementAnimation = z.infer<typeof ElementAnimationSchema>;

/**
 * Schema for motion animations array (Phase 4.2)
 */
export const MotionAnimationsSchema = z
  .array(ElementAnimationSchema)
  .max(10)
  .nullish()
  .describe("Motion animations for key slide elements");

export type MotionAnimations = z.infer<typeof MotionAnimationsSchema>;

/**
 * Schema for a single generated slide
 * Enhanced with code blocks, diagrams, transitions, and animations
 */
export const GeneratedSlideSchema = z.object({
  slideNumber: z.number().int().positive(),
  layout: SlidevLayoutSchema,
  frontmatter: SlideFrontmatterSchema,
  markdown: z.string().min(1),
  layoutRegions: LayoutRegionsSchema,
  speakerNotes: z
    .string()
    .nullish()
    .describe("Speaker notes for the presenter"),
  /** Code block enhancements (Phase 2.1) */
  codeBlockMetadata: CodeBlockMetadataSchema,
  /** Mermaid diagram support (Phase 2.2) */
  diagram: DiagramSchema,
  /** Slide transition effect (Phase 2.3) */
  transition: SlideTransitionSchema,
  /** Motion animations for slide elements (Phase 4.2) */
  animations: MotionAnimationsSchema,
});

export type GeneratedSlide = z.infer<typeof GeneratedSlideSchema>;

/**
 * Schema for batch slide generation
 */
export const BatchGeneratedSlidesSchema = z.object({
  slides: z.array(GeneratedSlideSchema),
  totalTokensUsed: z.number().int().positive().nullish(),
});

export type BatchGeneratedSlides = z.infer<typeof BatchGeneratedSlidesSchema>;

// ============================================
// THEME RECOMMENDATION SCHEMAS
// ============================================

/**
 * Schema for alternative theme suggestion
 */
export const AlternativeThemeSchema = z.object({
  themeId: z.string(),
  reason: z.string().min(10).max(200),
});

export type AlternativeTheme = z.infer<typeof AlternativeThemeSchema>;

/**
 * Schema for theme recommendation
 */
export const ThemeRecommendationSchema = z.object({
  recommendedThemeId: z.string(),
  reason: z.string().min(20).max(300),
  confidence: z.number().min(0).max(1),
  alternativeThemes: z.array(AlternativeThemeSchema).max(2).nullish(),
});

export type ThemeRecommendation = z.infer<typeof ThemeRecommendationSchema>;

// ============================================
// QUALITY REVIEW SCHEMAS
// ============================================

/**
 * Schema for individual quality issue
 */
export const QualityIssueSchema = z.object({
  type: z.enum(["accuracy", "tone", "structure", "formatting", "completeness"]),
  severity: z.enum(["low", "medium", "high"]),
  description: z.string().min(10).max(500),
  slideNumber: z.number().int().positive().nullish(),
});

export type QualityIssue = z.infer<typeof QualityIssueSchema>;

/**
 * Schema for quality review result
 */
export const QualityReviewSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  issues: z.array(QualityIssueSchema).max(20),
  suggestions: z.array(z.string()).min(0).max(5),
});

export type QualityReview = z.infer<typeof QualityReviewSchema>;

// ============================================
// REFINEMENT SCHEMAS
// ============================================

/**
 * Schema for refined slide content
 */
export const RefinedSlideSchema = z.object({
  originalContent: z.string(),
  refinedContent: z.string().min(1),
  changesApplied: z.array(z.string()).max(5),
});

export type RefinedSlide = z.infer<typeof RefinedSlideSchema>;

// ============================================
// OUTLINE VARIATION SCHEMAS
// ============================================

/**
 * Schema for multiple outline variations
 */
export const OutlineVariationsSchema = z.object({
  variations: z.array(PresentationOutlineSchema).min(2).max(3),
  comparisonNotes: z.string().max(500).nullish(),
});

export type OutlineVariations = z.infer<typeof OutlineVariationsSchema>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validates if a string is valid Slidev markdown
 */
export function validateSlidevMarkdown(markdown: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for frontmatter (optional but recommended)
  if (!markdown.startsWith("---")) {
    errors.push(
      "Warning: No frontmatter found. Consider adding YAML frontmatter.",
    );
  }

  // Check for slide separators
  if (!markdown.includes("\n---\n") && !markdown.includes("\r\n---\r\n")) {
    errors.push("Warning: No slide separators (---) found.");
  }

  // Check for unsupported syntax
  if (markdown.includes("<script>")) {
    errors.push("Error: Script tags are not recommended in Slidev markdown.");
  }

  // Check layout syntax
  const layoutRegex = /^layout:\s*(\w+)/gm;
  const layouts = Array.from(markdown.matchAll(layoutRegex));
  const validLayouts = [
    "default",
    "center",
    "two-cols",
    "statement",
    "image-right",
    "cover",
  ];

  layouts.forEach((match) => {
    const layout = match[1];
    if (!validLayouts.includes(layout)) {
      errors.push(
        `Error: Unknown layout "${layout}". Valid layouts: ${validLayouts.join(", ")}`,
      );
    }
  });

  return {
    isValid: errors.filter((e) => e.startsWith("Error")).length === 0,
    errors,
  };
}

/**
 * Converts a PresentationOutline to markdown template
 */
export function outlineToMarkdownTemplate(
  outline: PresentationOutline,
): string {
  let markdown = "---\n";
  markdown += `theme: default\n`;
  markdown += `title: ${outline.metadata.title}\n`;
  markdown += `mdc: true\n`;
  markdown += `drawings:\n`;
  markdown += `  persist: true\n`;
  markdown += `  presenterOnly: false\n`;
  markdown += `---\n\n`;

  outline.slides.forEach((slide) => {
    if (slide.layout !== "default") {
      markdown += `---\nlayout: ${slide.layout}\n---\n\n`;
    } else {
      markdown += `---\n\n`;
    }

    markdown += `# ${slide.title}\n\n`;

    // Add content points with progressive disclosure
    slide.contentPoints.forEach((point) => {
      // Wrap each bullet point in v-click for progressive disclosure
      markdown += `<div v-click>\n\n- ${point}\n\n</div>\n`;
    });

    // Add speaker notes if present
    if (slide.speakerNotes) {
      markdown += `\n<!--\nSpeaker notes:\n${slide.speakerNotes}\n-->\n`;
    }

    markdown += "\n";
  });

  return markdown;
}

/**
 * Converts a GeneratedSlide to full Slidev markdown with enhanced features
 * Demonstrates usage of code blocks, diagrams, transitions, and animations
 */
export function generatedSlideToMarkdown(slide: GeneratedSlide): string {
  let markdown = "";

  // Add frontmatter if present
  if (slide.frontmatter && Object.keys(slide.frontmatter).length > 0) {
    for (const [key, value] of Object.entries(slide.frontmatter)) {
      if (Array.isArray(value)) {
        markdown += `${key}:\n${value.map((v) => `  - ${v}`).join("\n")}\n`;
      } else {
        markdown += `${key}: ${value}\n`;
      }
    }
    markdown += "---\n\n";
  }

  // Add transition if specified
  if (slide.transition) {
    markdown = `transition: ${slide.transition}\n${markdown}`;
  }

  // Add main content
  markdown += slide.markdown;

  // Add Mermaid diagram if present
  if (slide.diagram) {
    markdown += `\n\n\`\`\`mermaid\n${slide.diagram.code}\n\`\`\`\n`;
  }

  // Add code block metadata as comments for reference
  if (slide.codeBlockMetadata) {
    if (slide.codeBlockMetadata.fileName) {
      markdown += `\n<!-- Code file: ${slide.codeBlockMetadata.fileName} -->\n`;
    }
    if (slide.codeBlockMetadata.codeHighlights) {
      markdown += `\n<!-- Highlights: ${slide.codeBlockMetadata.codeHighlights} -->\n`;
    }
  }

  // Add animation metadata as comments
  if (slide.animations && slide.animations.length > 0) {
    markdown += `\n<!-- Animations:\n`;
    slide.animations.forEach((anim) => {
      markdown += `  - ${anim.element}: ${anim.preset}\n`;
    });
    markdown += `-->\n`;
  }

  // Add speaker notes if present
  if (slide.speakerNotes) {
    markdown += `\n<!--\nSpeaker notes:\n${slide.speakerNotes}\n-->\n`;
  }

  return markdown;
}

/**
 * Estimates token count for a schema
 * Rough estimate: 1 token ≈ 4 characters
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculates cost based on GPT-5.1 pricing
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: "gpt-5.1" | "gpt-5" | "gpt-5-mini",
): number {
  const pricing = {
    "gpt-5.1": { input: 1.25, output: 10.0 },
    "gpt-5": { input: 1.25, output: 10.0 },
    "gpt-5-mini": { input: 0.25, output: 2.0 },
  };

  const rates = pricing[model];
  const inputCost = (inputTokens / 1_000_000) * rates.input;
  const outputCost = (outputTokens / 1_000_000) * rates.output;

  return inputCost + outputCost;
}
