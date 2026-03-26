/**
 * Prisma OCI Sync Log Repository Implementation
 */

import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type {
  IOciSyncLogRepository,
  OciSyncLogCreateInput,
  OciSyncLogUpdateInput,
  OciSyncLogRecord,
} from "@/core/repositories/oci-sync-log.repository.interface";

@injectable()
export class PrismaOciSyncLogRepository implements IOciSyncLogRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(input: OciSyncLogCreateInput): Promise<OciSyncLogRecord> {
    const record = await this.prisma.ociSyncLog.create({
      data: {
        id: input.id,
        serviceTypes: input.serviceTypes,
        triggeredBy: input.triggeredBy ?? null,
        isDryRun: input.isDryRun,
      },
    });
    return record as OciSyncLogRecord;
  }

  async update(
    id: string,
    data: OciSyncLogUpdateInput,
  ): Promise<OciSyncLogRecord> {
    const record = await this.prisma.ociSyncLog.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.tenancyId !== undefined && { tenancyId: data.tenancyId }),
        ...(data.regions !== undefined && { regions: data.regions }),
        ...(data.resourcesProcessed !== undefined && {
          resourcesProcessed: data.resourcesProcessed,
        }),
        ...(data.resourcesCreated !== undefined && {
          resourcesCreated: data.resourcesCreated,
        }),
        ...(data.resourcesUpdated !== undefined && {
          resourcesUpdated: data.resourcesUpdated,
        }),
        ...(data.resourcesRetired !== undefined && {
          resourcesRetired: data.resourcesRetired,
        }),
        ...(data.resourcesUnchanged !== undefined && {
          resourcesUnchanged: data.resourcesUnchanged,
        }),
        ...(data.compartmentsCreated !== undefined && {
          compartmentsCreated: data.compartmentsCreated,
        }),
        ...(data.relationshipsCreated !== undefined && {
          relationshipsCreated: data.relationshipsCreated,
        }),
        ...(data.errorsCount !== undefined && {
          errorsCount: data.errorsCount,
        }),
        ...(data.errors !== undefined && {
          errors: data.errors as never,
        }),
        ...(data.completedAt !== undefined && {
          completedAt: data.completedAt,
        }),
        ...(data.durationMs !== undefined && { durationMs: data.durationMs }),
      },
    });
    return record as OciSyncLogRecord;
  }

  async findById(id: string): Promise<OciSyncLogRecord | null> {
    const record = await this.prisma.ociSyncLog.findUnique({
      where: { id },
    });
    return record as OciSyncLogRecord | null;
  }

  async findLatest(limit: number = 20): Promise<OciSyncLogRecord[]> {
    const records = await this.prisma.ociSyncLog.findMany({
      orderBy: { startedAt: "desc" },
      take: limit,
    });
    return records as OciSyncLogRecord[];
  }
}
