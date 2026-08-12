import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type {
  IAccessServiceRepository,
  AccessServiceData,
  AccessServiceAssigneeInput,
  AccessServiceAssigneeDetail,
} from "@/core/repositories/workflow/access-service.repository.interface";
import type { Tx } from "@/core/repositories/workflow/types";
import type { AccessServiceRole } from "@/generated/prisma";

const ASSIGNEE_INCLUDE = {
  assignees: {
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  },
} as const;

@injectable()
export class PrismaAccessServiceRepository implements IAccessServiceRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  private db(tx?: Tx) {
    return tx ?? this.prisma;
  }

  private mapAssignees(
    raw: Array<{
      userId: string;
      role: AccessServiceRole;
      user: { name: string | null; email: string } | null;
    }>,
  ): AccessServiceAssigneeDetail[] {
    return raw.map((a) => ({
      userId: a.userId,
      role: a.role,
      userName: a.user?.name ?? "",
      userEmail: a.user?.email ?? "",
    }));
  }

  private toData(row: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isActive: boolean;
    requireManagerApproval: boolean;
    instructions: string | null;
    createdAt: Date;
    updatedAt: Date;
    createdById: string | null;
    updatedById: string | null;
    assignees?: Array<{
      userId: string;
      role: AccessServiceRole;
      user: { name: string | null; email: string } | null;
    }>;
  }): AccessServiceData {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      isActive: row.isActive,
      requireManagerApproval: row.requireManagerApproval,
      instructions: row.instructions,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdById: row.createdById,
      updatedById: row.updatedById,
      assignees: row.assignees ? this.mapAssignees(row.assignees) : undefined,
    };
  }

  async findById(id: string, tx?: Tx): Promise<AccessServiceData | null> {
    const row = await this.db(tx).accessService.findUnique({
      where: { id },
      include: ASSIGNEE_INCLUDE,
    });
    return row ? this.toData(row) : null;
  }

  async findBySlug(slug: string, tx?: Tx): Promise<AccessServiceData | null> {
    const row = await this.db(tx).accessService.findUnique({
      where: { slug },
      include: ASSIGNEE_INCLUDE,
    });
    return row ? this.toData(row) : null;
  }

  async findByName(name: string, tx?: Tx): Promise<AccessServiceData | null> {
    const row = await this.db(tx).accessService.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      include: ASSIGNEE_INCLUDE,
    });
    return row ? this.toData(row) : null;
  }

  async findAll(
    opts?: { activeOnly?: boolean },
    tx?: Tx,
  ): Promise<AccessServiceData[]> {
    const rows = await this.db(tx).accessService.findMany({
      where: opts?.activeOnly ? { isActive: true } : undefined,
      include: ASSIGNEE_INCLUDE,
      orderBy: { name: "asc" },
    });
    return rows.map((r) => this.toData(r));
  }

  async findActiveAssigneesByRole(
    serviceId: string,
    role: AccessServiceRole,
    tx?: Tx,
  ): Promise<AccessServiceAssigneeDetail[]> {
    const rows = await this.db(tx).accessServiceAssignee.findMany({
      where: {
        accessServiceId: serviceId,
        role,
        // Active user = has an active Person record linked to their User account
        user: { person: { isActive: true } },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    return rows.map((r) => ({
      userId: r.userId,
      role: r.role,
      userName: r.user?.name ?? "",
      userEmail: r.user?.email ?? "",
    }));
  }

  async create(
    data: Omit<AccessServiceData, "createdAt" | "updatedAt" | "assignees">,
    assignees: AccessServiceAssigneeInput[],
    tx?: Tx,
  ): Promise<AccessServiceData> {
    const row = await this.db(tx).accessService.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        isActive: data.isActive,
        requireManagerApproval: data.requireManagerApproval,
        instructions: data.instructions,
        createdById: data.createdById,
        updatedById: data.updatedById,
        assignees: assignees.length
          ? {
              create: assignees.map((a) => ({
                userId: a.userId,
                role: a.role,
              })),
            }
          : undefined,
      },
      include: ASSIGNEE_INCLUDE,
    });
    return this.toData(row);
  }

  async update(
    id: string,
    data: Partial<
      Omit<AccessServiceData, "id" | "createdAt" | "updatedAt" | "assignees">
    >,
    assignees: AccessServiceAssigneeInput[],
    tx?: Tx,
  ): Promise<AccessServiceData> {
    // Replace assignees atomically: delete existing, create new
    await this.db(tx).accessServiceAssignee.deleteMany({
      where: { accessServiceId: id },
    });

    const row = await this.db(tx).accessService.update({
      where: { id },
      data: {
        ...data,
        assignees: assignees.length
          ? {
              create: assignees.map((a) => ({
                userId: a.userId,
                role: a.role,
              })),
            }
          : undefined,
      },
      include: ASSIGNEE_INCLUDE,
    });
    return this.toData(row);
  }

  async isActiveUserEmail(email: string, tx?: Tx): Promise<boolean> {
    // Active = Person record exists with isActive=true and has a linked User
    const count = await this.db(tx).person.count({
      where: {
        email: { equals: email, mode: "insensitive" },
        isActive: true,
        userId: { not: null },
      },
    });
    return count > 0;
  }

  async findActiveUserIdByEmail(
    email: string,
    tx?: Tx,
  ): Promise<string | null> {
    const person = await this.db(tx).person.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        isActive: true,
        userId: { not: null },
      },
      select: { userId: true },
    });
    return person?.userId ?? null;
  }
}
