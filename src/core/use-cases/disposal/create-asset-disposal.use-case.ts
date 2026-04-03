import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetDisposalRepository } from "@/core/repositories/asset-disposal.repository.interface";
import type { IDisposalApprovalRepository } from "@/core/repositories/disposal-approval.repository.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import {
  AssetDisposal,
  type DisposalType,
} from "@/core/domain/entities/asset-disposal.entity";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";
import { DisposalApproval } from "@/core/domain/entities/disposal-approval.entity";

export interface CreateAssetDisposalRequest {
  assetId: string;
  disposalType: DisposalType;
  reason?: string | null;
  initiatedById: string;
  estimatedValue?: number | null;
  currency?: string | null;
  disposalVendorId?: string | null;
  recipientInfo?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
  approverIds?: string[];
}

@injectable()
export class CreateAssetDisposalUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetDisposalRepository)
    private readonly assetDisposalRepository: IAssetDisposalRepository,

    @inject(DI_TOKENS.IDisposalApprovalRepository)
    private readonly disposalApprovalRepository: IDisposalApprovalRepository,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  @LogExecution("disposal.create")
  async execute(request: CreateAssetDisposalRequest): Promise<AssetDisposal> {
    const disposal = AssetDisposal.create(
      {
        assetId: request.assetId,
        disposalType: request.disposalType,
        reason: request.reason,
        initiatedById: request.initiatedById,
        estimatedValue: request.estimatedValue,
        currency: request.currency,
        disposalVendorId: request.disposalVendorId,
        recipientInfo: request.recipientInfo,
        note: request.note,
      },
      this.idGenerator,
    );

    const created = await this.assetDisposalRepository.create(disposal);

    if (request.approverIds && request.approverIds.length > 0) {
      for (const approverId of request.approverIds) {
        const approval = DisposalApproval.create(
          { disposalId: created.id, approverId },
          this.idGenerator,
        );
        await this.disposalApprovalRepository.create(approval);
      }
    }

    return created;
  }
}
