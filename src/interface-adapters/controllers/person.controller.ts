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
