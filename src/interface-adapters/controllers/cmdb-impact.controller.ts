"use server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { handleControllerError } from "./error-handler";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { ActionResponse } from "./types";
import type {
  AnalyzeCIImpactUseCase,
  CIImpactAnalysisResult,
} from "@/core/use-cases/cmdb/impact-analysis/analyze-ci-impact.use-case";
import type {
  AnalyzeUpstreamDependenciesUseCase,
  UpstreamAnalysisResult,
} from "@/core/use-cases/cmdb/impact-analysis/analyze-upstream-dependencies.use-case";

/**
 * Analyze downstream impact — "What breaks if this CI goes down?"
 */
export async function analyzeCIImpactAction(
  ciId: string,
  maxDepth?: number,
  environmentFilter?: string,
): Promise<ActionResponse<CIImpactAnalysisResult>> {
  try {
    await requirePermission(PERMISSIONS.CONFIGURATION_ITEMS_VIEW);

    const container = getContainer();
    const useCase = container.get<AnalyzeCIImpactUseCase>(
      DI_TOKENS.AnalyzeCIImpactUseCase,
    );

    const result = await useCase.execute({
      ciId,
      maxDepth,
      environmentFilter,
    });

    return { success: true, data: result };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "analyzeCIImpactAction" },
      "Failed to analyze CI impact",
    );
  }
}

/**
 * Analyze upstream dependencies — "What does this CI depend on?"
 */
export async function analyzeUpstreamDependenciesAction(
  ciId: string,
  maxDepth?: number,
): Promise<ActionResponse<UpstreamAnalysisResult>> {
  try {
    await requirePermission(PERMISSIONS.CONFIGURATION_ITEMS_VIEW);

    const container = getContainer();
    const useCase = container.get<AnalyzeUpstreamDependenciesUseCase>(
      DI_TOKENS.AnalyzeUpstreamDependenciesUseCase,
    );

    const result = await useCase.execute({
      ciId,
      maxDepth,
    });

    return { success: true, data: result };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "analyzeUpstreamDependenciesAction" },
      "Failed to analyze upstream dependencies",
    );
  }
}
