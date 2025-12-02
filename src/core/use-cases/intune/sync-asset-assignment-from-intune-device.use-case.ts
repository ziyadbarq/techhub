/**
 * Sync Asset Assignment From Intune Device Use Case
 *
 * Automatically creates, updates, or ends asset assignments based on Intune device links.
 * When an Intune device is linked to both an asset and a person, this use case ensures
 * an AssetAssignment record exists to reflect that relationship.
 *
 * Key behaviors:
 * - Creates assignment when device has both asset + person links
 * - Updates assignment when links change
 * - Ends assignment when links are removed
 * - Detects conflicts with manual assignments
 * - Flags both assignments when persons differ
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";
import type { IIntuneDeviceRepository } from "@/core/repositories/intune-device.repository.interface";
import type { IAssetAssignmentRepository } from "@/core/repositories/asset-assignment.repository.interface";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import { AssetAssignment } from "@/core/domain/entities/asset-assignment.entity";
import type {
  SyncAssetAssignmentFromIntuneDeviceInput,
  SyncAssetAssignmentFromIntuneDeviceOutput,
} from "./sync-asset-assignment-from-intune-device.dto";

@injectable()
export class SyncAssetAssignmentFromIntuneDeviceUseCase {
  constructor(
    @inject(DI_TOKENS.IIntuneDeviceRepository)
    private readonly intuneDeviceRepo: IIntuneDeviceRepository,
    @inject(DI_TOKENS.IAssetAssignmentRepository)
    private readonly assignmentRepo: IAssetAssignmentRepository,
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepo: IPersonRepository,
  ) {}

  @LogExecution()
  async execute(
    input: SyncAssetAssignmentFromIntuneDeviceInput,
  ): Promise<SyncAssetAssignmentFromIntuneDeviceOutput> {
    // 1. Load Intune device
    const device = await this.intuneDeviceRepo.findById(input.deviceId);
    if (!device) {
      throw new Error(`Intune device not found: ${input.deviceId}`);
    }

    // 2. Check prerequisites: device must have both asset AND person links
    const hasAssetLink = device.linkedAssetId !== null;
    const hasPersonLink = device.linkedPersonId !== null;

    // If device doesn't have both links, end any existing Intune assignment
    if (!hasAssetLink || !hasPersonLink) {
      return await this.handleIncompleteLinks(device.id, input.source);
    }

    // 3. Find existing Intune assignment for this device
    const existingAssignment = await this.assignmentRepo.findBySourceReference(
      "IntuneDevice",
      device.id,
    );

    // 4. Check if assignment needs update
    const needsUpdate = existingAssignment
      ? existingAssignment.assetId !== device.linkedAssetId ||
        existingAssignment.assigneeId !== device.linkedPersonId
      : false;

    // 5. If assignment exists and is up-to-date, check conflicts and return
    if (existingAssignment && !needsUpdate) {
      await this.detectAndFlagConflicts(
        existingAssignment,
        device.linkedPersonId!,
      );
      return {
        action: "no_change",
        assignmentId: existingAssignment.id,
        message: "Assignment already up-to-date",
      };
    }

    // 6. End old assignment if it exists and needs update
    if (existingAssignment && needsUpdate) {
      existingAssignment.endAssignment();
      await this.assignmentRepo.update(existingAssignment);
    }

    // 7. Create new assignment
    const newAssignment = AssetAssignment.create({
      assetId: device.linkedAssetId!,
      assigneeType: "PERSON",
      assigneeId: device.linkedPersonId!,
      startDate: new Date(),
      endDate: null,
      isPrimary: false, // Manual assignments remain primary
      note: `Auto-assigned from Intune device ${device.deviceName || device.intuneDeviceId}`,
      source: input.source,
      sourceReferenceType: "IntuneDevice",
      sourceReferenceId: device.id,
    });

    const created = await this.assignmentRepo.create(newAssignment);

    // 8. Detect and flag conflicts
    const conflictDetails = await this.detectAndFlagConflicts(
      created,
      device.linkedPersonId!,
    );

    // 9. Return appropriate result
    if (conflictDetails) {
      return {
        action: "conflict_detected",
        assignmentId: created.id,
        conflictDetails,
        message: `Assignment created but conflict detected with manual assignment`,
      };
    }

    return {
      action: existingAssignment ? "updated" : "created",
      assignmentId: created.id,
      message: existingAssignment
        ? "Assignment updated due to link changes"
        : "Assignment created from Intune device links",
    };
  }

  /**
   * Handle case where device has incomplete links (missing asset or person)
   * Ends any existing Intune assignment for this device
   */
  private async handleIncompleteLinks(
    deviceId: string,
    _source: "INTUNE_SYNC" | "INTUNE_MANUAL",
  ): Promise<SyncAssetAssignmentFromIntuneDeviceOutput> {
    const existingAssignment = await this.assignmentRepo.findBySourceReference(
      "IntuneDevice",
      deviceId,
    );

    if (existingAssignment && existingAssignment.isActive()) {
      existingAssignment.endAssignment();
      await this.assignmentRepo.update(existingAssignment);

      return {
        action: "ended",
        assignmentId: existingAssignment.id,
        message: "Assignment ended - device missing asset or person link",
      };
    }

    return {
      action: "skipped",
      assignmentId: null,
      message: "Device missing asset or person link - no assignment created",
    };
  }

  /**
   * Detect conflicts with manual assignments and flag both if persons differ
   * Returns conflict details if conflict found, null otherwise
   */
  private async detectAndFlagConflicts(
    intuneAssignment: AssetAssignment,
    intunePersonId: string,
  ): Promise<
    SyncAssetAssignmentFromIntuneDeviceOutput["conflictDetails"] | null
  > {
    // Find all active manual assignments for the same asset
    const allActiveAssignments = await this.assignmentRepo.findActiveByAsset(
      intuneAssignment.assetId,
    );

    const manualAssignments = allActiveAssignments.filter(
      (a) =>
        a.isManual() &&
        a.assigneeType === "PERSON" &&
        a.id !== intuneAssignment.id,
    );

    // Check for conflicts: manual assignment to different person
    const conflictingAssignment = manualAssignments.find(
      (a) => a.assigneeId !== intunePersonId,
    );

    if (conflictingAssignment) {
      // Load person details for conflict message
      const intunePerson = await this.personRepo.findById(intunePersonId);
      const manualPerson = await this.personRepo.findById(
        conflictingAssignment.assigneeId,
      );

      const intunePersonName = intunePerson
        ? `${intunePerson.firstName} ${intunePerson.lastName}`
        : "Unknown";
      const manualPersonName = manualPerson
        ? `${manualPerson.firstName} ${manualPerson.lastName}`
        : "Unknown";

      // Flag both assignments
      intuneAssignment.flagConflict(
        `Manual assignment to ${manualPersonName} (${conflictingAssignment.assigneeId})`,
      );
      await this.assignmentRepo.update(intuneAssignment);

      conflictingAssignment.flagConflict(
        `Intune assignment to ${intunePersonName} (${intunePersonId})`,
      );
      await this.assignmentRepo.update(conflictingAssignment);

      return {
        intunePersonId,
        intunePersonName,
        manualPersonId: conflictingAssignment.assigneeId,
        manualPersonName,
      };
    }

    // No conflict - clear any existing conflict flags
    if (intuneAssignment.hasConflict) {
      intuneAssignment.clearConflict();
      await this.assignmentRepo.update(intuneAssignment);
    }

    // Also clear conflicts on manual assignments to the same person
    for (const manualAssignment of manualAssignments.filter(
      (a) => a.assigneeId === intunePersonId && a.hasConflict,
    )) {
      manualAssignment.clearConflict();
      await this.assignmentRepo.update(manualAssignment);
    }

    return null;
  }
}
