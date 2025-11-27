/**
 * DeletePersonWithConfirmation Use Case
 *
 * Application-layer safeguard for person deletion with comprehensive dependency checking.
 * Performs soft delete (sets deletedAt timestamp) to preserve audit trails.
 *
 * Business Rules:
 * - Check all person dependencies before deletion
 * - Return detailed confirmation info about what will be affected
 * - Perform soft delete to preserve audit history
 * - Prevent deletion if critical dependencies exist (linked user, active assignments)
 * - Preserve all audit logs and historical data
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { PrismaClient } from "@/generated/prisma/server";

export interface DeletePersonConfirmationRequest {
  id: string;
}

export interface PersonDependencies {
  userAccount: boolean;
  managedOrgUnits: number;
  managedPeople: number;
  configurationItems: number;
  stockMovements: number;
  verificationCampaigns: number;
  verificationItems: number;
  auditLogs: number;
  attachments: number;
  dataOwnerships: number;
  maintenanceSchedules: number;
  maintenanceRecords: number;
  disposalsInitiated: number;
  disposalsApproved: number;
  disposalApprovals: number;
  disposalDocuments: number;
  kitCheckouts: number;
  reservationsFor: number;
  reservationsCreated: number;
  reservationsConfirmed: number;
  reservationsCancelled: number;
  roleAssignments: number;
}

export interface DeletePersonConfirmationResponse {
  canDelete: boolean;
  fullName: string;
  email: string;
  employeeId: string;
  dependencies: PersonDependencies;
  totalDependencies: number;
  blockers: string[];
  warnings: string[];
  message: string;
}

@injectable()
export class DeletePersonWithConfirmationUseCase {
  constructor(
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async execute(
    request: DeletePersonConfirmationRequest,
  ): Promise<DeletePersonConfirmationResponse> {
    // Check if person exists
    const person = await this.personRepository.findById(request.id);
    if (!person) {
      throw new Error(`Person with ID "${request.id}" not found`);
    }

    // Check all dependencies
    const dependencies = await this.checkDependencies(request.id);
    const totalDependencies =
      Object.values(dependencies).reduce((sum, val) => {
        return sum + (typeof val === "boolean" ? (val ? 1 : 0) : val);
      }, 0) - (dependencies.userAccount ? 1 : 0); // Don't count userAccount in total

    // Determine blockers and warnings
    const blockers: string[] = [];
    const warnings: string[] = [];

    // Critical blocker: Linked user account
    if (dependencies.userAccount) {
      blockers.push(
        "Person is linked to a user account. Unlink the user account first.",
      );
    }

    // Critical blocker: Manages organization units
    if (dependencies.managedOrgUnits > 0) {
      blockers.push(
        `Manages ${dependencies.managedOrgUnits} organization unit(s). Reassign manager first.`,
      );
    }

    // Critical blocker: Manages other people
    if (dependencies.managedPeople > 0) {
      blockers.push(
        `Manages ${dependencies.managedPeople} person(s). Reassign manager first.`,
      );
    }

    // Critical blocker: Owns Configuration Items
    if (dependencies.configurationItems > 0) {
      blockers.push(
        `Owns ${dependencies.configurationItems} Configuration Item(s). Reassign ownership first.`,
      );
    }

    // Warning: Has data ownerships (DataOwnership doesn't have isActive field)
    if (dependencies.dataOwnerships > 0) {
      warnings.push(
        `${dependencies.dataOwnerships} data ownership(s) will be preserved. Consider reassigning if needed.`,
      );
    }

    // Critical blocker: Has assigned maintenance schedules
    if (dependencies.maintenanceSchedules > 0) {
      const activeSchedules = await this.prisma.maintenanceSchedule.count({
        where: {
          assignedToId: request.id,
          isActive: true,
        },
      });
      if (activeSchedules > 0) {
        blockers.push(
          `Has ${activeSchedules} active maintenance schedule(s). Reassign first.`,
        );
      } else {
        warnings.push(
          `${dependencies.maintenanceSchedules} historical maintenance schedule(s) will be preserved.`,
        );
      }
    }

    // Critical blocker: Has active reservations
    if (dependencies.reservationsFor > 0) {
      const activeReservations = await this.prisma.assetReservation.count({
        where: {
          reservedForPersonId: request.id,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      });
      if (activeReservations > 0) {
        blockers.push(
          `Has ${activeReservations} active asset reservation(s). Cancel or complete first.`,
        );
      } else {
        warnings.push(
          `${dependencies.reservationsFor} historical reservation(s) will be preserved.`,
        );
      }
    }

    // Warnings for preserved historical data
    if (dependencies.stockMovements > 0) {
      warnings.push(
        `${dependencies.stockMovements} stock movement record(s) will be preserved.`,
      );
    }

    if (dependencies.maintenanceRecords > 0) {
      warnings.push(
        `${dependencies.maintenanceRecords} maintenance record(s) will be preserved.`,
      );
    }

    if (
      dependencies.disposalsInitiated > 0 ||
      dependencies.disposalsApproved > 0
    ) {
      const total =
        dependencies.disposalsInitiated + dependencies.disposalsApproved;
      warnings.push(`${total} disposal record(s) will be preserved.`);
    }

    if (dependencies.kitCheckouts > 0) {
      warnings.push(
        `${dependencies.kitCheckouts} kit checkout record(s) will be preserved.`,
      );
    }

    if (dependencies.verificationCampaigns > 0) {
      warnings.push(
        `${dependencies.verificationCampaigns} verification campaign(s) will be preserved.`,
      );
    }

    if (dependencies.verificationItems > 0) {
      warnings.push(
        `${dependencies.verificationItems} verification item(s) will be preserved.`,
      );
    }

    if (dependencies.auditLogs > 0) {
      warnings.push(
        `${dependencies.auditLogs} audit log(s) will be preserved for compliance.`,
      );
    }

    if (dependencies.attachments > 0) {
      warnings.push(
        `${dependencies.attachments} attachment(s) will be preserved.`,
      );
    }

    if (dependencies.roleAssignments > 0) {
      warnings.push(
        `${dependencies.roleAssignments} role assignment(s) will be removed.`,
      );
    }

    const canDelete = blockers.length === 0;

    const message = canDelete
      ? totalDependencies > 0
        ? `Person can be soft-deleted. ${totalDependencies} related record(s) will be preserved for audit purposes.`
        : "Person can be safely deleted with no dependencies."
      : `Cannot delete person. ${blockers.length} blocker(s) must be resolved first.`;

    return {
      canDelete,
      fullName: person.fullName,
      email: person.email,
      employeeId: person.employeeId || "",
      dependencies,
      totalDependencies,
      blockers,
      warnings,
      message,
    };
  }

  /**
   * Check all person dependencies using Prisma counts
   */
  private async checkDependencies(
    personId: string,
  ): Promise<PersonDependencies> {
    const [
      person,
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
      roleAssignments,
    ] = await Promise.all([
      this.prisma.person.findUnique({
        where: { id: personId },
        select: { userId: true },
      }),
      this.prisma.organizationUnit.count({ where: { managerId: personId } }),
      this.prisma.person.count({ where: { managerId: personId } }),
      this.prisma.configurationItem.count({
        where: {
          primaryOwnerPersonId: personId,
        },
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
        where: { confirmedById: personId },
      }),
      this.prisma.assetReservation.count({
        where: { cancelledById: personId },
      }),
      this.prisma.personRoleAssignment.count({ where: { personId } }),
    ]);

    return {
      userAccount: !!person?.userId,
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
      roleAssignments,
    };
  }

  /**
   * Execute the soft delete after confirmation
   * Only call this after receiving user confirmation
   */
  async executeSoftDelete(id: string): Promise<void> {
    const person = await this.personRepository.findById(id);
    if (!person) {
      throw new Error(`Person with ID "${id}" not found`);
    }

    // Perform soft delete by setting deletedAt timestamp
    await this.prisma.person.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false, // Also mark as inactive
      },
    });
  }
}
