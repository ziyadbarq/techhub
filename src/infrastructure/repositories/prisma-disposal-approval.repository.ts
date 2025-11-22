import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IDisposalApprovalRepository } from "@/core/repositories/disposal-approval.repository.interface";
import {
  DisposalApproval,
  type ApprovalStatus,
} from "@/core/domain/entities/disposal-approval.entity";

@injectable()
export class PrismaDisposalApprovalRepository
  implements IDisposalApprovalRepository
{
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(approval: DisposalApproval): Promise<DisposalApproval> {
    const data = {
      id: approval.id,
      disposalId: approval.disposalId,
      approverId: approval.approverId,
      status: approval.status,
      decisionAt: approval.decisionAt,
      comment: approval.comment,
      createdAt: approval.createdAt,
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
      where: { disposalId: disposalId },
      orderBy: { createdAt: "asc" },
    });

    return approvals.map((a) => this.toDomain(a));
  }

  async findByApproverId(
    approverId: string,
    options?: { skip?: number; take?: number },
  ): Promise<DisposalApproval[]> {
    const approvals = await this.prisma.disposalApproval.findMany({
      where: { approverId: approverId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: "desc" },
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
      orderBy: { createdAt: "desc" },
    });

    return approvals.map((a) => this.toDomain(a));
  }

  async findPendingByApprover(approverId: string): Promise<DisposalApproval[]> {
    const approvals = await this.prisma.disposalApproval.findMany({
      where: {
        approverId: approverId,
        status: "PENDING",
      },
      orderBy: { createdAt: "asc" },
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
      orderBy: { createdAt: "asc" },
    });

    return approvals.map((a) => this.toDomain(a));
  }

  async hasPendingApprovals(disposalId: string): Promise<boolean> {
    const count = await this.prisma.disposalApproval.count({
      where: {
        disposalId: disposalId,
        status: "PENDING",
      },
    });

    return count > 0;
  }

  async hasRejectedApprovals(disposalId: string): Promise<boolean> {
    const count = await this.prisma.disposalApproval.count({
      where: {
        disposalId: disposalId,
        status: "REJECTED",
      },
    });

    return count > 0;
  }

  async areAllApproved(disposalId: string): Promise<boolean> {
    const total = await this.prisma.disposalApproval.count({
      where: { disposalId: disposalId },
    });

    const approved = await this.prisma.disposalApproval.count({
      where: {
        disposalId: disposalId,
        status: "APPROVED",
      },
    });

    return total > 0 && total === approved;
  }

  async update(approval: DisposalApproval): Promise<DisposalApproval> {
    const data = {
      status: approval.status,
      decisionAt: approval.decisionAt,
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
      where: { disposalId: disposalId },
    });
  }

  async countByStatus(status: ApprovalStatus): Promise<number> {
    return this.prisma.disposalApproval.count({
      where: { status },
    });
  }

  async countByDisposalId(disposalId: string): Promise<number> {
    return this.prisma.disposalApproval.count({
      where: { disposalId: disposalId },
    });
  }

  private toDomain(prismaApproval: {
    id: string;
    disposalId: string;
    approverId: string;
    status: string;
    decisionAt: Date | null;
    comment: string | null;
    createdAt: Date;
  }): DisposalApproval {
    return DisposalApproval.reconstitute({
      id: prismaApproval.id,
      disposalId: prismaApproval.disposalId,
      approverId: prismaApproval.approverId,
      status: prismaApproval.status as ApprovalStatus,
      decisionAt: prismaApproval.decisionAt,
      comment: prismaApproval.comment,
      createdAt: prismaApproval.createdAt,
    });
  }
}
