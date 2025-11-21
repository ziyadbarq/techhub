/**
 * Prisma CI Relationship Repository Implementation
 */

import { injectable, inject } from "inversify";
import type {
  PrismaClient,
  CIRelationship as PrismaCIRelationship,
} from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { ICIRelationshipRepository } from "@/core/repositories/ci-relationship.repository.interface";
import { CIRelationship } from "@/core/domain/entities/ci-relationship.entity";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaCIRelationshipRepository
  implements ICIRelationshipRepository
{
  private readonly logger = createRepositoryLogger("CIRelationshipRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(relationship: CIRelationship): Promise<CIRelationship> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.cIRelationship.create({
        data: {
          fromCiId: relationship.fromCiId,
          toCiId: relationship.toCiId,
          relationshipTypeId: relationship.relationshipTypeId,
          isActive: relationship.isActive,
          validFrom: relationship.validFrom,
          validTo: relationship.validTo,
          note: relationship.note,
        },
      });

      this.logger.timed("create", "CI Relationship created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create CI relationship", error);
      throw error;
    }
  }

  async findById(id: string): Promise<CIRelationship | null> {
    const relationship = await this.prisma.cIRelationship.findUnique({
      where: { id },
    });

    return relationship ? this.toDomain(relationship) : null;
  }

  async findAll(): Promise<CIRelationship[]> {
    const relationships = await this.prisma.cIRelationship.findMany({
      orderBy: { createdAt: "desc" },
    });

    return relationships.map((r) => this.toDomain(r));
  }

  async findByFromCi(fromCiId: string): Promise<CIRelationship[]> {
    const relationships = await this.prisma.cIRelationship.findMany({
      where: { fromCiId },
      orderBy: { createdAt: "desc" },
    });

    return relationships.map((r) => this.toDomain(r));
  }

  async findByToCi(toCiId: string): Promise<CIRelationship[]> {
    const relationships = await this.prisma.cIRelationship.findMany({
      where: { toCiId },
      orderBy: { createdAt: "desc" },
    });

    return relationships.map((r) => this.toDomain(r));
  }

  async findByCi(ciId: string): Promise<CIRelationship[]> {
    const relationships = await this.prisma.cIRelationship.findMany({
      where: {
        OR: [{ fromCiId: ciId }, { toCiId: ciId }],
      },
      orderBy: { createdAt: "desc" },
    });

    return relationships.map((r) => this.toDomain(r));
  }

  async findByRelationshipType(
    relationshipTypeId: string,
  ): Promise<CIRelationship[]> {
    const relationships = await this.prisma.cIRelationship.findMany({
      where: { relationshipTypeId },
      orderBy: { createdAt: "desc" },
    });

    return relationships.map((r) => this.toDomain(r));
  }

  async findActiveRelationships(): Promise<CIRelationship[]> {
    const relationships = await this.prisma.cIRelationship.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return relationships.map((r) => this.toDomain(r));
  }

  async findCurrentlyValidRelationships(): Promise<CIRelationship[]> {
    const now = new Date();

    const relationships = await this.prisma.cIRelationship.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        OR: [{ validTo: null }, { validTo: { gte: now } }],
      },
      orderBy: { createdAt: "desc" },
    });

    return relationships.map((r) => this.toDomain(r));
  }

  async findImpactingRelationships(ciId: string): Promise<CIRelationship[]> {
    const relationships = await this.prisma.cIRelationship.findMany({
      where: {
        toCiId: ciId,
        isActive: true,
        relationshipType: {
          isImpacting: true,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return relationships.map((r) => this.toDomain(r));
  }

  async findDependentRelationships(ciId: string): Promise<CIRelationship[]> {
    const relationships = await this.prisma.cIRelationship.findMany({
      where: {
        fromCiId: ciId,
        isActive: true,
        relationshipType: {
          isImpacting: true,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return relationships.map((r) => this.toDomain(r));
  }

  async update(relationship: CIRelationship): Promise<CIRelationship> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.cIRelationship.update({
        where: { id: relationship.id },
        data: {
          isActive: relationship.isActive,
          validTo: relationship.validTo,
          note: relationship.note,
          updatedAt: relationship.updatedAt,
        },
      });

      this.logger.timed("update", "CI Relationship updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update CI relationship", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.cIRelationship.delete({
        where: { id },
      });

      this.logger.timed("delete", "CI Relationship deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete CI relationship", error);
      throw error;
    }
  }

  async existsBetweenCis(
    fromCiId: string,
    toCiId: string,
    relationshipTypeId: string,
  ): Promise<boolean> {
    const count = await this.prisma.cIRelationship.count({
      where: {
        fromCiId,
        toCiId,
        relationshipTypeId,
        isActive: true,
      },
    });

    return count > 0;
  }

  /**
   * Convert Prisma model to domain entity
   */
  private toDomain(prismaRelationship: PrismaCIRelationship): CIRelationship {
    return CIRelationship.reconstitute({
      id: prismaRelationship.id,
      fromCiId: prismaRelationship.fromCiId,
      toCiId: prismaRelationship.toCiId,
      relationshipTypeId: prismaRelationship.relationshipTypeId,
      isActive: prismaRelationship.isActive,
      validFrom: prismaRelationship.validFrom,
      validTo: prismaRelationship.validTo,
      note: prismaRelationship.note,
      createdAt: prismaRelationship.createdAt,
      updatedAt: prismaRelationship.updatedAt,
    });
  }
}
