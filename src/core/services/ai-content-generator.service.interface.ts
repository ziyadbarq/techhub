/**
 * AI Content Generator Service Interface
 *
 * Defines the contract for AI-powered presentation generation using GPT-5 models.
 * Handles outline generation, slide content creation, refinement, and quality review.
 */

import type { TokenUsage } from "@/infrastructure/services/ai/pricing.config";

/**
 * Result wrapper that includes token usage data
 */
export interface AIGenerationResult<T> {
  data: T;
  usage: TokenUsage;
}

/**
 * Input for generating a presentation outline
 */
export interface OutlineGenerationInput {
  /**
   * User's prompt or description of the presentation topic
   */
  prompt: string;

  /**
   * Target audience for the presentation
   */
  audience?: "investors" | "customers" | "students" | "general";

  /**
   * Primary purpose of the presentation
   */
  purpose?: "inform" | "persuade" | "educate" | "entertain";

  /**
   * Desired number of slides
   */
  slideCount?: number;

  /**
   * Preferred tone of the presentation
   */
  tone?: "professional" | "casual" | "technical" | "creative";

  /**
   * Additional context or uploaded document content
   */
  context?: string;

  /**
   * Metadata from uploaded files (if any)
   */
  fileMetadata?: {
    type: "pdf" | "docx" | "pptx" | "url";
    extractedText?: string;
    structure?: Record<string, unknown>;
  };
}

/**
 * Click animation for progressive disclosure
 */
export interface ClickAnimation {
  element: string;
  order: number;
}

/**
 * A single slide in the generated outline
 */
export interface SlideOutline {
  slideNumber: number;
  title: string;
  layout:
    | "default"
    | "center"
    | "two-cols"
    | "statement"
    | "image-right"
    | "cover";
  contentPoints: string[];
  speakerNotes?: string | null;
  suggestedVisuals?: string[] | null;
  clickAnimations?: ClickAnimation[] | null;
}

/**
 * Generated presentation outline
 */
export interface PresentationOutline {
  metadata: {
    title: string;
    audience: string;
    purpose: string;
    estimatedDuration: number; // in minutes
  };
  slides: SlideOutline[];
}

/**
 * Input for generating slide content
 */
export interface SlideContentGenerationInput {
  outline: SlideOutline;
  theme: {
    name: string;
    layouts: string[];
  };
  previousSlides?: GeneratedSlide[];
  globalContext?: string;
}

/**
 * Code block metadata for enhanced code presentation (Phase 2.1)
 */
export interface CodeBlockMetadata {
  /** Line highlighting syntax for Shiki (e.g., "{2-3|5|all}") */
  codeHighlights?: string | null;
  /** Optional file name to display above code block */
  fileName?: string | null;
}

/**
 * Diagram definition for visual representations (Phase 2.2)
 */
export interface Diagram {
  /** Diagram type - currently only Mermaid is supported */
  type: "mermaid";
  /** Mermaid diagram code */
  code: string;
}

/**
 * Slide transition effects (Phase 2.3)
 */
export type SlideTransition =
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | "fade"
  | "zoom";

/**
 * Element animation for motion effects (Phase 4.2)
 */
export interface ElementAnimation {
  /** CSS selector or element identifier */
  element: string;
  /** Animation preset name */
  preset:
    | "slide-in-left"
    | "slide-in-right"
    | "fade-in"
    | "scale-up"
    | "bounce-in";
}

/**
 * Generated slide content in Slidev markdown format
 * Enhanced with code blocks, diagrams, transitions, and animations
 */
export interface GeneratedSlide {
  slideNumber: number;
  layout:
    | "default"
    | "center"
    | "two-cols"
    | "statement"
    | "image-right"
    | "cover";
  frontmatter?: Record<string, string | number | boolean | string[]> | null;
  markdown: string;
  layoutRegions?: Record<string, string> | null;
  speakerNotes?: string | null;
  tokensUsed?: number;
  /** Code block enhancements (Phase 2.1) */
  codeBlockMetadata?: CodeBlockMetadata | null;
  /** Mermaid diagram support (Phase 2.2) */
  diagram?: Diagram | null;
  /** Slide transition effect (Phase 2.3) */
  transition?: SlideTransition | null;
  /** Motion animations for slide elements (Phase 4.2) */
  animations?: ElementAnimation[] | null;
}

/**
 * Input for refining existing slide content
 */
export interface SlideRefinementInput {
  currentContent: string;
  instruction:
    | "make_shorter"
    | "make_longer"
    | "change_tone"
    | "add_details"
    | "simplify"
    | "regenerate";
  additionalContext?: string;
}

/**
 * Theme recommendation based on content
 */
export interface ThemeRecommendation {
  recommendedThemeId: string;
  reason: string;
  confidence: number; // 0-1
  alternativeThemes?: Array<{
    themeId: string;
    reason: string;
  }> | null;
}

/**
 * Quality review result for generated content
 */
export interface QualityReview {
  overallScore: number; // 0-100
  issues: Array<{
    type: "accuracy" | "tone" | "structure" | "formatting" | "completeness";
    severity: "low" | "medium" | "high";
    description: string;
    slideNumber?: number | null;
  }>;
  suggestions: string[];
}

/**
 * Service interface for AI-powered presentation generation.
 *
 * This service is responsible for:
 * - Generating presentation outlines from user prompts
 * - Creating slide content in Slidev markdown format
 * - Refining and improving existing slides
 * - Recommending themes based on content
 * - Quality assurance and review
 */
export interface IAIContentGeneratorService {
  // ========================================
  // Outline Generation
  // ========================================

  /**
   * Generates multiple outline variations for a presentation.
   *
   * Uses GPT-5-mini for fast, cost-effective outline generation.
   * Returns 2-3 different outline options for user selection.
   *
   * @param input - Outline generation parameters
   * @param variationCount - Number of outline variations to generate (default: 2)
   * @param presentationId - Optional presentation ID for debug tracing
   * @returns Promise resolving to array of outline variations with token usage
   * @throws {Error} If AI API fails or input is invalid
   */
  generateOutlineVariations(
    input: OutlineGenerationInput,
    variationCount?: number,
    presentationId?: string,
  ): Promise<AIGenerationResult<PresentationOutline[]>>;

  /**
   * Generates a single, optimized outline.
   *
   * @param input - Outline generation parameters
   * @param presentationId - Optional presentation ID for debug tracing
   * @returns Promise resolving to a presentation outline with token usage
   */
  generateOutline(
    input: OutlineGenerationInput,
    presentationId?: string,
  ): Promise<AIGenerationResult<PresentationOutline>>;

  // ========================================
  // Slide Content Generation
  // ========================================

  /**
   * Generates content for a single slide based on outline.
   *
   * Uses GPT-5.1 with adaptive reasoning for high-quality content.
   * Returns properly formatted Slidev markdown.
   *
   * @param input - Slide content generation parameters
   * @param presentationId - Optional presentation ID for debug tracing
   * @returns Promise resolving to generated slide with token usage
   * @throws {Error} If generation fails or markdown is invalid
   */
  generateSlideContent(
    input: SlideContentGenerationInput,
    presentationId?: string,
  ): Promise<AIGenerationResult<GeneratedSlide>>;

  /**
   * Generates content for multiple slides in parallel.
   *
   * Optimized for batch processing with cost management.
   *
   * @param inputs - Array of slide generation inputs
   * @param presentationId - Optional presentation ID for debug tracing
   * @returns Promise resolving to array of generated slides with combined token usage
   */
  generateMultipleSlides(
    inputs: SlideContentGenerationInput[],
    presentationId?: string,
  ): Promise<AIGenerationResult<GeneratedSlide[]>>;

  // ========================================
  // Content Refinement
  // ========================================

  /**
   * Refines existing slide content based on user instruction.
   *
   * Uses GPT-5-mini for quick refinements to save costs.
   *
   * @param input - Refinement parameters
   * @param presentationId - Optional presentation ID for debug tracing
   * @returns Promise resolving to refined markdown content with token usage
   */
  refineSlideContent(
    input: SlideRefinementInput,
    presentationId?: string,
  ): Promise<AIGenerationResult<string>>;

  /**
   * Generates multiple variations of a slide for A/B comparison.
   *
   * @param slideContent - Current slide content
   * @param variationCount - Number of variations (default: 3)
   * @param presentationId - Optional presentation ID for debug tracing
   * @returns Promise resolving to array of slide variations with token usage
   */
  generateSlideVariations(
    slideContent: string,
    variationCount?: number,
    presentationId?: string,
  ): Promise<AIGenerationResult<string[]>>;

  // ========================================
  // Theme Recommendations
  // ========================================

  /**
   * Recommends themes based on presentation content and purpose.
   *
   * Analyzes outline and suggests appropriate themes.
   *
   * @param outline - Presentation outline
   * @param availableThemes - List of available theme IDs
   * @param presentationId - Optional presentation ID for debug tracing
   * @returns Promise resolving to theme recommendation with token usage
   */
  recommendTheme(
    outline: PresentationOutline,
    availableThemes: string[],
    presentationId?: string,
  ): Promise<AIGenerationResult<ThemeRecommendation>>;

  // ========================================
  // Quality Review
  // ========================================

  /**
   * Reviews generated content for quality, accuracy, and consistency.
   *
   * Uses GPT-5 for balanced quality checking.
   *
   * @param slides - Generated slides to review
   * @param outline - Original outline for context
   * @param presentationId - Optional presentation ID for debug tracing
   * @returns Promise resolving to quality review results with token usage
   */
  reviewQuality(
    slides: GeneratedSlide[],
    outline: PresentationOutline,
    presentationId?: string,
  ): Promise<AIGenerationResult<QualityReview>>;

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * Estimates token usage and cost for a generation request.
   *
   * @param input - Input parameters
   * @returns Estimated tokens and cost in USD
   */
  estimateCost(
    input: OutlineGenerationInput | SlideContentGenerationInput,
  ): Promise<{
    estimatedTokens: number;
    estimatedCost: number;
  }>;

  /**
   * Validates generated markdown for Slidev compatibility.
   *
   * @param markdown - Generated markdown content
   * @returns Validation result with any errors
   */
  validateMarkdown(markdown: string): {
    isValid: boolean;
    errors: string[];
  };
}
