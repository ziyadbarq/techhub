/**
 * Person Role Assignment Controller
 * Server actions for Person Role Assignment CRUD operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreatePersonRoleAssignmentSchema,
  UpdatePersonRoleAssignmentSchema,
  PersonRoleAssignmentIdSchema,
  type CreatePersonRoleAssignmentDTO,
  type UpdatePersonRoleAssignmentDTO,
} from "../dtos/generated/person-role-assignment.dto";
import {
  presentPersonRoleAssignment,
  presentPersonRoleAssignments,
  type PersonRoleAssignmentDTO,
} from "../presenters/person-role-assignment.presenter";
import type {
  CreatePersonRoleAssignmentUseCase,
  ListPersonRoleAssignmentsUseCase,
  GetPersonRoleAssignmentUseCase,
  UpdatePersonRoleAssignmentUseCase,
  DeletePersonRoleAssignmentUseCase,
} from "@/core/use-cases/foundation/person-role-assignment";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createPersonRoleAssignmentAction(
  data: CreatePersonRoleAssignmentDTO,
): Promise<ActionResponse<PersonRoleAssignmentDTO>> {
  try {
    await requirePermission(PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_CREATE);

    const validated = CreatePersonRoleAssignmentSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreatePersonRoleAssignmentUseCase>(
      DI_TOKENS.CreatePersonRoleAssignmentUseCase,
    );

    const assignment = await useCase.execute({
      personId: validated.personId,
      roleId: validated.roleId,
      startDate: validated.startDate ?? new Date(),
      endDate: validated.endDate ?? undefined,
    });

    revalidatePath("/person-role-assignments");
    revalidatePath(`/persons/${validated.personId}`);

    return {
      success: true,
      data: presentPersonRoleAssignment(assignment),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createPersonRoleAssignmentAction" },
      "Failed to create person role assignment",
    );
  }
}

export async function listPersonRoleAssignmentsAction(): Promise<
  ActionResponse<PersonRoleAssignmentDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListPersonRoleAssignmentsUseCase>(
      DI_TOKENS.ListPersonRoleAssignmentsUseCase,
    );

    const assignments = await useCase.execute();

    return {
      success: true,
      data: presentPersonRoleAssignments(assignments),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listPersonRoleAssignmentsAction" },
      "Failed to list person role assignments",
    );
  }
}

export async function getPersonRoleAssignmentAction(
  id: string,
): Promise<ActionResponse<PersonRoleAssignmentDTO>> {
  try {
    await requirePermission(PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_VIEW);

    const validated = PersonRoleAssignmentIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<GetPersonRoleAssignmentUseCase>(
      DI_TOKENS.GetPersonRoleAssignmentUseCase,
    );

    const assignment = await useCase.execute(validated.id);

    if (!assignment) {
      return {
        success: false,
        error: "Person role assignment not found",
      };
    }

    return {
      success: true,
      data: presentPersonRoleAssignment(assignment),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonRoleAssignmentAction" },
      "Failed to get person role assignment",
    );
  }
}

export async function updatePersonRoleAssignmentAction(
  data: UpdatePersonRoleAssignmentDTO,
): Promise<ActionResponse<PersonRoleAssignmentDTO>> {
  try {
    await requirePermission(PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_UPDATE);

    const validated = UpdatePersonRoleAssignmentSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdatePersonRoleAssignmentUseCase>(
      DI_TOKENS.UpdatePersonRoleAssignmentUseCase,
    );

    const assignment = await useCase.execute({
      id: validated.id,
      scope: validated.scope,
      startDate: validated.startDate ?? undefined,
      endDate: validated.endDate ?? undefined,
      isPrimary: validated.isPrimary,
      metadata: validated.metadata,
    });

    revalidatePath("/person-role-assignments");
    revalidatePath(`/person-role-assignments/${validated.id}`);
    revalidatePath(`/persons/${assignment.personId}`);

    return {
      success: true,
      data: presentPersonRoleAssignment(assignment),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updatePersonRoleAssignmentAction" },
      "Failed to update person role assignment",
    );
  }
}

export async function deletePersonRoleAssignmentAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.PERSON_ROLE_ASSIGNMENTS_DELETE);

    const validated = PersonRoleAssignmentIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<DeletePersonRoleAssignmentUseCase>(
      DI_TOKENS.DeletePersonRoleAssignmentUseCase,
    );

    await useCase.execute(validated.id);

    revalidatePath("/person-role-assignments");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deletePersonRoleAssignmentAction" },
      "Failed to delete person role assignment",
    );
  }
}
