/**
 * Prisma RelationshipTypeScope Repository Implementation
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";
import type { IRelationshipTypeScopeRepository } from "@/core/repositories/relationship-type-scope.repository.interface";
import { RelationshipTypeScope } from "@/core/domain/entities/relationship-type-scope.entity";
import type { RelationshipTypeScope as PrismaRelationshipTypeScope } from "@/generated/prisma";

@injectable()
export class PrismaRelationshipTypeScopeRepository implements IRelationshipTypeScopeRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}
  async create(scope: RelationshipTypeScope): Promise<RelationshipTypeScope> {
    const created = await this.prisma.relationshipTypeScope.create({
      data: {
        relationshipTypeId: scope.relationshipTypeId,
        fromCiClassId: scope.fromCiClassId,
        toCiClassId: scope.toCiClassId,
        note: scope.note,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<RelationshipTypeScope | null> {
    const scope = await this.prisma.relationshipTypeScope.findUnique({
      where: { id },
    });

    return scope ? this.toDomain(scope) : null;
  }

  async findByRelationshipTypeId(
    relationshipTypeId: string,
  ): Promise<RelationshipTypeScope[]> {
    const scopes = await this.prisma.relationshipTypeScope.findMany({
      where: { relationshipTypeId },
      orderBy: [{ fromCiClassId: "asc" }, { toCiClassId: "asc" }],
    });

    return scopes.map((s) => this.toDomain(s));
  }

  async findByFromCiClassId(
    fromCiClassId: string,
  ): Promise<RelationshipTypeScope[]> {
    const scopes = await this.prisma.relationshipTypeScope.findMany({
      where: { fromCiClassId },
      orderBy: { relationshipTypeId: "asc" },
    });

    return scopes.map((s) => this.toDomain(s));
  }

  async findByToCiClassId(
    toCiClassId: string,
  ): Promise<RelationshipTypeScope[]> {
    const scopes = await this.prisma.relationshipTypeScope.findMany({
      where: { toCiClassId },
      orderBy: { relationshipTypeId: "asc" },
    });

    return scopes.map((s) => this.toDomain(s));
  }

  async findByScope(
    relationshipTypeId: string,
    fromCiClassId: string,
    toCiClassId: string,
  ): Promise<RelationshipTypeScope | null> {
    const scope = await this.prisma.relationshipTypeScope.findUnique({
      where: {
        relationshipTypeId_fromCiClassId_toCiClassId: {
          relationshipTypeId,
          fromCiClassId,
          toCiClassId,
        },
      },
    });

    return scope ? this.toDomain(scope) : null;
  }

  async findAll(): Promise<RelationshipTypeScope[]> {
    const scopes = await this.prisma.relationshipTypeScope.findMany({
      orderBy: [
        { relationshipTypeId: "asc" },
        { fromCiClassId: "asc" },
        { toCiClassId: "asc" },
      ],
    });

    return scopes.map((s) => this.toDomain(s));
  }

  async update(scope: RelationshipTypeScope): Promise<RelationshipTypeScope> {
    const updated = await this.prisma.relationshipTypeScope.update({
      where: { id: scope.id },
      data: {
        note: scope.note,
        updatedAt: scope.updatedAt,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.relationshipTypeScope.delete({
      where: { id },
    });
  }

  async exists(
    relationshipTypeId: string,
    fromCiClassId: string,
    toCiClassId: string,
  ): Promise<boolean> {
    const count = await this.prisma.relationshipTypeScope.count({
      where: {
        relationshipTypeId,
        fromCiClassId,
        toCiClassId,
      },
    });

    return count > 0;
  }

  async countByRelationshipTypeId(relationshipTypeId: string): Promise<number> {
    return await this.prisma.relationshipTypeScope.count({
      where: { relationshipTypeId },
    });
  }

  private toDomain(
    prismaScope: PrismaRelationshipTypeScope,
  ): RelationshipTypeScope {
    return RelationshipTypeScope.reconstitute({
      id: prismaScope.id,
      relationshipTypeId: prismaScope.relationshipTypeId,
      fromCiClassId: prismaScope.fromCiClassId,
      toCiClassId: prismaScope.toCiClassId,
      note: prismaScope.note,
      createdAt: prismaScope.createdAt,
      updatedAt: prismaScope.updatedAt,
    });
  }
}
