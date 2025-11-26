/**
 * Person Controller
 * Server actions for Person CRUD operations
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import {
  CreatePersonSchema,
  UpdatePersonSchema,
  PersonIdSchema,
  type CreatePersonDTO,
  type UpdatePersonDTO,
} from "../dtos/generated/person.dto";
import {
  presentPerson,
  presentPersons,
  type PersonDTO,
} from "../presenters/person.presenter";
import type {
  CreatePersonUseCase,
  ListPeopleUseCase,
  GetPersonUseCase,
  UpdatePersonUseCase,
  DeletePersonUseCase,
  TogglePersonExclusionUseCase,
  TogglePersonStatusUseCase,
} from "@/core/use-cases/foundation/person";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export async function createPersonAction(
  data: CreatePersonDTO,
): Promise<ActionResponse<PersonDTO>> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_CREATE);

    const validated = CreatePersonSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<CreatePersonUseCase>(
      DI_TOKENS.CreatePersonUseCase,
    );

    const person = await useCase.execute({
      firstName: validated.firstName,
      lastName: validated.lastName,
      middleName: validated.middleName ?? undefined,
      email: validated.email,
      phone: validated.phone ?? undefined,
      mobile: validated.mobile ?? undefined,
      employeeId: validated.employeeId ?? undefined,
      orgUnitId: validated.organizationUnitId,
      primaryRoleId: validated.primaryRoleId,
      locationId: validated.locationId ?? undefined,
      managerId: validated.managerId ?? undefined,
      title: validated.title ?? undefined,
      department: validated.department ?? undefined,
      hireDate: validated.hireDate ?? undefined,
    });

    revalidatePath("/persons");

    return {
      success: true,
      data: presentPerson(person),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "createPersonAction" },
      "Failed to create person",
    );
  }
}

export async function listPersonsAction(): Promise<
  ActionResponse<PersonDTO[]>
> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_VIEW);

    const container = getContainer();
    const useCase = container.get<ListPeopleUseCase>(
      DI_TOKENS.ListPersonsUseCase,
    );

    const persons = await useCase.execute();

    return {
      success: true,
      data: presentPersons(persons),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "listPersonsAction" },
      "Failed to list persons",
    );
  }
}

export async function getPersonAction(
  id: string,
): Promise<ActionResponse<PersonDTO>> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_VIEW);

    const validated = PersonIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<GetPersonUseCase>(DI_TOKENS.GetPersonUseCase);

    const person = await useCase.execute(validated.id);

    if (!person) {
      return {
        success: false,
        error: "Person not found",
      };
    }

    return {
      success: true,
      data: presentPerson(person),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "getPersonAction" },
      "Failed to get person",
    );
  }
}

export async function updatePersonAction(
  data: UpdatePersonDTO,
): Promise<ActionResponse<PersonDTO>> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_UPDATE);

    const validated = UpdatePersonSchema.parse(data);

    const container = getContainer();
    const useCase = container.get<UpdatePersonUseCase>(
      DI_TOKENS.UpdatePersonUseCase,
    );

    const person = await useCase.execute({
      id: validated.id,
      firstName: validated.firstName,
      lastName: validated.lastName,
      middleName: validated.middleName,
      email: validated.email,
      phone: validated.phone,
      mobile: validated.mobile,
      employeeId: validated.employeeId,
      orgUnitId: validated.organizationUnitId ?? undefined,
      primaryRoleId: validated.primaryRoleId ?? undefined,
      locationId: validated.locationId,
      managerId: validated.managerId,
      title: validated.title,
      department: validated.department,
      hireDate: validated.hireDate,
      terminationDate: validated.terminationDate,
      metadata: validated.metadata,
    });

    revalidatePath("/persons");
    revalidatePath(`/persons/${validated.id}`);

    return {
      success: true,
      data: presentPerson(person),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "updatePersonAction" },
      "Failed to update person",
    );
  }
}

export async function deletePersonAction(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_DELETE);

    const validated = PersonIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<DeletePersonUseCase>(
      DI_TOKENS.DeletePersonUseCase,
    );

    await useCase.execute(validated.id);

    revalidatePath("/persons");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "deletePersonAction" },
      "Failed to delete person",
    );
  }
}

export async function togglePersonStatusAction(
  id: string,
  isActive: boolean,
): Promise<ActionResponse<PersonDTO>> {
  try {
    // Use PERSONS_MANAGE for enabling/disabling users
    await requirePermission(PERMISSIONS.PERSONS_MANAGE);

    const validated = PersonIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<TogglePersonStatusUseCase>(
      DI_TOKENS.TogglePersonStatusUseCase,
    );

    const person = await useCase.execute({
      id: validated.id,
      isActive,
    });

    revalidatePath("/persons");

    return {
      success: true,
      data: presentPerson(person),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "togglePersonStatusAction" },
      `Failed to ${isActive ? "enable" : "disable"} person`,
    );
  }
}

/**
 * Toggle person exclusion from TechHub
 * Excluded persons are hidden from app activities but remain active in Azure AD
 */
export async function togglePersonExclusionAction(
  id: string,
  isExcluded: boolean,
): Promise<ActionResponse<PersonDTO>> {
  try {
    // Use PERSONS_MANAGE for excluding/including users
    await requirePermission(PERMISSIONS.PERSONS_MANAGE);

    const validated = PersonIdSchema.parse({ id });

    const container = getContainer();
    const useCase = container.get<TogglePersonExclusionUseCase>(
      DI_TOKENS.TogglePersonExclusionUseCase,
    );

    const person = await useCase.execute({
      id: validated.id,
      isExcluded,
    });

    revalidatePath("/persons");

    return {
      success: true,
      data: presentPerson(person),
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "togglePersonExclusionAction" },
      `Failed to ${isExcluded ? "exclude" : "include"} person`,
    );
  }
}

export async function bulkCreatePersonsAction(
  personsData: CreatePersonDTO[],
): Promise<
  ActionResponse<{
    successCount: number;
    failureCount: number;
    failures: Array<{ index: number; email: string; error: string }>;
  }>
> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_CREATE);

    const container = getContainer();
    const useCase = container.get<CreatePersonUseCase>(
      DI_TOKENS.CreatePersonUseCase,
    );

    const results = {
      successCount: 0,
      failureCount: 0,
      failures: [] as Array<{ index: number; email: string; error: string }>,
    };

    // Process persons sequentially to avoid overwhelming the database
    for (let i = 0; i < personsData.length; i++) {
      const personData = personsData[i];
      try {
        const validated = CreatePersonSchema.parse(personData);

        await useCase.execute({
          firstName: validated.firstName,
          lastName: validated.lastName,
          middleName: validated.middleName ?? undefined,
          email: validated.email,
          phone: validated.phone ?? undefined,
          mobile: validated.mobile ?? undefined,
          employeeId: validated.employeeId ?? undefined,
          orgUnitId: validated.organizationUnitId,
          primaryRoleId: validated.primaryRoleId,
          locationId: validated.locationId ?? undefined,
          managerId: validated.managerId ?? undefined,
          title: validated.title ?? undefined,
          department: validated.department ?? undefined,
          hireDate: validated.hireDate ?? undefined,
        });

        results.successCount++;
      } catch (error) {
        results.failureCount++;
        results.failures.push({
          index: i,
          email: personData.email || "Unknown",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/persons");

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "bulkCreatePersonsAction" },
      "Failed to bulk create persons",
    );
  }
}
