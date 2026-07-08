import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";
import type {
  IPersonDependencyRepository,
  PersonDependencies,
} from "@/core/repositories/person-dependency.repository.interface";

@injectable()
export class PrismaPersonDependencyRepository implements IPersonDependencyRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}
  async getDependencies(personId: string): Promise<PersonDependencies> {
    const [
      userAccount,
      managedOrgUnits,
      managedPeople,
      configurationItems,
      stockMovements,
      verificationCampaigns,
      verificationItems,
      auditLogs,
      attachments,
      dataOwnerships,
      maintenanceSchedules,
      maintenanceRecords,
      disposalsInitiated,
      disposalsApproved,
      disposalApprovals,
      disposalDocuments,
      kitCheckouts,
      reservationsFor,
      reservationsCreated,
      reservationsConfirmed,
      reservationsCancelled,
    ] = await Promise.all([
      this.prisma.person.findFirst({
        where: { id: personId, userId: { not: null } },
        select: { id: true },
      }),
      this.prisma.organizationUnit.count({ where: { managerId: personId } }),
      this.prisma.person.count({ where: { managerId: personId } }),
      this.prisma.configurationItem.count({
        where: { primaryOwnerPersonId: personId },
      }),
      this.prisma.stockMovement.count({ where: { performedById: personId } }),
      this.prisma.verificationCampaign.count({
        where: { createdById: personId },
      }),
      this.prisma.verificationItem.count({
        where: { verifierPersonId: personId },
      }),
      this.prisma.auditLogEntry.count({ where: { changedById: personId } }),
      this.prisma.attachment.count({ where: { uploadedById: personId } }),
      this.prisma.dataOwnership.count({ where: { ownerPersonId: personId } }),
      this.prisma.maintenanceSchedule.count({
        where: { assignedToId: personId },
      }),
      this.prisma.maintenanceRecord.count({
        where: { performedById: personId },
      }),
      this.prisma.assetDisposal.count({ where: { initiatedById: personId } }),
      this.prisma.assetDisposal.count({ where: { approvedById: personId } }),
      this.prisma.disposalApproval.count({ where: { approverId: personId } }),
      this.prisma.disposalDocument.count({ where: { uploadedById: personId } }),
      this.prisma.assetKitCheckout.count({
        where: { checkedOutById: personId },
      }),
      this.prisma.assetReservation.count({
        where: { reservedForPersonId: personId },
      }),
      this.prisma.assetReservation.count({ where: { reservedById: personId } }),
      this.prisma.assetReservation.count({
        where: { reservedById: personId, status: "CONFIRMED" },
      }),
      this.prisma.assetReservation.count({
        where: { reservedById: personId, status: "CANCELLED" },
      }),
    ]);

    return {
      userAccount: !!userAccount,
      managedOrgUnits,
      managedPeople,
      configurationItems,
      stockMovements,
      verificationCampaigns,
      verificationItems,
      auditLogs,
      attachments,
      dataOwnerships,
      maintenanceSchedules,
      maintenanceRecords,
      disposalsInitiated,
      disposalsApproved,
      disposalApprovals,
      disposalDocuments,
      kitCheckouts,
      reservationsFor,
      reservationsCreated,
      reservationsConfirmed,
      reservationsCancelled,
    };
  }

  async countActiveMaintenanceSchedules(personId: string): Promise<number> {
    return this.prisma.maintenanceSchedule.count({
      where: { assignedToId: personId, isActive: true },
    });
  }

  async countActiveReservations(personId: string): Promise<number> {
    return this.prisma.assetReservation.count({
      where: {
        reservedForPersonId: personId,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
  }
}
