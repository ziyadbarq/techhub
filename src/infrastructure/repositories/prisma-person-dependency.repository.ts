import { injectable } from "inversify";
import { prisma } from "@/infrastructure/database/prisma/client";
import type {
  IPersonDependencyRepository,
  PersonDependencies,
} from "@/core/repositories/person-dependency.repository.interface";

@injectable()
export class PrismaPersonDependencyRepository
  implements IPersonDependencyRepository
{
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
      prisma.person.findFirst({
        where: { id: personId, userId: { not: null } },
        select: { id: true },
      }),
      prisma.organizationUnit.count({ where: { managerId: personId } }),
      prisma.person.count({ where: { managerId: personId } }),
      prisma.configurationItem.count({
        where: { primaryOwnerPersonId: personId },
      }),
      prisma.stockMovement.count({ where: { performedById: personId } }),
      prisma.verificationCampaign.count({ where: { createdById: personId } }),
      prisma.verificationItem.count({ where: { verifierPersonId: personId } }),
      prisma.auditLogEntry.count({ where: { changedById: personId } }),
      prisma.attachment.count({ where: { uploadedById: personId } }),
      prisma.dataOwnership.count({ where: { ownerPersonId: personId } }),
      prisma.maintenanceSchedule.count({ where: { assignedToId: personId } }),
      prisma.maintenanceRecord.count({ where: { performedById: personId } }),
      prisma.assetDisposal.count({ where: { initiatedById: personId } }),
      prisma.assetDisposal.count({ where: { approvedById: personId } }),
      prisma.disposalApproval.count({ where: { approverId: personId } }),
      prisma.disposalDocument.count({ where: { uploadedById: personId } }),
      prisma.assetKitCheckout.count({ where: { checkedOutById: personId } }),
      prisma.assetReservation.count({
        where: { reservedForPersonId: personId },
      }),
      prisma.assetReservation.count({ where: { reservedById: personId } }),
      prisma.assetReservation.count({
        where: { reservedById: personId, status: "CONFIRMED" },
      }),
      prisma.assetReservation.count({
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
      roleAssignments: 0,
    };
  }

  async countActiveMaintenanceSchedules(personId: string): Promise<number> {
    return prisma.maintenanceSchedule.count({
      where: { assignedToId: personId, isActive: true },
    });
  }

  async countActiveReservations(personId: string): Promise<number> {
    return prisma.assetReservation.count({
      where: {
        reservedForPersonId: personId,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
  }
}
