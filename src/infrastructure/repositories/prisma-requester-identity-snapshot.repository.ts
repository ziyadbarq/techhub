import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import { DI_TOKENS } from "@/di/types";
import type {
  IRequesterIdentitySnapshotRepository,
  CreateRequesterIdentityInput,
  RequesterIdentityRow,
} from "@/core/repositories/workflow/access-service.repository.interface";
import type { Tx } from "@/core/repositories/workflow/types";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

@injectable()
export class PrismaRequesterIdentitySnapshotRepository implements IRequesterIdentitySnapshotRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  private db(tx?: Tx) {
    return tx ?? this.prisma;
  }

  async create(input: CreateRequesterIdentityInput, tx: Tx): Promise<void> {
    await this.db(tx).requesterIdentitySnapshot.create({
      data: {
        id: this.idGenerator.generateId(),
        requestId: input.requestId,
        requesterUserId: input.requesterUserId,
        requesterName: input.requesterName,
        requesterEmail: input.requesterEmail,
        managerUserId: input.managerUserId ?? null,
        managerName: input.managerName ?? null,
        managerEmail: input.managerEmail ?? null,
      },
    });
  }

  async findByRequestId(
    requestId: string,
    tx?: Tx,
  ): Promise<RequesterIdentityRow | null> {
    const row = await this.db(tx).requesterIdentitySnapshot.findUnique({
      where: { requestId },
    });
    if (!row) return null;
    return {
      requesterUserId: row.requesterUserId,
      requesterName: row.requesterName,
      requesterEmail: row.requesterEmail,
      managerUserId: row.managerUserId,
      managerName: row.managerName,
      managerEmail: row.managerEmail,
    };
  }
}
