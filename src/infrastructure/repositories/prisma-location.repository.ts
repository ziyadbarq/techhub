/**
 * Prisma Location Repository Implementation
 * Includes hierarchical query and geolocation support
 */

import { inject, injectable } from "inversify";
import type { PrismaClient, $Enums } from "@/generated/prisma/server";
import type { Location as PrismaLocation } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { Location } from "@/core/domain/entities/location.entity";
import type { ILocationRepository } from "@/core/repositories/location.repository.interface";
import type { LocationType } from "@/core/domain/value-objects/foundation-enums";
import { createRepositoryLogger } from "./repository-logger";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaLocationRepository implements ILocationRepository {
  private readonly logger = createRepositoryLogger("LocationRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(location: Location): Promise<Location> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.location.create({
        data: {
          code: location.code,
          name: location.name,
          description: location.description,
          locationType: location.locationType as $Enums.LocationType,
          parentId: location.parentId,
          address: location.address,
          addressLine1: location.addressLine1,
          addressLine2: location.addressLine2,
          city: location.city,
          state: location.state,
          country: location.country,
          postalCode: location.postalCode,
          latitude: location.latitude,
          longitude: location.longitude,
          timeZone: location.timeZone,
          isActive: location.isActive,
          metadata: toJsonValue(location.metadata),
        },
      });

      this.logger.timed("create", "Location created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create location", error);
      throw error;
    }
  }

  async findById(id: string): Promise<Location | null> {
    const location = await this.prisma.location.findUnique({
      where: { id },
    });

    return location ? this.toDomain(location) : null;
  }

  async findByCode(code: string): Promise<Location | null> {
    const location = await this.prisma.location.findUnique({
      where: { code },
    });

    return location ? this.toDomain(location) : null;
  }

  async findByCodes(codes: string[]): Promise<Location[]> {
    if (codes.length === 0) return [];

    const timer = this.logger.startTimer();

    try {
      // Filter out empty/null values and normalize to uppercase
      const validCodes = codes
        .filter((c) => c !== null && c !== undefined && c.trim() !== "")
        .map((c) => c.toUpperCase().trim());

      if (validCodes.length === 0) return [];

      const locations = await this.prisma.location.findMany({
        where: { code: { in: validCodes } },
      });

      this.logger.timed("findByCodes", "Locations fetched by codes", timer(), {
        requestedCount: validCodes.length,
        foundCount: locations.length,
      });

      return locations.map((l: PrismaLocation) => this.toDomain(l));
    } catch (error) {
      this.logger.error(
        "findByCodes",
        "Failed to fetch locations by codes",
        error,
      );
      throw error;
    }
  }

  async findRoots(): Promise<Location[]> {
    const locations = await this.prisma.location.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
    });

    return locations.map((l: PrismaLocation) => this.toDomain(l));
  }

  async findChildren(parentId: string): Promise<Location[]> {
    const locations = await this.prisma.location.findMany({
      where: { parentId },
      orderBy: { name: "asc" },
    });

    return locations.map((l: PrismaLocation) => this.toDomain(l));
  }

  async findParent(id: string): Promise<Location | null> {
    const location = await this.prisma.location.findUnique({
      where: { id },
      select: { parent: true },
    });

    return location?.parent ? this.toDomain(location.parent) : null;
  }

  async findAncestors(id: string): Promise<Location[]> {
    // Use recursive CTE to find all ancestors
    const ancestors = await this.prisma.$queryRaw<PrismaLocation[]>`
      WITH RECURSIVE ancestors AS (
        SELECT *
        FROM "locations"
        WHERE id = ${id}

        UNION ALL

        SELECT l.*
        FROM "locations" l
        INNER JOIN ancestors a ON l.id = a."parentId"
      )
      SELECT * FROM ancestors
      WHERE id != ${id}
      ORDER BY name ASC
    `;

    return ancestors.map((a: PrismaLocation) => this.toDomain(a));
  }

  async findDescendants(id: string): Promise<Location[]> {
    // Use recursive CTE to find all descendants
    const descendants = await this.prisma.$queryRaw<PrismaLocation[]>`
      WITH RECURSIVE descendants AS (
        SELECT *
        FROM "locations"
        WHERE id = ${id}

        UNION ALL

        SELECT l.*
        FROM "locations" l
        INNER JOIN descendants d ON l."parentId" = d.id
      )
      SELECT * FROM descendants
      WHERE id != ${id}
      ORDER BY name ASC
    `;

    return descendants.map((d: PrismaLocation) => this.toDomain(d));
  }

  async findSiblings(id: string): Promise<Location[]> {
    const location = await this.prisma.location.findUnique({
      where: { id },
      select: { parentId: true },
    });

    if (!location) return [];

    const siblings = await this.prisma.location.findMany({
      where: {
        parentId: location.parentId,
        id: { not: id },
      },
      orderBy: { name: "asc" },
    });

    return siblings.map((s: PrismaLocation) => this.toDomain(s));
  }

  async findByType(locationType: string): Promise<Location[]> {
    const locations = await this.prisma.location.findMany({
      where: { locationType: locationType as $Enums.LocationType },
      orderBy: { name: "asc" },
    });

    return locations.map((l: PrismaLocation) => this.toDomain(l));
  }

  async findByCity(city: string): Promise<Location[]> {
    const locations = await this.prisma.location.findMany({
      where: { city: { equals: city, mode: "insensitive" } },
      orderBy: { name: "asc" },
    });

    return locations.map((l: PrismaLocation) => this.toDomain(l));
  }

  async findByCountry(country: string): Promise<Location[]> {
    const locations = await this.prisma.location.findMany({
      where: { country: { equals: country, mode: "insensitive" } },
      orderBy: { name: "asc" },
    });

    return locations.map((l: PrismaLocation) => this.toDomain(l));
  }

  async findWithCoordinates(): Promise<Location[]> {
    const locations = await this.prisma.location.findMany({
      where: {
        AND: [{ latitude: { not: null } }, { longitude: { not: null } }],
      },
      orderBy: { name: "asc" },
    });

    return locations.map((l: PrismaLocation) => this.toDomain(l));
  }

  async findNearCoordinates(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<Location[]> {
    // Haversine formula for distance calculation in PostgreSQL
    // This is an approximation; for production consider PostGIS
    const locations = await this.prisma.$queryRaw<PrismaLocation[]>`
      SELECT *
      FROM "locations"
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        AND (
          6371 * acos(
            cos(radians(${latitude})) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(${longitude})) +
            sin(radians(${latitude})) * sin(radians(latitude))
          )
        ) <= ${radiusKm}
      ORDER BY name ASC
    `;

    return locations.map((l: PrismaLocation) => this.toDomain(l));
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "name" | "code" | "locationType" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<Location[]> {
    const locations = await this.prisma.location.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy
        ? { [options.orderBy]: options.order ?? "asc" }
        : { createdAt: "desc" },
    });

    return locations.map((l: PrismaLocation) => this.toDomain(l));
  }

  async search(
    query: string,
    options?: { skip?: number; take?: number; locationType?: string },
  ): Promise<Location[]> {
    const locations = await this.prisma.location.findMany({
      where: {
        ...(options?.locationType && {
          locationType: options.locationType as $Enums.LocationType,
        }),
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { code: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
          { country: { contains: query, mode: "insensitive" } },
        ],
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { name: "asc" },
    });

    return locations.map((l: PrismaLocation) => this.toDomain(l));
  }

  async count(): Promise<number> {
    return await this.prisma.location.count();
  }

  async countChildren(parentId: string): Promise<number> {
    return await this.prisma.location.count({
      where: { parentId },
    });
  }

  async update(location: Location): Promise<Location> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.location.update({
        where: { id: location.id },
        data: {
          code: location.code,
          name: location.name,
          description: location.description,
          locationType: location.locationType,
          parentId: location.parentId,
          address: location.address,
          addressLine1: location.addressLine1,
          addressLine2: location.addressLine2,
          city: location.city,
          state: location.state,
          country: location.country,
          postalCode: location.postalCode,
          latitude: location.latitude,
          longitude: location.longitude,
          timeZone: location.timeZone,
          isActive: location.isActive,
          metadata: toJsonValue(location.metadata),
          updatedAt: location.updatedAt,
        },
      });

      this.logger.timed("update", "Location updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update location", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.location.delete({
        where: { id },
      });

      this.logger.timed("delete", "Location deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete location", error);
      throw error;
    }
  }

  async hasChildren(id: string): Promise<boolean> {
    const count = await this.prisma.location.count({
      where: { parentId: id },
    });

    return count > 0;
  }

  async hasConfigurationItems(id: string): Promise<boolean> {
    const count = await this.prisma.configurationItem.count({
      where: { locationId: id },
    });

    return count > 0;
  }

  async hasAssets(id: string): Promise<boolean> {
    const count = await this.prisma.asset.count({
      where: { currentStockLocationId: id },
    });

    return count > 0;
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const location = await this.prisma.location.findUnique({
      where: { code },
      select: { id: true },
    });

    if (!location) return false;
    if (excludeId && location.id === excludeId) return false;

    return true;
  }

  private toDomain(prismaLocation: PrismaLocation): Location {
    return Location.reconstitute({
      id: prismaLocation.id,
      code: prismaLocation.code,
      name: prismaLocation.name,
      description: prismaLocation.description,
      locationType: prismaLocation.locationType as LocationType,
      parentId: prismaLocation.parentId,
      address: prismaLocation.address,
      addressLine1: prismaLocation.addressLine1,
      addressLine2: prismaLocation.addressLine2,
      city: prismaLocation.city,
      state: prismaLocation.state,
      country: prismaLocation.country,
      postalCode: prismaLocation.postalCode,
      latitude: prismaLocation.latitude
        ? Number(prismaLocation.latitude)
        : null,
      longitude: prismaLocation.longitude
        ? Number(prismaLocation.longitude)
        : null,
      timeZone: prismaLocation.timeZone,
      isActive: prismaLocation.isActive,
      metadata: fromJsonValue<Record<string, unknown>>(prismaLocation.metadata),
      createdAt: prismaLocation.createdAt,
      updatedAt: prismaLocation.updatedAt,
    });
  }
}
