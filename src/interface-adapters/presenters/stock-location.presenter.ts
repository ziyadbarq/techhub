/**
 * StockLocation Presenter
 * Transforms StockLocation domain entities to DTOs for presentation layer
 */

import type { StockLocation } from "@/core/domain/entities/stock-location.entity";

export interface StockLocationDTO {
  id: string;
  name: string;
  code: string;
  locationId: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export function presentStockLocation(
  stockLocation: StockLocation,
): StockLocationDTO {
  return {
    id: stockLocation.id,
    name: stockLocation.name,
    code: stockLocation.code,
    locationId: stockLocation.locationId,
    description: stockLocation.description,
    createdAt: stockLocation.createdAt.toISOString(),
    updatedAt: stockLocation.updatedAt.toISOString(),
  };
}

export function presentStockLocations(
  stockLocations: StockLocation[],
): StockLocationDTO[] {
  return stockLocations.map(presentStockLocation);
}
