/**
 * OpenAI Prompt Builders
 *
 * Extracted from openai-content-generator.service.ts for better separation of concerns
 * Handles all prompt construction logic for different AI operations
 */

import type {
  OutlineGenerationInput,
  SlideContentGenerationInput,
  SlideRefinementInput,
  PresentationOutline,
  ClickAnimation,
} from "@/core/services";

/**
 * Build prompt for outline generation
 * Supports both single and multiple outline variations
 */
export function buildOutlinePrompt(
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

/**
 * Build prompt for slide content generation
 * Includes detailed instructions for Slidev markdown and progressive disclosure
 */
export function buildSlideContentPrompt(
  input: SlideContentGenerationInput,
): string {
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

/**
 * Build prompt for slide content refinement
 * Maps refinement instructions to detailed prompts
 */
export function buildRefinementPrompt(input: SlideRefinementInput): string {
  const instructionMap: Record<SlideRefinementInput["instruction"], string> = {
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

/**
 * Build prompt for theme recommendation
 */
export function buildThemeRecommendationPrompt(
  outline: PresentationOutline,
  availableThemes: string[],
): string {
  return `Based on this presentation outline, recommend the best theme.

Presentation: "${outline.metadata.title}"
Audience: ${outline.metadata.audience}
Purpose: ${outline.metadata.purpose}
Slide count: ${outline.slides.length}

Available themes: ${availableThemes.join(", ")}

Consider:
- Professional tone for business presentations
- Creative themes for innovative topics
- Clean, minimal themes for technical content`;
}

/**
 * Build prompt for quality review
 */
export function buildQualityReviewPrompt(
  slides: { slideNumber: number; markdown: string }[],
  outline: PresentationOutline,
): string {
  return `Review the quality of these generated slides.

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
}

/**
 * Build prompt for slide variations
 */
export function buildSlideVariationsPrompt(
  slideContent: string,
  variationCount: number,
): string {
  return `Generate ${variationCount} different variations of this slide content.
Maintain the same core message but vary the wording, structure, and presentation style.

Current slide:
${slideContent}`;
}
