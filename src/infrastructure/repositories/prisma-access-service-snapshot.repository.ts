import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type {
  IAccessServiceSnapshotRepository,
  CreateSnapshotInput,
  AccessServiceSnapshotRow,
  SnapshotAssigneeRow,
} from "@/core/repositories/workflow/access-service.repository.interface";
import type { Tx } from "@/core/repositories/workflow/types";
import type { AccessServiceRole } from "@/generated/prisma";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

@injectable()
export class PrismaAccessServiceSnapshotRepository implements IAccessServiceSnapshotRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  private db(tx?: Tx) {
    return tx ?? this.prisma;
  }

  async createSnapshot(input: CreateSnapshotInput, tx: Tx): Promise<void> {
    const snapshotId = this.idGenerator.generateId();
    // Retain a hidden compatibility record for the historical snapshot FK.
    // The live source of truth is the central Service catalog.
    const existingCompatibilityRecord = await this.db(
      tx,
    ).accessService.findFirst({
      where: {
        OR: [{ id: input.accessServiceId }, { name: input.serviceName }],
      },
      select: { id: true },
    });
    const compatibilityRecord = existingCompatibilityRecord
      ? await this.db(tx).accessService.update({
          where: { id: existingCompatibilityRecord.id },
          data: {
            name: input.serviceName,
            requireManagerApproval: input.requireManagerApproval,
            instructions: input.instructions,
            isActive: true,
          },
          select: { id: true },
        })
      : await this.db(tx).accessService.create({
          data: {
            id: input.accessServiceId,
            name: input.serviceName,
            slug: input.serviceSlug,
            requireManagerApproval: input.requireManagerApproval,
            instructions: input.instructions,
            isActive: true,
          },
          select: { id: true },
        });
    await this.db(tx).accessServiceRequestSnapshot.create({
      data: {
        id: snapshotId,
        requestId: input.requestId,
        sourceFieldKey: input.sourceFieldKey,
        accessServiceId: compatibilityRecord.id,
        serviceName: input.serviceName,
        serviceSlug: input.serviceSlug,
        requireManagerApproval: input.requireManagerApproval,
        instructions: input.instructions,
        assigneeRows: {
          create: input.assignees.map((a) => ({
            id: this.idGenerator.generateId(),
            userId: a.userId,
            userName: a.userName,
            userEmail: a.userEmail,
            role: a.role,
          })),
        },
      },
    });
  }

  async findByRequestAndField(
    requestId: string,
    sourceFieldKey: string,
    tx?: Tx,
  ): Promise<AccessServiceSnapshotRow | null> {
    const row = await this.db(tx).accessServiceRequestSnapshot.findUnique({
      where: { requestId_sourceFieldKey: { requestId, sourceFieldKey } },
      include: { assigneeRows: true },
    });
    return row ? this.toRow(row) : null;
  }

  async findAllForRequest(
    requestId: string,
    tx?: Tx,
  ): Promise<AccessServiceSnapshotRow[]> {
    const rows = await this.db(tx).accessServiceRequestSnapshot.findMany({
      where: { requestId },
      include: { assigneeRows: true },
    });
    return rows.map((r) => this.toRow(r));
  }

  async findActiveAssigneeIdsByRole(
    requestId: string,
    sourceFieldKey: string,
    role: AccessServiceRole,
    tx: Tx,
  ): Promise<string[]> {
    const rows = await this.db(tx).accessServiceSnapshotAssignee.findMany({
      where: {
        snapshot: { requestId, sourceFieldKey },
        role,
        userId: { not: null },
        // Active = person record linked to user account has isActive=true
        user: { person: { isActive: true } },
      },
      select: { userId: true },
    });
    return rows.map((r) => r.userId).filter((id): id is string => id !== null);
  }

  private toRow(raw: {
    id: string;
    requestId: string;
    sourceFieldKey: string;
    accessServiceId: string;
    serviceName: string;
    serviceSlug: string;
    requireManagerApproval: boolean;
    instructions: string | null;
    createdAt: Date;
    assigneeRows: Array<{
      userId: string | null;
      userName: string;
      userEmail: string;
      role: AccessServiceRole;
    }>;
  }): AccessServiceSnapshotRow {
    const assignees: SnapshotAssigneeRow[] = raw.assigneeRows.map((a) => ({
      userId: a.userId,
      userName: a.userName,
      userEmail: a.userEmail,
      role: a.role,
    }));
    return {
      id: raw.id,
      requestId: raw.requestId,
      sourceFieldKey: raw.sourceFieldKey,
      accessServiceId: raw.accessServiceId,
      serviceName: raw.serviceName,
      serviceSlug: raw.serviceSlug,
      requireManagerApproval: raw.requireManagerApproval,
      instructions: raw.instructions,
      createdAt: raw.createdAt,
      assignees,
    };
  }
}
