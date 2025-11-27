/**
 * Prisma Person Role Assignment Repository Implementation
 * Includes temporal query support
 */

import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import type { PersonRoleAssignment as PrismaPersonRoleAssignment } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { PersonRoleAssignment } from "@/core/domain/entities/person-role-assignment.entity";
import type { IPersonRoleAssignmentRepository } from "@/core/repositories/person-role-assignment.repository.interface";
import { createRepositoryLogger } from "./repository-logger";
import { toJsonValue, fromJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaPersonRoleAssignmentRepository
  implements IPersonRoleAssignmentRepository
{
  private readonly logger = createRepositoryLogger(
    "PersonRoleAssignmentRepository",
  );

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(
    assignment: PersonRoleAssignment,
  ): Promise<PersonRoleAssignment> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.personRoleAssignment.create({
        data: {
          personId: assignment.personId,
          roleId: assignment.roleId,
          scope: assignment.scope,
          startDate: assignment.startDate,
          endDate: assignment.endDate,
          isPrimary: assignment.isPrimary,
          isActive: assignment.active,
          note: assignment.note,
          metadata: toJsonValue(assignment.metadata),
        },
      });

      this.logger.timed("create", "Person role assignment created", timer(), {
        id: created.id,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error(
        "create",
        "Failed to create person role assignment",
        error,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<PersonRoleAssignment | null> {
    const assignment = await this.prisma.personRoleAssignment.findUnique({
      where: { id },
    });

    return assignment ? this.toDomain(assignment) : null;
  }

  async findByPersonId(
    personId: string,
    options?: { activeOnly?: boolean; asOf?: Date },
  ): Promise<PersonRoleAssignment[]> {
    const asOf = options?.asOf || new Date();

    const assignments = await this.prisma.personRoleAssignment.findMany({
      where: {
        personId,
        ...(options?.activeOnly && {
          startDate: { lte: asOf },
          OR: [{ endDate: null }, { endDate: { gte: asOf } }],
        }),
      },
      orderBy: { startDate: "desc" },
    });

    return assignments.map((a: PrismaPersonRoleAssignment) => this.toDomain(a));
  }

  async findByRoleId(
    roleId: string,
    options?: { activeOnly?: boolean; asOf?: Date },
  ): Promise<PersonRoleAssignment[]> {
    const asOf = options?.asOf || new Date();

    const assignments = await this.prisma.personRoleAssignment.findMany({
      where: {
        roleId,
        ...(options?.activeOnly && {
          startDate: { lte: asOf },
          OR: [{ endDate: null }, { endDate: { gte: asOf } }],
        }),
      },
      orderBy: { startDate: "desc" },
    });

    return assignments.map((a: PrismaPersonRoleAssignment) => this.toDomain(a));
  }

  async findByPersonAndRole(
    personId: string,
    roleId: string,
    activeOnly?: boolean,
  ): Promise<PersonRoleAssignment[]> {
    const now = new Date();

    const assignments = await this.prisma.personRoleAssignment.findMany({
      where: {
        personId,
        roleId,
        ...(activeOnly && {
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        }),
      },
      orderBy: { startDate: "desc" },
    });

    return assignments.map((a: PrismaPersonRoleAssignment) => this.toDomain(a));
  }

  async findActiveForPerson(
    personId: string,
    asOf?: Date,
  ): Promise<PersonRoleAssignment[]> {
    const date = asOf || new Date();

    const assignments = await this.prisma.personRoleAssignment.findMany({
      where: {
        personId,
        startDate: { lte: date },
        OR: [{ endDate: null }, { endDate: { gte: date } }],
      },
      orderBy: { startDate: "desc" },
    });

    return assignments.map((a: PrismaPersonRoleAssignment) => this.toDomain(a));
  }

  async findEndingSoon(days: number): Promise<PersonRoleAssignment[]> {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);

    const assignments = await this.prisma.personRoleAssignment.findMany({
      where: {
        endDate: {
          not: null,
          gte: now,
          lte: futureDate,
        },
      },
      orderBy: { endDate: "asc" },
    });

    return assignments.map((a: PrismaPersonRoleAssignment) => this.toDomain(a));
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "startDate" | "endDate" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<PersonRoleAssignment[]> {
    const assignments = await this.prisma.personRoleAssignment.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy
        ? { [options.orderBy]: options.order ?? "asc" }
        : { createdAt: "desc" },
    });

    return assignments.map((a: PrismaPersonRoleAssignment) => this.toDomain(a));
  }

  async countByPersonId(personId: string): Promise<number> {
    return await this.prisma.personRoleAssignment.count({
      where: { personId },
    });
  }

  async countActiveByPersonId(personId: string, asOf?: Date): Promise<number> {
    const date = asOf || new Date();

    return await this.prisma.personRoleAssignment.count({
      where: {
        personId,
        startDate: { lte: date },
        OR: [{ endDate: null }, { endDate: { gte: date } }],
      },
    });
  }

  async countByRoleId(roleId: string): Promise<number> {
    return await this.prisma.personRoleAssignment.count({
      where: { roleId },
    });
  }

  async update(
    assignment: PersonRoleAssignment,
  ): Promise<PersonRoleAssignment> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.personRoleAssignment.update({
        where: { id: assignment.id },
        data: {
          scope: assignment.scope,
          startDate: assignment.startDate,
          endDate: assignment.endDate,
          isPrimary: assignment.isPrimary,
          isActive: assignment.active,
          note: assignment.note,
          metadata: toJsonValue(assignment.metadata),
          updatedAt: assignment.updatedAt,
        },
      });

      this.logger.timed("update", "Person role assignment updated", timer(), {
        id: updated.id,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error(
        "update",
        "Failed to update person role assignment",
        error,
      );
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.personRoleAssignment.delete({
        where: { id },
      });

      this.logger.timed("delete", "Person role assignment deleted", timer(), {
        id,
      });
    } catch (error) {
      this.logger.error(
        "delete",
        "Failed to delete person role assignment",
        error,
      );
      throw error;
    }
  }

  async deleteByPersonId(personId: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      await this.prisma.personRoleAssignment.deleteMany({
        where: { personId },
      });

      this.logger.timed(
        "deleteByPersonId",
        "Person role assignments deleted by person",
        timer(),
        { personId },
      );
    } catch (error) {
      this.logger.error(
        "deleteByPersonId",
        "Failed to delete person role assignments",
        error,
      );
      throw error;
    }
  }

  async hasOverlap(
    personId: string,
    roleId: string,
    startDate: Date,
    endDate: Date | null,
    excludeId?: string,
  ): Promise<boolean> {
    // Find overlapping assignments
    // Two periods overlap if: start1 <= end2 AND start2 <= end1
    const assignments = await this.prisma.personRoleAssignment.findMany({
      where: {
        personId,
        roleId,
        ...(excludeId && { id: { not: excludeId } }),
        OR: [
          // Case 1: Existing has no end date (infinite)
          {
            endDate: null,
            startDate: { lte: endDate || new Date("9999-12-31") },
          },
          // Case 2: New has no end date
          ...(endDate === null
            ? [
                {
                  startDate: { lte: new Date("9999-12-31") },
                  OR: [{ endDate: null }, { endDate: { gte: startDate } }],
                },
              ]
            : [
                // Case 3: Both have end dates
                {
                  startDate: { lte: endDate },
                  OR: [{ endDate: null }, { endDate: { gte: startDate } }],
                },
              ]),
        ],
      },
    });

    return assignments.length > 0;
  }

  private toDomain(
    prismaAssignment: PrismaPersonRoleAssignment,
  ): PersonRoleAssignment {
    return PersonRoleAssignment.reconstitute({
      id: prismaAssignment.id,
      personId: prismaAssignment.personId,
      roleId: prismaAssignment.roleId,
      scope: prismaAssignment.scope,
      startDate: prismaAssignment.startDate,
      endDate: prismaAssignment.endDate,
      isPrimary: prismaAssignment.isPrimary,
      isActive: prismaAssignment.isActive,
      note: prismaAssignment.note,
      metadata: fromJsonValue<Record<string, unknown>>(
        prismaAssignment.metadata,
      ),
      createdAt: prismaAssignment.createdAt,
      updatedAt: prismaAssignment.updatedAt,
    });
  }
}
