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
    const rows = await this.db(tx).accessService.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
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
    const row = await this.db(tx).accessService.findUnique({
      where: { id, isActive: true },
    });
    return row ? this.toOption(row) : null;
  }

  async validate(
    id: string,
    _userId: string,
    tx?: Tx,
  ): Promise<LookupValidationResult> {
    const row = await this.db(tx).accessService.findUnique({
      where: { id },
      select: { isActive: true },
    });
    if (!row) return { valid: false, reason: "Access service not found." };
    if (!row.isActive)
      return { valid: false, reason: "Access service is inactive." };
    return { valid: true };
  }

  async isEligible(_id: string, _userId: string, _tx?: Tx): Promise<boolean> {
    // All authenticated employees are eligible to request any active service.
    return true;
  }

  private toOption(row: {
    id: string;
    name: string;
    requireManagerApproval: boolean;
    instructions: string | null;
  }): LookupOption {
    return {
      id: row.id,
      label: row.name,
      publicMetadata: {
        requireManagerApproval: row.requireManagerApproval,
        instructions: row.instructions ?? null,
      },
    };
  }
}
