/**
 * Location Domain Entity
 * Hierarchical location structure: Country > City > Campus > Building > Floor > Room > Rack
 */

import type { LocationType } from "@/core/domain/value-objects/foundation-enums";

export interface LocationProps {
  id: string;
  parentId: string | null;
  name: string;
  code: string;
  description: string | null;
  locationType: LocationType;
  address: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  timeZone: string | null;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLocationProps {
  parentId?: string | null;
  name: string;
  code: string;
  description?: string | null;
  locationType: LocationType;
  address?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timeZone?: string | null;
  metadata?: Record<string, unknown> | null;
}

export class Location {
  private constructor(private props: LocationProps) {}

  /**
   * Factory method: Create a new location
   */
  static create(props: CreateLocationProps): Location {
    // Validation
    Location.validateName(props.name);
    Location.validateCode(props.code);
    if (props.latitude !== undefined && props.latitude !== null) {
      Location.validateLatitude(props.latitude);
    }
    if (props.longitude !== undefined && props.longitude !== null) {
      Location.validateLongitude(props.longitude);
    }

    const now = new Date();

    return new Location({
      id: "", // Will be set by repository
      parentId: props.parentId || null,
      name: props.name.trim(),
      code: props.code.trim().toUpperCase(),
      description: props.description?.trim() || null,
      locationType: props.locationType,
      address: props.address?.trim() || null,
      addressLine1: props.addressLine1?.trim() || null,
      addressLine2: props.addressLine2?.trim() || null,
      city: props.city?.trim() || null,
      state: props.state?.trim() || null,
      country: props.country?.trim() || null,
      postalCode: props.postalCode?.trim() || null,
      latitude: props.latitude ?? null,
      longitude: props.longitude ?? null,
      timeZone: props.timeZone?.trim() || null,
      isActive: true,
      metadata: props.metadata || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static reconstitute(props: LocationProps): Location {
    return new Location(props);
  }

  /**
   * Update location details
   */
  update(props: {
    name?: string;
    code?: string;
    description?: string | null;
    locationType?: LocationType;
    address?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postalCode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    timeZone?: string | null;
    metadata?: Record<string, unknown> | null;
  }): void {
    if (props.name !== undefined) {
      Location.validateName(props.name);
      this.props.name = props.name.trim();
    }

    if (props.code !== undefined) {
      Location.validateCode(props.code);
      this.props.code = props.code.trim().toUpperCase();
    }

    if (props.description !== undefined) {
      this.props.description = props.description?.trim() || null;
    }

    if (props.locationType !== undefined) {
      this.props.locationType = props.locationType;
    }

    if (props.address !== undefined) {
      this.props.address = props.address?.trim() || null;
    }

    if (props.addressLine1 !== undefined) {
      this.props.addressLine1 = props.addressLine1?.trim() || null;
    }

    if (props.addressLine2 !== undefined) {
      this.props.addressLine2 = props.addressLine2?.trim() || null;
    }

    if (props.city !== undefined) {
      this.props.city = props.city?.trim() || null;
    }

    if (props.state !== undefined) {
      this.props.state = props.state?.trim() || null;
    }

    if (props.country !== undefined) {
      this.props.country = props.country?.trim() || null;
    }

    if (props.postalCode !== undefined) {
      this.props.postalCode = props.postalCode?.trim() || null;
    }

    if (props.latitude !== undefined) {
      if (props.latitude !== null) {
        Location.validateLatitude(props.latitude);
      }
      this.props.latitude = props.latitude;
    }

    if (props.longitude !== undefined) {
      if (props.longitude !== null) {
        Location.validateLongitude(props.longitude);
      }
      this.props.longitude = props.longitude;
    }

    if (props.timeZone !== undefined) {
      this.props.timeZone = props.timeZone?.trim() || null;
    }

    if (props.metadata !== undefined) {
      this.props.metadata = props.metadata;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Move to a different parent location
   * Business rule: Cannot move to own child (circular reference)
   */
  moveTo(newParentId: string | null, childIds: string[]): void {
    // Cannot move to self
    if (newParentId === this.props.id) {
      throw new Error("Cannot move location to itself");
    }

    // Cannot move to own child (circular reference)
    if (newParentId && childIds.includes(newParentId)) {
      throw new Error(
        "Cannot move location to its own child (circular reference)",
      );
    }

    this.props.parentId = newParentId;
    this.props.updatedAt = new Date();
  }

  // Business Rules & Validation

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Location name cannot be empty");
    }

    if (name.trim().length < 2) {
      throw new Error("Location name must be at least 2 characters");
    }

    if (name.trim().length > 200) {
      throw new Error("Location name cannot exceed 200 characters");
    }
  }

  private static validateCode(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error("Location code cannot be empty");
    }

    if (code.trim().length < 2) {
      throw new Error("Location code must be at least 2 characters");
    }

    if (code.trim().length > 50) {
      throw new Error("Location code cannot exceed 50 characters");
    }

    // Must be alphanumeric, hyphens, underscores
    if (!/^[A-Z0-9\-_]+$/i.test(code.trim())) {
      throw new Error(
        "Location code can only contain letters, numbers, hyphens, and underscores",
      );
    }
  }

  private static validateLocationType(type: string): void {
    if (!type || type.trim().length === 0) {
      throw new Error("Location type cannot be empty");
    }

    if (type.trim().length > 50) {
      throw new Error("Location type cannot exceed 50 characters");
    }

    // Common location types
    const validTypes = [
      "Country",
      "City",
      "Campus",
      "Building",
      "Floor",
      "Room",
      "Rack",
      "DataCenter",
      "CloudRegion",
      "Physical",
      "Logical",
      "Zone",
      "Area",
    ];

    // Warn if not a standard type (but don't fail)
    if (!validTypes.includes(type.trim())) {
      // Allow custom types
    }
  }

  private static validateLatitude(lat: number): void {
    if (lat < -90 || lat > 90) {
      throw new Error("Latitude must be between -90 and 90 degrees");
    }
  }

  private static validateLongitude(lng: number): void {
    if (lng < -180 || lng > 180) {
      throw new Error("Longitude must be between -180 and 180 degrees");
    }
  }

  /**
   * Check if this is a root location (no parent)
   */
  isRoot(): boolean {
    return this.props.parentId === null;
  }

  /**
   * Check if has physical address
   */
  hasPhysicalAddress(): boolean {
    return !!(this.props.addressLine1 || this.props.city || this.props.country);
  }

  /**
   * Check if has coordinates
   */
  hasCoordinates(): boolean {
    return this.props.latitude !== null && this.props.longitude !== null;
  }

  /**
   * Check if can be deleted
   * Business rule: Cannot delete if has children, CIs, or assets
   */
  canBeDeleted(
    hasChildren: boolean,
    hasCIs: boolean,
    hasAssets: boolean,
  ): boolean {
    return !hasChildren && !hasCIs && !hasAssets;
  }

  /**
   * Get full address as string
   */
  getFullAddress(): string {
    const parts = [
      this.props.addressLine1,
      this.props.addressLine2,
      this.props.city,
      this.props.country,
    ].filter(Boolean);

    return parts.join(", ");
  }

  // Getters

  get id(): string {
    return this.props.id;
  }

  get parentId(): string | null {
    return this.props.parentId;
  }

  get name(): string {
    return this.props.name;
  }

  get code(): string {
    return this.props.code;
  }

  get description(): string | null {
    return this.props.description;
  }

  get locationType(): LocationType {
    return this.props.locationType;
  }

  get address(): string | null {
    return this.props.address;
  }

  get addressLine1(): string | null {
    return this.props.addressLine1;
  }

  get addressLine2(): string | null {
    return this.props.addressLine2;
  }

  get city(): string | null {
    return this.props.city;
  }

  get state(): string | null {
    return this.props.state;
  }

  get country(): string | null {
    return this.props.country;
  }

  get postalCode(): string | null {
    return this.props.postalCode;
  }

  get latitude(): number | null {
    return this.props.latitude;
  }

  get longitude(): number | null {
    return this.props.longitude;
  }

  get timeZone(): string | null {
    return this.props.timeZone;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Internal setters (for repository use)

  setId(id: string): void {
    if (this.props.id) {
      throw new Error("Cannot change location ID after it has been set");
    }
    this.props.id = id;
  }

  setUpdatedAt(date: Date): void {
    this.props.updatedAt = date;
  }

  /**
   * Convert to plain object for persistence
   */
  toObject(): LocationProps {
    return { ...this.props };
  }

  /**
   * Compare with another location
   */
  equals(other: Location): boolean {
    return this.props.id === other.id;
  }
}
