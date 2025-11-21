/**
 * Lifecycle Model Presenter
 * Transforms Lifecycle Model domain entities into DTOs for the UI layer
 */

import type { LifecycleModel } from "@/core/domain/entities/lifecycle-model.entity";

export interface LifecycleModelDTO {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export function presentLifecycleModel(
  model: LifecycleModel,
): LifecycleModelDTO {
  return {
    id: model.id,
    name: model.name,
    description: model.description,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
}

export function presentLifecycleModels(
  models: LifecycleModel[],
): LifecycleModelDTO[] {
  return models.map(presentLifecycleModel);
}
