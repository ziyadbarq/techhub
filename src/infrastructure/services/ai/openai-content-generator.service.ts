/**
 * OpenAI Content Generator Service Implementation
 *
 * Implements AI-powered presentation generation using GPT-5 family models.
 * Leverages Structured Outputs and Extended Prompt Caching for reliability and cost efficiency.
 */

import { injectable, inject } from "inversify";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { env } from "@/infrastructure/config/env";
import type {
  IAIContentGeneratorService,
  AIGenerationResult,
  OutlineGenerationInput,
  PresentationOutline,
  SlideContentGenerationInput,
  GeneratedSlide,
  SlideRefinementInput,
  ThemeRecommendation,
  QualityReview,
  ClickAnimation,
} from "@/core/services";
import {
  PresentationOutlineSchema,
  OutlineVariationsSchema,
  GeneratedSlideSchema,
  ThemeRecommendationSchema,
  QualityReviewSchema,
  RefinedSlideSchema,
  validateSlidevMarkdown,
  calculateCost,
  estimateTokens,
} from "./schemas/structured-output.schemas";
import { convertToTokenUsage, type TokenUsage } from "./pricing.config";
import { categorizeOpenAIError } from "@/core/domain/errors/ai.errors";
import { retryWithBackoff } from "./retry-helper";
import { DI_TOKENS } from "@/di/types";
import type {
  IAIPromptManagerService,
  IAIDebugTraceService,
} from "@/core/services";
import { PromptPurpose } from "@/generated/prisma";
import { serviceLogger } from "@/lib/logger";
/**
 * Model configuration for different AI operations
 */
const AI_MODELS = {
  OUTLINE: "gpt-5-mini", // Fast & cheap for outlines
  CONTENT: "gpt-5.1", // Adaptive reasoning for quality content
  REVIEW: "gpt-5", // Balanced for quality checks
  REFINEMENT: "gpt-5-mini", // Quick refinements
} as const;

/**
 * OpenAI-based implementation of AI Content Generator
 */
@injectable()
export class OpenAIContentGeneratorService
  implements IAIContentGeneratorService
{
  private client: OpenAI;

  constructor(
    @inject(DI_TOKENS.IAIPromptManagerService)
    private promptManager: IAIPromptManagerService,
    @inject(DI_TOKENS.IAIDebugTraceService)
    private debugTrace: IAIDebugTraceService,
  ) {
    // Initialize OpenAI client
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  // ========================================
  // Outline Generation
  // ========================================

  async generateOutlineVariations(
    input: OutlineGenerationInput,
    variationCount: number = 2,
    presentationId?: string,
  ): Promise<AIGenerationResult<PresentationOutline[]>> {
    const fnName = "OpenAIContentGeneratorService.generateOutlineVariations";
    const timer = serviceLogger.startTimer();

    serviceLogger.info(fnName, "🤖 Starting outline variation generation", {
      model: AI_MODELS.OUTLINE,
      variationCount,
      slideCount: input.slideCount,
      audience: input.audience,
      purpose: input.purpose,
      hasContext: !!input.context,
      presentationId: presentationId ?? "none",
    });

    // Start debug session if enabled and presentation ID provided
    if (presentationId && this.debugTrace.isEnabled()) {
      this.debugTrace.startSession(
        presentationId,
        "generateOutlineVariations",
        {
          variationCount,
          slideCount: input.slideCount,
          audience: input.audience,
          purpose: input.purpose,
        },
      );
    }

    try {
      // Get cached system prompt (enables extended caching)
      serviceLogger.debug(fnName, "Fetching cached system prompt");
      const systemPrompt = await this.promptManager.getSystemPrompt(
        PromptPurpose.OUTLINE,
      );

      // Prepare user prompt
      serviceLogger.debug(fnName, "Building user prompt");
      const userPrompt = this.buildOutlinePrompt(input, variationCount);
      serviceLogger.debug(fnName, "Prompt built", {
        promptLength: userPrompt.length,
        systemPromptLength: systemPrompt.length,
      });

      // Log prompts to debug trace
      if (presentationId && this.debugTrace.isEnabled()) {
        await this.debugTrace.logPrompt(
          "outline",
          systemPrompt,
          userPrompt,
          true,
        );
      }

      // Log request parameters
      if (presentationId && this.debugTrace.isEnabled()) {
        this.debugTrace.logRequest({
          model: AI_MODELS.OUTLINE,
          response_format: "json_schema",
        });
      }

      // Call GPT-5-mini with Structured Outputs and Extended Caching
      serviceLogger.debug(fnName, "Calling OpenAI API with retry logic");
      const apiTimer = serviceLogger.startTimer();
      const completion = await this.callOpenAIWithRetry(
        () =>
          this.client.chat.completions.create({
            model: AI_MODELS.OUTLINE,
            messages: this.buildCachedMessages(systemPrompt, userPrompt),
            response_format: zodResponseFormat(
              OutlineVariationsSchema,
              "outline_variations",
            ),
          }),
        "generateOutlineVariations",
      );
      const apiDuration = apiTimer();

      // Log response to debug trace
      if (presentationId && this.debugTrace.isEnabled()) {
        await this.debugTrace.logResponse("outline", completion, apiDuration);
      }

      // Log actual token usage
      const usage = completion.usage!;
      serviceLogger.timed(fnName, "OpenAI API call completed", apiDuration, {
        model: AI_MODELS.OUTLINE,
        totalTokens: usage.total_tokens,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
      });

      // Log cache performance
      this.logCachePerformance(fnName, usage);

      const content = completion.choices[0].message.content;

      if (!content) {
        serviceLogger.error(
          fnName,
          "No content returned from OpenAI",
          new Error("Failed to generate outline variations"),
        );
        throw new Error("Failed to generate outline variations");
      }

      serviceLogger.debug(fnName, "Parsing and validating response");
      const result = OutlineVariationsSchema.parse(JSON.parse(content));

      const duration = timer();
      serviceLogger.timed(fnName, "✅ Outline variations generated", duration, {
        variationCount: result.variations.length,
        model: AI_MODELS.OUTLINE,
        totalTokens: usage.total_tokens,
      });

      // End debug session successfully
      if (presentationId && this.debugTrace.isEnabled()) {
        await this.debugTrace.endSession("success");
        await this.debugTrace.writeArtifacts();
      }

      // Return with actual token usage
      return {
        data: result.variations,
        usage: convertToTokenUsage(usage),
      };
    } catch (error) {
      // Log error to debug trace
      if (presentationId && this.debugTrace.isEnabled()) {
        this.debugTrace.logError(
          error instanceof Error ? error : new Error(String(error)),
        );
        await this.debugTrace.endSession(
          "error",
          error instanceof Error ? error : undefined,
        );
        await this.debugTrace.writeArtifacts();
      }
      throw error;
    }
  }

  async generateOutline(
    input: OutlineGenerationInput,
  ): Promise<AIGenerationResult<PresentationOutline>> {
    const systemPrompt = await this.promptManager.getSystemPrompt(
      PromptPurpose.OUTLINE,
    );

    const userPrompt = this.buildOutlinePrompt(input, 1);

    const completion = await this.client.chat.completions.create({
      model: AI_MODELS.OUTLINE,
      messages: this.buildCachedMessages(systemPrompt, userPrompt),
      response_format: zodResponseFormat(
        PresentationOutlineSchema,
        "presentation_outline",
      ),
    });

    const content = completion.choices[0].message.content;

    if (!content) {
      throw new Error("Failed to generate outline");
    }

    const usage = completion.usage!;
    this.logCachePerformance(
      "OpenAIContentGeneratorService.generateOutline",
      usage,
    );

    return {
      data: PresentationOutlineSchema.parse(JSON.parse(content)),
      usage: convertToTokenUsage(usage),
    };
  }

  // ========================================
  // Slide Content Generation
  // ========================================

  async generateSlideContent(
    input: SlideContentGenerationInput,
    presentationId?: string,
    cachedSystemPrompt?: string, // Optional pre-fetched prompt for batch operations
  ): Promise<AIGenerationResult<GeneratedSlide>> {
    const fnName = "OpenAIContentGeneratorService.generateSlideContent";
    const timer = serviceLogger.startTimer();

    serviceLogger.debug(fnName, "Generating slide content", {
      model: AI_MODELS.CONTENT,
      slideNumber: input.outline.slideNumber,
      slideTitle: input.outline.title,
      layout: input.outline.layout,
      theme: input.theme.name,
      usingCachedPrompt: !!cachedSystemPrompt,
      presentationId: presentationId ?? "none",
    });

    // Use provided prompt or fetch from cache
    const systemPrompt =
      cachedSystemPrompt ||
      (await this.promptManager.getSystemPrompt(PromptPurpose.CONTENT));

    const userPrompt = this.buildSlideContentPrompt(input);

    // Log prompts to debug trace (only for non-batch operations to avoid duplication)
    if (presentationId && this.debugTrace.isEnabled() && !cachedSystemPrompt) {
      await this.debugTrace.logPrompt(
        `slide-${input.outline.slideNumber}`,
        systemPrompt,
        userPrompt,
        true,
      );
      this.debugTrace.logRequest({
        model: AI_MODELS.CONTENT,
        response_format: "json_schema",
      });
    }

    serviceLogger.debug(
      fnName,
      "Calling OpenAI API for slide content with retry logic",
    );
    const apiTimer = serviceLogger.startTimer();
    const completion = await this.callOpenAIWithRetry(
      () =>
        this.client.chat.completions.create({
          model: AI_MODELS.CONTENT,
          messages: this.buildCachedMessages(systemPrompt, userPrompt),
          response_format: zodResponseFormat(
            GeneratedSlideSchema,
            "generated_slide",
          ),
        }),
      `generateSlideContent-${input.outline.slideNumber}`,
    );
    const apiDuration = apiTimer();

    const usage = completion.usage!;
    serviceLogger.debug(fnName, "OpenAI API call completed", {
      slideNumber: input.outline.slideNumber,
      totalTokens: usage.total_tokens,
      apiDuration,
    });

    // Log response to debug trace (only for non-batch operations)
    if (presentationId && this.debugTrace.isEnabled() && !cachedSystemPrompt) {
      await this.debugTrace.logResponse(
        `slide-${input.outline.slideNumber}`,
        completion,
        apiDuration,
      );
    }

    // Log cache performance
    this.logCachePerformance(fnName, usage);

    const content = completion.choices[0].message.content;

    if (!content) {
      serviceLogger.error(
        fnName,
        `No content for slide #${input.outline.slideNumber}`,
        new Error("Failed to generate slide content"),
      );
      throw new Error("Failed to generate slide content");
    }

    const result = GeneratedSlideSchema.parse(JSON.parse(content));

    // Note: Individual slide validation is skipped since slides are fragments
    // that will be compiled together. Validation happens on the final compiled markdown.

    const duration = timer();
    serviceLogger.debug(fnName, `✅ Slide #${result.slideNumber} generated`, {
      slideNumber: result.slideNumber,
      layout: result.layout,
      markdownLength: result.markdown.length,
      hasSpeakerNotes: !!result.speakerNotes,
      duration,
      tokensUsed: usage.total_tokens,
    });

    return {
      data: result,
      usage: convertToTokenUsage(usage),
    };
  }

  async generateMultipleSlides(
    inputs: SlideContentGenerationInput[],
    presentationId?: string,
  ): Promise<AIGenerationResult<GeneratedSlide[]>> {
    const fnName = "OpenAIContentGeneratorService.generateMultipleSlides";
    const timer = serviceLogger.startTimer();

    serviceLogger.info(fnName, "🎬 Generating multiple slides in parallel", {
      slideCount: inputs.length,
      model: AI_MODELS.CONTENT,
      presentationId: presentationId ?? "none",
    });

    // Start debug session for batch operation
    if (presentationId && this.debugTrace.isEnabled()) {
      this.debugTrace.startSession(presentationId, "generateMultipleSlides", {
        slideCount: inputs.length,
      });
    }

    try {
      // Fetch system prompt ONCE for all slides (optimization)
      serviceLogger.debug(fnName, "Fetching system prompt for batch operation");
      const systemPrompt = await this.promptManager.getSystemPrompt(
        PromptPurpose.CONTENT,
      );

      // Log batch prompt once to debug trace
      if (presentationId && this.debugTrace.isEnabled()) {
        await this.debugTrace.logPrompt(
          "slides-batch",
          systemPrompt,
          `Generating ${inputs.length} slides in parallel`,
          true,
        );
        this.debugTrace.logRequest({
          model: AI_MODELS.CONTENT,
          response_format: "json_schema",
        });
      }

      // Generate slides in parallel for efficiency, reusing the same prompt
      const promises = inputs.map((input) =>
        this.generateSlideContent(input, presentationId, systemPrompt),
      );

      const results = await Promise.all(promises);

      // Aggregate token usage from all slides
      const totalUsage: TokenUsage = results.reduce(
        (
          acc: TokenUsage,
          result: AIGenerationResult<GeneratedSlide>,
        ): TokenUsage => ({
          promptTokens: acc.promptTokens + result.usage.promptTokens,
          completionTokens:
            acc.completionTokens + result.usage.completionTokens,
          totalTokens: acc.totalTokens + result.usage.totalTokens,
          cachedTokens:
            (acc.cachedTokens || 0) + (result.usage.cachedTokens || 0),
        }),
        {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          cachedTokens: 0,
        },
      );

      const duration = timer();
      serviceLogger.timed(fnName, "✅ All slides generated", duration, {
        slideCount: results.length,
        avgTimePerSlide: Math.round(duration / results.length),
        totalTokens: totalUsage.totalTokens,
        cachedTokens: totalUsage.cachedTokens,
      });

      // Log aggregated response to debug trace
      if (presentationId && this.debugTrace.isEnabled()) {
        // Create synthetic response object with aggregated usage
        const aggregatedResponse = {
          usage: {
            prompt_tokens: totalUsage.promptTokens,
            completion_tokens: totalUsage.completionTokens,
            total_tokens: totalUsage.totalTokens,
            prompt_tokens_details: {
              cached_tokens: totalUsage.cachedTokens || 0,
            },
          },
          model: AI_MODELS.CONTENT,
          slides_generated: results.length,
        };
        await this.debugTrace.logResponse(
          "slides-batch",
          aggregatedResponse,
          duration,
        );
      }

      // End debug session successfully
      if (presentationId && this.debugTrace.isEnabled()) {
        await this.debugTrace.endSession("success");
        await this.debugTrace.writeArtifacts();
      }

      return {
        data: results.map((r: AIGenerationResult<GeneratedSlide>) => r.data),
        usage: totalUsage,
      };
    } catch (error) {
      // Log error to debug trace
      if (presentationId && this.debugTrace.isEnabled()) {
        this.debugTrace.logError(
          error instanceof Error ? error : new Error(String(error)),
        );
        await this.debugTrace.endSession(
          "error",
          error instanceof Error ? error : undefined,
        );
        await this.debugTrace.writeArtifacts();
      }
      throw error;
    }
  }

  // ========================================
  // Content Refinement
  // ========================================

  async refineSlideContent(
    input: SlideRefinementInput,
  ): Promise<AIGenerationResult<string>> {
    const fnName = "OpenAIContentGeneratorService.refineSlideContent";
    const timer = serviceLogger.startTimer();

    serviceLogger.info(fnName, "🔧 Refining slide content", {
      model: AI_MODELS.REFINEMENT,
      instruction: input.instruction,
      contentLength: input.currentContent.length,
      hasAdditionalContext: !!input.additionalContext,
    });

    const systemPrompt = await this.promptManager.getSystemPrompt(
      PromptPurpose.REFINEMENT,
    );

    const userPrompt = this.buildRefinementPrompt(input);

    serviceLogger.debug(
      fnName,
      "Calling OpenAI API for refinement with retry logic",
    );
    const apiTimer = serviceLogger.startTimer();
    const completion = await this.callOpenAIWithRetry(
      () =>
        this.client.chat.completions.create({
          model: AI_MODELS.REFINEMENT,
          messages: this.buildCachedMessages(systemPrompt, userPrompt),
          response_format: zodResponseFormat(
            RefinedSlideSchema,
            "refined_slide",
          ),
        }),
      "refineSlideContent",
    );
    const apiDuration = apiTimer();

    const usage = completion.usage!;
    serviceLogger.debug(fnName, "OpenAI API call completed", {
      totalTokens: usage.total_tokens,
      apiDuration,
    });

    this.logCachePerformance(fnName, usage);

    const content = completion.choices[0].message.content;

    if (!content) {
      serviceLogger.error(
        fnName,
        "No content returned from refinement",
        new Error("Failed to refine slide content"),
      );
      throw new Error("Failed to refine slide content");
    }

    const result = RefinedSlideSchema.parse(JSON.parse(content));

    const duration = timer();
    serviceLogger.timed(fnName, "✅ Slide content refined", duration, {
      instruction: input.instruction,
      originalLength: input.currentContent.length,
      refinedLength: result.refinedContent.length,
      tokensUsed: usage.total_tokens,
    });

    return {
      data: result.refinedContent,
      usage: convertToTokenUsage(usage),
    };
  }

  async generateSlideVariations(
    slideContent: string,
    variationCount: number = 3,
  ): Promise<AIGenerationResult<string[]>> {
    const systemPrompt = await this.promptManager.getSystemPrompt(
      PromptPurpose.CONTENT,
    );

    const userPrompt = `Generate ${variationCount} different variations of this slide content.
Maintain the same core message but vary the wording, structure, and presentation style.

Current slide:
${slideContent}`;

    const completion = await this.client.chat.completions.create({
      model: AI_MODELS.CONTENT,
      messages: this.buildCachedMessages(systemPrompt, userPrompt),
      temperature: 0.9, // High for diversity
      n: variationCount, // Generate multiple variations
    });

    const usage = completion.usage!;
    this.logCachePerformance(
      "OpenAIContentGeneratorService.generateSlideVariations",
      usage,
    );

    return {
      data: completion.choices.map((choice) => choice.message.content || ""),
      usage: convertToTokenUsage(usage),
    };
  }

  // ========================================
  // Theme Recommendations
  // ========================================

  async recommendTheme(
    outline: PresentationOutline,
    availableThemes: string[],
  ): Promise<AIGenerationResult<ThemeRecommendation>> {
    const fnName = "OpenAIContentGeneratorService.recommendTheme";
    const timer = serviceLogger.startTimer();

    serviceLogger.info(fnName, "🎨 Recommending theme", {
      model: AI_MODELS.REVIEW,
      presentationTitle: outline.metadata.title,
      audience: outline.metadata.audience,
      purpose: outline.metadata.purpose,
      slideCount: outline.slides.length,
      availableThemeCount: availableThemes.length,
      themes: availableThemes.join(", "),
    });

    const systemPrompt = await this.promptManager.getSystemPrompt(
      PromptPurpose.THEME,
    );

    const userPrompt = `Based on this presentation outline, recommend the best theme.

Presentation: "${outline.metadata.title}"
Audience: ${outline.metadata.audience}
Purpose: ${outline.metadata.purpose}
Slide count: ${outline.slides.length}

Available themes: ${availableThemes.join(", ")}

Consider:
- Professional tone for business presentations
- Creative themes for innovative topics
- Clean, minimal themes for technical content`;

    serviceLogger.debug(
      fnName,
      "Calling OpenAI API for theme recommendation with retry logic",
    );
    const apiTimer = serviceLogger.startTimer();
    const completion = await this.callOpenAIWithRetry(
      () =>
        this.client.chat.completions.create({
          model: AI_MODELS.REVIEW,
          messages: this.buildCachedMessages(systemPrompt, userPrompt),
          response_format: zodResponseFormat(
            ThemeRecommendationSchema,
            "theme_recommendation",
          ),
        }),
      "recommendTheme",
    );
    const apiDuration = apiTimer();

    const usage = completion.usage!;
    serviceLogger.debug(fnName, "OpenAI API call completed", {
      totalTokens: usage.total_tokens,
      apiDuration,
    });

    this.logCachePerformance(fnName, usage);

    const content = completion.choices[0].message.content;

    if (!content) {
      serviceLogger.error(
        fnName,
        "No content returned from theme recommendation",
        new Error("Failed to recommend theme"),
      );
      throw new Error("Failed to recommend theme");
    }

    const result = ThemeRecommendationSchema.parse(JSON.parse(content));

    const duration = timer();
    serviceLogger.timed(fnName, "✅ Theme recommendation complete", duration, {
      recommendedTheme: result.recommendedThemeId,
      confidence: result.confidence,
      alternativeCount: result.alternativeThemes?.length || 0,
      tokensUsed: usage.total_tokens,
    });

    return {
      data: result,
      usage: convertToTokenUsage(usage),
    };
  }

  // ========================================
  // Quality Review
  // ========================================

  async reviewQuality(
    slides: GeneratedSlide[],
    outline: PresentationOutline,
  ): Promise<AIGenerationResult<QualityReview>> {
    const systemPrompt = await this.promptManager.getSystemPrompt(
      PromptPurpose.REVIEW,
    );

    const userPrompt = `Review the quality of these generated slides.

Original outline: ${JSON.stringify(outline.metadata)}
Generated slides: ${slides.length}

Slides content:
${slides.map((s) => `Slide ${s.slideNumber}:\n${s.markdown}`).join("\n\n---\n\n")}

Check for:
1. Accuracy - Are facts correct?
2. Tone - Does it match the intended audience?
3. Structure - Is the flow logical?
4. Formatting - Is Slidev markdown valid?
5. Completeness - Does it cover the outline?`;

    const completion = await this.client.chat.completions.create({
      model: AI_MODELS.REVIEW,
      messages: this.buildCachedMessages(systemPrompt, userPrompt),
      response_format: zodResponseFormat(QualityReviewSchema, "quality_review"),
    });

    const content = completion.choices[0].message.content;

    if (!content) {
      throw new Error("Failed to review quality");
    }

    const usage = completion.usage!;
    this.logCachePerformance(
      "OpenAIContentGeneratorService.reviewQuality",
      usage,
    );

    return {
      data: QualityReviewSchema.parse(JSON.parse(content)),
      usage: convertToTokenUsage(usage),
    };
  }

  // ========================================
  // Utility Methods
  // ========================================

  async estimateCost(
    input: OutlineGenerationInput | SlideContentGenerationInput,
  ): Promise<{ estimatedTokens: number; estimatedCost: number }> {
    // Estimate input tokens
    const inputText = JSON.stringify(input);
    const inputTokens = estimateTokens(inputText);

    // Estimate output tokens based on operation type
    let outputTokens = 0;

    if ("prompt" in input) {
      // Outline generation
      const slideCount = input.slideCount || 10;
      outputTokens = slideCount * 150; // ~150 tokens per slide outline
    } else {
      // Slide content generation
      outputTokens = 300; // ~300 tokens per slide content
    }

    // Calculate cost (using gpt-5.1 as default)
    const cost = calculateCost(inputTokens, outputTokens, "gpt-5.1");

    return {
      estimatedTokens: inputTokens + outputTokens,
      estimatedCost: cost,
    };
  }

  validateMarkdown(markdown: string): { isValid: boolean; errors: string[] } {
    return validateSlidevMarkdown(markdown);
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Wrap OpenAI API calls with retry logic and error handling
   */
  private async callOpenAIWithRetry<T>(
    fn: () => Promise<T>,
    context: string,
  ): Promise<T> {
    try {
      return await retryWithBackoff(
        fn,
        {
          maxRetries: 3,
          baseDelay: 1000, // 1 second
          maxDelay: 30000, // 30 seconds
          backoffMultiplier: 2,
          useJitter: 0.1,
        },
        context,
      );
    } catch (error) {
      // Categorize the error for better handling
      const categorizedError = categorizeOpenAIError(error, { context });

      serviceLogger.error(
        "OpenAIContentGeneratorService",
        `Failed after retries: ${context}`,
        categorizedError,
        {
          errorCode: categorizedError.code,
          retryable: categorizedError.retryable,
        },
      );

      throw categorizedError;
    }
  }

  /**
   * Build messages with extended prompt caching enabled
   */
  private buildCachedMessages(
    systemPrompt: string,
    userPrompt: string,
  ): OpenAI.Chat.ChatCompletionMessageParam[] {
    return [
      {
        role: "system",
        content: systemPrompt,
        // Enable 24-hour extended caching (90% cost savings!)
        cache_control: { type: "ephemeral" },
      } as OpenAI.Chat.ChatCompletionMessageParam, // Cast entire object due to cache_control not in types
      {
        role: "user",
        content: userPrompt,
      },
    ];
  }

  /**
   * Log cache performance metrics
   */
  private logCachePerformance(
    fnName: string,
    usage: OpenAI.CompletionUsage | undefined,
  ): void {
    if (!usage?.prompt_tokens_details) return;

    const cached =
      (usage.prompt_tokens_details as { cached_tokens?: number })
        .cached_tokens || 0;
    const total = usage.prompt_tokens;

    if (cached > 0) {
      const cacheHitRate = ((cached / total) * 100).toFixed(2);
      serviceLogger.info(
        fnName,
        `🎯 Cache hit! ${cacheHitRate}% tokens cached`,
        {
          cachedTokens: cached,
          totalPromptTokens: total,
          cacheHitRate: `${cacheHitRate}%`,
          estimatedSavings: "~90% on cached tokens",
        },
      );
    }
  }

  private buildOutlinePrompt(
    input: OutlineGenerationInput,
    count: number,
  ): string {
    const slideCount = input.slideCount || 10;
    const audience = input.audience || "general";
    const purpose = input.purpose || "inform";
    const tone = input.tone || "professional";

    let prompt = `Create ${count === 1 ? "a" : count} presentation outline${count > 1 ? "s" : ""} based on this input:

Topic: ${input.prompt}
Audience: ${audience}
Purpose: ${purpose}
Tone: ${tone}
Target slide count: ${slideCount}
`;

    if (input.context) {
      prompt += `\nAdditional context:\n${input.context}\n`;
    }

    if (input.fileMetadata?.extractedText) {
      prompt += `\nDocument content:\n${input.fileMetadata.extractedText.substring(0, 5000)}\n`;
    }

    if (count > 1) {
      prompt += `\nGenerate ${count} different approaches to this presentation.
Vary the structure, flow, and emphasis while maintaining the core message.`;
    }

    return prompt;
  }

  private buildSlideContentPrompt(input: SlideContentGenerationInput): string {
    const slide = input.outline;

    let prompt = `Generate Slidev markdown content for this slide:

Slide #${slide.slideNumber}: "${slide.title}"
Required layout: ${slide.layout}
Key points:
${slide.contentPoints.map((p: string) => `- ${p}`).join("\n")}
`;

    if (slide.speakerNotes) {
      prompt += `\nSpeaker notes guidance: ${slide.speakerNotes}\n`;
    }

    if (slide.suggestedVisuals && slide.suggestedVisuals.length > 0) {
      prompt += `\nSuggested visuals: ${slide.suggestedVisuals.join(", ")}\n`;
    }

    if (slide.clickAnimations && slide.clickAnimations.length > 0) {
      prompt += `\nProgressive disclosure elements:\n`;
      slide.clickAnimations.forEach((anim: ClickAnimation) => {
        prompt += `- ${anim.element} (order: ${anim.order})\n`;
      });
    }

    prompt += `\nTheme: ${input.theme.name}

CRITICAL INSTRUCTIONS:
1. The "layout" field is PROVIDED SEPARATELY - you MUST set it to exactly: "${slide.layout}"
2. DO NOT include "layout:" in the markdown frontmatter - it will be added automatically
3. DO NOT include "theme:" in the markdown frontmatter - the theme is set globally for the entire presentation
4. DO NOT abbreviate layout names (e.g., "two" → "two-cols", "image" → "image-right")
5. MDC is ENABLED - you can use Vue components like <carbon:icon-name /> for icons
6. Wrap bullet points in <div v-click> tags for progressive disclosure
7. Add speaker notes in the speakerNotes field (separate from markdown)

Valid Slidev layouts: default, center, two-cols, statement, image-right, cover

PROGRESSIVE DISCLOSURE (v-click):
- Wrap each major bullet point in <div v-click>\n\n- Point\n\n</div>
- Use for sequential revelation of key information
- Helps maintain audience attention and pacing

BUILT-IN COMPONENTS:
Use Slidev's components when appropriate:
- Icons: <carbon:logo-github />, <mdi:heart />, <ph:code-bold />
- Arrows: <Arrow x1="10" y1="20" x2="100" y2="200" />
- Social: <Tweet id="..." />, <Youtube id="..." />

Generate the markdown field with:
- Optional frontmatter for slide-specific metadata (class, background, etc.) - but NO layout or theme fields
- Title (using # heading)
- Content with v-click wrapping for progressive disclosure
- Built-in components where appropriate
- Layout-specific regions if needed (::right:: for two-cols, ::left:: etc.)

Generate the speakerNotes field with:
- Contextual information not visible to audience
- Timing suggestions (e.g., "spend 2 minutes here")
- Key points to emphasize
- Presentation tips and transitions

Make the content engaging, dynamic, and appropriate for the slide's purpose.`;

    if (input.previousSlides && input.previousSlides.length > 0) {
      const lastSlide = input.previousSlides[input.previousSlides.length - 1];
      prompt += `\n\nPrevious slide context: "${lastSlide.markdown.substring(0, 200)}..."`;
    }

    return prompt;
  }

  private buildRefinementPrompt(input: SlideRefinementInput): string {
    const instructionMap: Record<SlideRefinementInput["instruction"], string> =
      {
        make_shorter:
          "Make this slide more concise. Remove unnecessary words while keeping key points.",
        make_longer: "Expand this slide with more details and examples.",
        change_tone:
          "Adjust the tone to be more " +
          (input.additionalContext || "professional") +
          ".",
        add_details:
          "Add more specific details and examples to support the points.",
        simplify: "Simplify the language for better understanding.",
        regenerate:
          "Regenerate this slide with a fresh approach while keeping the same message.",
      };

    const instruction: string = instructionMap[input.instruction];

    let prompt = `${instruction}

Current slide content:
${input.currentContent}
`;

    if (input.additionalContext) {
      prompt += `\nAdditional guidance: ${input.additionalContext}\n`;
    }

    return prompt;
  }
}
