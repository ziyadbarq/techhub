/**
 * Prisma Relationship Type Repository Implementation
 */

import { injectable, inject } from "inversify";
import type {
  PrismaClient,
  RelationshipType as PrismaRelationshipType,
} from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IRelationshipTypeRepository } from "@/core/repositories/relationship-type.repository.interface";
import {
  RelationshipType,
  type RelationshipDirection,
} from "@/core/domain/entities/relationship-type.entity";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaRelationshipTypeRepository
  implements IRelationshipTypeRepository
{
  private readonly logger = createRepositoryLogger(
    "RelationshipTypeRepository",
  );

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(type: RelationshipType): Promise<RelationshipType> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.relationshipType.create({
        data: {
          name: type.name,
          code: type.code,
          description: type.description,
          direction: type.direction,
          isImpacting: type.impacting,
        },
      });

      this.logger.timed("create", "Relationship Type created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create relationship type", error);
      throw error;
    }
  }

  async findById(id: string): Promise<RelationshipType | null> {
    const type = await this.prisma.relationshipType.findUnique({
      where: { id },
    });

    return type ? this.toDomain(type) : null;
  }

  async findAll(): Promise<RelationshipType[]> {
    const types = await this.prisma.relationshipType.findMany({
      orderBy: { name: "asc" },
    });

    return types.map((t) => this.toDomain(t));
  }

  async findByCode(code: string): Promise<RelationshipType | null> {
    const type = await this.prisma.relationshipType.findUnique({
      where: { code: code.toUpperCase() },
    });

    return type ? this.toDomain(type) : null;
  }

  async findBidirectional(): Promise<RelationshipType[]> {
    const types = await this.prisma.relationshipType.findMany({
      where: { direction: "BIDIRECTIONAL" },
      orderBy: { name: "asc" },
    });

    return types.map((t) => this.toDomain(t));
  }

  async findUnidirectional(): Promise<RelationshipType[]> {
    const types = await this.prisma.relationshipType.findMany({
      where: { direction: "UNIDIRECTIONAL" },
      orderBy: { name: "asc" },
    });

    return types.map((t) => this.toDomain(t));
  }

  async findImpacting(): Promise<RelationshipType[]> {
    const types = await this.prisma.relationshipType.findMany({
      where: { isImpacting: true },
      orderBy: { name: "asc" },
    });

    return types.map((t) => this.toDomain(t));
  }

  async update(type: RelationshipType): Promise<RelationshipType> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.relationshipType.update({
        where: { id: type.id },
        data: {
          name: type.name,
          description: type.description,
          direction: type.direction,
          isImpacting: type.impacting,
          updatedAt: type.updatedAt,
        },
      });

      this.logger.timed("update", "Relationship Type updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update relationship type", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.relationshipType.delete({
        where: { id },
      });

      this.logger.timed("delete", "Relationship Type deleted", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete relationship type", error);
      throw error;
    }
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.prisma.relationshipType.count({
      where: { code: code.toUpperCase() },
    });

    return count > 0;
  }

  /**
   * Convert Prisma model to domain entity
   */
  private toDomain(prismaType: PrismaRelationshipType): RelationshipType {
    return RelationshipType.reconstitute({
      id: prismaType.id,
      name: prismaType.name,
      code: prismaType.code,
      description: prismaType.description,
      direction: prismaType.direction as RelationshipDirection,
      isImpacting: prismaType.isImpacting,
      createdAt: prismaType.createdAt,
      updatedAt: prismaType.updatedAt,
    });
  }
}
