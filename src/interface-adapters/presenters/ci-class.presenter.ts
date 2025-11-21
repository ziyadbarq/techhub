/**
 * CI Class Presenter
 * Transforms CI Class entities to DTOs for the presentation layer
 */

import type { CIClass } from "@/core/domain/entities/ci-class.entity";
import type { EnvironmentEnum } from "@/core/domain/entities/configuration-item.entity";

export interface CIClassDTO {
  id: string;
  name: string;
  code: string;
  parentClassId: string | null;
  description: string | null;
  lifecycleModelId: string | null;
  defaultCriticality: string | null;
  defaultEnvironment: EnvironmentEnum | null;
  isDiscoverable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CIClassPresenter {
  static toDTO(ciClass: CIClass): CIClassDTO {
    return {
      id: ciClass.id,
      name: ciClass.name,
      code: ciClass.code,
      parentClassId: ciClass.parentClassId,
      description: ciClass.description,
      lifecycleModelId: ciClass.lifecycleModelId,
      defaultCriticality: ciClass.defaultCriticality,
      defaultEnvironment: ciClass.defaultEnvironment,
      isDiscoverable: ciClass.isDiscoverable,
      createdAt: ciClass.createdAt,
      updatedAt: ciClass.updatedAt,
    };
  }

  static toDTOList(ciClasses: CIClass[]): CIClassDTO[] {
    return ciClasses.map((ciClass) => this.toDTO(ciClass));
  }
}
