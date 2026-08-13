import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type {
  ILookupProvider,
  LookupOption,
  LookupValidationResult,
} from "@/core/domain/workflow/lookup-provider.interface";
import type { Tx } from "@/core/repositories/workflow/types";

@injectable()
export class AccessServiceLookupProvider implements ILookupProvider {
  readonly key = "ACCESS_SERVICES";

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  private db(tx?: Tx) {
    return (tx ?? this.prisma) as PrismaClient;
  }

  async search(
    query: string,
    _userId: string,
    limit: number,
    tx?: Tx,
  ): Promise<LookupOption[]> {
    const rows = await this.db(tx).service.findMany({
      where: {
        deletedAt: null,
        currentStatus: { not: "RETIRED" },
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: Math.min(limit, 50),
      orderBy: { name: "asc" },
    });

    return rows.map((r) => this.toOption(r));
  }

  async findById(
    id: string,
    _userId: string,
    tx?: Tx,
  ): Promise<LookupOption | null> {
    const row = await this.db(tx).service.findFirst({
      where: { id, deletedAt: null, currentStatus: { not: "RETIRED" } },
    });
    return row ? this.toOption(row) : null;
  }

  async validate(
    id: string,
    _userId: string,
    tx?: Tx,
  ): Promise<LookupValidationResult> {
    const row = await this.db(tx).service.findUnique({
      where: { id },
      select: { currentStatus: true, deletedAt: true },
    });
    if (!row) return { valid: false, reason: "Service not found." };
    if (row.deletedAt || row.currentStatus === "RETIRED")
      return { valid: false, reason: "Service is inactive or retired." };
    return { valid: true };
  }

  async isEligible(_id: string, _userId: string, _tx?: Tx): Promise<boolean> {
    // All authenticated employees are eligible to request any active service.
    return true;
  }

  private toOption(row: {
    id: string;
    name: string;
    description: string | null;
    supportContact: string | null;
    metadata: unknown;
  }): LookupOption {
    const accessConfig = readAccessManagementConfig(row.metadata);
    return {
      id: row.id,
      label: row.name,
      publicMetadata: {
        requireManagerApproval: accessConfig.requireManagerApproval,
        instructions:
          accessConfig.instructions ?? row.description ?? row.supportContact,
      },
    };
  }
}

function readAccessManagementConfig(metadata: unknown): {
  requireManagerApproval: boolean;
  instructions: string | null;
} {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return { requireManagerApproval: true, instructions: null };
  }
  const raw = (metadata as Record<string, unknown>).accessManagement;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { requireManagerApproval: true, instructions: null };
  }
  const config = raw as Record<string, unknown>;
  return {
    requireManagerApproval:
      typeof config.requireManagerApproval === "boolean"
        ? config.requireManagerApproval
        : true,
    instructions:
      typeof config.instructions === "string" ? config.instructions : null,
  };
}
