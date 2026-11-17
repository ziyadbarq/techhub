import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type {
  ILookupProvider,
  LookupOption,
  LookupValidationResult,
} from "@/core/domain/workflow/lookup-provider.interface";
import type { Tx } from "@/core/repositories/workflow/types";

const APPROVER_NAMES = {
  assignees: {
    // Same "active" rule the engine uses when it snapshots assignees at
    // submission (linked Person is active), so the form never shows someone
    // the request won't actually be assigned to.
    where: { user: { person: { isActive: true } } },
    select: { role: true, user: { select: { name: true } } },
    orderBy: { createdAt: "asc" as const },
  },
};

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
      include: APPROVER_NAMES,
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
      include: APPROVER_NAMES,
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
    slug: string;
    requireManagerApproval: boolean;
    instructions: string | null;
    assignees?: Array<{ role: string; user: { name: string | null } | null }>;
  }): LookupOption {
    // Who will act on the request, by display name only (no ids or emails),
    // so the requester sees the approval chain before submitting — the same
    // names the intranet form shows. The engine still resolves the real
    // assignees from the submission snapshot.
    const namesFor = (role: string) =>
      (row.assignees ?? [])
        .filter((a) => a.role === role)
        .map((a) => a.user?.name?.trim())
        .filter((name): name is string => !!name)
        .join(", ") || null;
    return {
      id: row.id,
      label: row.name,
      publicMetadata: {
        // Stable across environments; conditions compare this, not the id.
        slug: row.slug,
        requireManagerApproval: row.requireManagerApproval,
        instructions: row.instructions ?? null,
        ownerNames: namesFor("OWNER"),
        cybersecurityNames: namesFor("CYBERSECURITY"),
        implementerNames: namesFor("IMPLEMENTER"),
      },
    };
  }
}
