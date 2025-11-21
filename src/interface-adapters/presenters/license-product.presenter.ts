/**
 * LicenseProduct Presenter
 * Transforms LicenseProduct entities to DTOs for the presentation layer
 */

import type {
  LicenseProduct,
  LicenseMetricType,
} from "@/core/domain/entities/license-product.entity";

export interface LicenseProductDTO {
  id: string;
  name: string;
  code: string;
  vendorId: string;
  metricType: LicenseMetricType;
  description: string | null;
  lifecycleModelId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class LicenseProductPresenter {
  static toDTO(licenseProduct: LicenseProduct): LicenseProductDTO {
    return {
      id: licenseProduct.id,
      name: licenseProduct.name,
      code: licenseProduct.code,
      vendorId: licenseProduct.vendorId,
      metricType: licenseProduct.metricType,
      description: licenseProduct.description,
      lifecycleModelId: licenseProduct.lifecycleModelId,
      createdAt: licenseProduct.createdAt,
      updatedAt: licenseProduct.updatedAt,
    };
  }

  static toDTOList(licenseProducts: LicenseProduct[]): LicenseProductDTO[] {
    return licenseProducts.map((licenseProduct) => this.toDTO(licenseProduct));
  }
}
