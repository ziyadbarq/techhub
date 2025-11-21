/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IDisposalApprovalRepository } from "@/core/repositories/disposal-approval.repository.interface";
import {
  DisposalApproval,
  type ApprovalStatus,
} from "@/core/domain/entities/disposal-approval.entity";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaDisposalApprovalRepository
  implements IDisposalApprovalRepository
{
  private readonly logger = createRepositoryLogger("DisposalApproval");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(approval: DisposalApproval): Promise<DisposalApproval> {
    const data = {
      id: approval.id,
      disposal_id: approval.disposalId,
      approver_id: approval.approverId,
      status: approval.status,
      decision_at: approval.decisionAt,
      comment: approval.comment,
      created_at: approval.createdAt,
    };

    const created = await this.prisma.disposalApproval.create({ data });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<DisposalApproval | null> {
    const approval = await this.prisma.disposalApproval.findUnique({
      where: { id },
    });

    return approval ? this.toDomain(approval) : null;
  }

  async findByDisposalId(disposalId: string): Promise<DisposalApproval[]> {
    const approvals = await this.prisma.disposalApproval.findMany({
      where: { disposal_id: disposalId },
      orderBy: { created_at: "asc" },
    });

    return approvals.map((a) => this.toDomain(a));
  }

  async findByApproverId(
    approverId: string,
    options?: { skip?: number; take?: number },
  ): Promise<DisposalApproval[]> {
    const approvals = await this.prisma.disposalApproval.findMany({
      where: { approver_id: approverId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { created_at: "desc" },
    });

    return approvals.map((a) => this.toDomain(a));
  }

  async findByStatus(
    status: ApprovalStatus,
    options?: { skip?: number; take?: number },
  ): Promise<DisposalApproval[]> {
    const approvals = await this.prisma.disposalApproval.findMany({
      where: { status },
      skip: options?.skip,
      take: options?.take,
      orderBy: { created_at: "desc" },
    });

    return approvals.map((a) => this.toDomain(a));
  }

  async findPendingByApprover(approverId: string): Promise<DisposalApproval[]> {
    const approvals = await this.prisma.disposalApproval.findMany({
      where: {
        approver_id: approverId,
        status: "PENDING",
      },
      orderBy: { created_at: "asc" },
    });

    return approvals.map((a) => this.toDomain(a));
  }

  async findAllPending(options?: {
    skip?: number;
    take?: number;
  }): Promise<DisposalApproval[]> {
    const approvals = await this.prisma.disposalApproval.findMany({
      where: { status: "PENDING" },
      skip: options?.skip,
      take: options?.take,
      orderBy: { created_at: "asc" },
    });

    return approvals.map((a) => this.toDomain(a));
  }

  async hasPendingApprovals(disposalId: string): Promise<boolean> {
    const count = await this.prisma.disposalApproval.count({
      where: {
        disposal_id: disposalId,
        status: "PENDING",
      },
    });

    return count > 0;
  }

  async hasRejectedApprovals(disposalId: string): Promise<boolean> {
    const count = await this.prisma.disposalApproval.count({
      where: {
        disposal_id: disposalId,
        status: "REJECTED",
      },
    });

    return count > 0;
  }

  async areAllApproved(disposalId: string): Promise<boolean> {
    const total = await this.prisma.disposalApproval.count({
      where: { disposal_id: disposalId },
    });

    const approved = await this.prisma.disposalApproval.count({
      where: {
        disposal_id: disposalId,
        status: "APPROVED",
      },
    });

    return total > 0 && total === approved;
  }

  async update(approval: DisposalApproval): Promise<DisposalApproval> {
    const data = {
      status: approval.status,
      decision_at: approval.decisionAt,
      comment: approval.comment,
    };

    const updated = await this.prisma.disposalApproval.update({
      where: { id: approval.id },
      data,
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.disposalApproval.delete({
      where: { id },
    });
  }

  async deleteByDisposalId(disposalId: string): Promise<void> {
    await this.prisma.disposalApproval.deleteMany({
      where: { disposal_id: disposalId },
    });
  }

  async countByStatus(status: ApprovalStatus): Promise<number> {
    return this.prisma.disposalApproval.count({
      where: { status },
    });
  }

  async countByDisposalId(disposalId: string): Promise<number> {
    return this.prisma.disposalApproval.count({
      where: { disposal_id: disposalId },
    });
  }

  private toDomain(prismaApproval: {
    id: string;
    disposal_id: string;
    approver_id: string;
    status: string;
    decision_at: Date | null;
    comment: string | null;
    created_at: Date;
  }): DisposalApproval {
    return DisposalApproval.reconstitute({
      id: prismaApproval.id,
      disposalId: prismaApproval.disposal_id,
      approverId: prismaApproval.approver_id,
      status: prismaApproval.status as ApprovalStatus,
      decisionAt: prismaApproval.decision_at,
      comment: prismaApproval.comment,
      createdAt: prismaApproval.created_at,
    });
  }
}
