/**
 * Location Presenter
 * Transforms Location domain entities into DTOs for the UI layer
 */

import type { Location } from "@/core/domain/entities/location.entity";
import type { LocationType } from "@/core/domain/value-objects/foundation-enums";

export interface LocationDTO {
  id: string;
  name: string;
  code: string;
  description: string | null;
  locationType: LocationType;
  parentId: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export function presentLocation(location: Location): LocationDTO {
  return {
    id: location.id,
    name: location.name,
    code: location.code,
    description: location.description,
    locationType: location.locationType,
    parentId: location.parentId,
    address: location.address,
    city: location.city,
    state: location.state,
    country: location.country,
    postalCode: location.postalCode,
    latitude: location.latitude ?? null,
    longitude: location.longitude ?? null,
    isActive: location.isActive,
    metadata: location.metadata,
    createdAt: location.createdAt.toISOString(),
    updatedAt: location.updatedAt.toISOString(),
  };
}

export function presentLocations(locations: Location[]): LocationDTO[] {
  return locations.map(presentLocation);
}
