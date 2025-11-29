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
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
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
      locationId: validated.locationId || undefined,
      managerId: validated.managerId || undefined,
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
      locationId: validated.locationId || null,
      managerId: validated.managerId || null,
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

/**
 * Check for existing persons by email (batch lookup for duplicate detection)
 * Uses email as the primary unique field for duplicate detection
 */
export async function checkPersonDuplicatesAction(emails: string[]): Promise<{
  success: boolean;
  data?: {
    duplicates: Array<{ id: string; email: string; fullName: string }>;
    duplicateCount: number;
  };
  error?: string;
}> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_CREATE);

    const container = getContainer();
    const repository = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );

    // Filter out empty values
    const validEmails = emails.filter(
      (e) => e !== null && e !== undefined && e.trim() !== "",
    );

    if (validEmails.length === 0) {
      return {
        success: true,
        data: { duplicates: [], duplicateCount: 0 },
      };
    }

    // Batch lookup existing persons by email
    const existingPersons = await repository.findByEmails(validEmails);

    const duplicates = existingPersons.map((person) => ({
      id: person.id,
      email: person.email,
      fullName: `${person.firstName} ${person.lastName}`,
    }));

    return {
      success: true,
      data: {
        duplicates,
        duplicateCount: duplicates.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to check duplicates",
    };
  }
}

/**
 * Bulk upsert persons (create or update based on duplicate strategy)
 * For "overwrite" strategy: updates existing records, creates new ones
 * For "skip" strategy: skips existing records, creates new ones
 */
export async function bulkUpsertPersonsAction(
  personsData: Record<string, unknown>[],
  strategy: "skip" | "overwrite" | "fail" | "append",
): Promise<{
  success: boolean;
  data?: {
    createdCount: number;
    updatedCount: number;
    skipCount: number;
    failureCount: number;
    created?: Array<{ email: string; fullName: string }>;
    updated?: Array<{ email: string; fullName: string }>;
    skipped?: Array<{ identifier: string; reason: string }>;
    failures?: Array<{ index: number; identifier: string; error: string }>;
  };
  error?: string;
}> {
  try {
    await requirePermission(PERMISSIONS.PERSONS_CREATE);

    const container = getContainer();
    const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);
    const repository = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );
    const createUseCase = container.get<CreatePersonUseCase>(
      DI_TOKENS.CreatePersonUseCase,
    );
    const updateUseCase = container.get<UpdatePersonUseCase>(
      DI_TOKENS.UpdatePersonUseCase,
    );

    const log = logger.child({
      controller: "person.bulkUpsert",
      rows: personsData.length,
      strategy,
    });
    log.info("Bulk person upsert started");

    const results = {
      createdCount: 0,
      updatedCount: 0,
      skipCount: 0,
      failureCount: 0,
      created: [] as Array<{ email: string; fullName: string }>,
      updated: [] as Array<{ email: string; fullName: string }>,
      skipped: [] as Array<{ identifier: string; reason: string }>,
      failures: [] as Array<{
        index: number;
        identifier: string;
        error: string;
      }>,
    };

    // Step 1: Collect emails for batch lookup
    const emails = personsData
      .map((p) => p.email as string | undefined)
      .filter((e): e is string => !!e && e.trim() !== "");

    // Step 2: Batch lookup existing persons
    const existingPersons = await repository.findByEmails(emails);
    const existingByEmail = new Map(
      existingPersons.map((p) => [p.email.toLowerCase(), p]),
    );

    // Step 3: Process each record
    for (let i = 0; i < personsData.length; i++) {
      const personData = personsData[i];
      const identifier = (personData.email as string) || `Row ${i + 1}`;

      try {
        const validated = CreatePersonSchema.parse(personData);
        const existingPerson = validated.email
          ? existingByEmail.get(validated.email.toLowerCase())
          : null;

        if (existingPerson) {
          // Handle duplicate based on strategy
          switch (strategy) {
            case "skip":
              results.skipCount++;
              results.skipped.push({
                identifier,
                reason: `Email "${validated.email}" already exists`,
              });
              break;

            case "overwrite": {
              // Merge/patch: only update non-empty fields from import
              const updateData: Record<string, unknown> = {
                id: existingPerson.id,
              };
              if (validated.firstName)
                updateData.firstName = validated.firstName;
              if (validated.lastName) updateData.lastName = validated.lastName;
              if (validated.middleName)
                updateData.middleName = validated.middleName;
              if (validated.phone) updateData.phone = validated.phone;
              if (validated.mobile) updateData.mobile = validated.mobile;
              if (validated.employeeId)
                updateData.employeeId = validated.employeeId;
              if (validated.organizationUnitId)
                updateData.organizationUnitId = validated.organizationUnitId;
              if (validated.primaryRoleId)
                updateData.primaryRoleId = validated.primaryRoleId;
              if (validated.locationId)
                updateData.locationId = validated.locationId;
              if (validated.managerId)
                updateData.managerId = validated.managerId;
              if (validated.title) updateData.title = validated.title;
              if (validated.department)
                updateData.department = validated.department;
              if (validated.hireDate) updateData.hireDate = validated.hireDate;

              await updateUseCase.execute(updateData as UpdatePersonDTO);
              results.updatedCount++;
              results.updated.push({
                email: existingPerson.email,
                fullName: `${validated.firstName} ${validated.lastName}`,
              });
              break;
            }

            case "fail":
              results.failureCount++;
              results.failures.push({
                index: i,
                identifier,
                error: `Duplicate email "${validated.email}" not allowed`,
              });
              break;

            case "append": {
              // Create with modified email
              const modifiedEmail = `${validated.email.split("@")[0]}-copy-${Date.now()}@${validated.email.split("@")[1]}`;
              await createUseCase.execute({
                firstName: validated.firstName,
                lastName: validated.lastName,
                middleName: validated.middleName ?? undefined,
                email: modifiedEmail,
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
              results.createdCount++;
              results.created.push({
                email: modifiedEmail,
                fullName: `${validated.firstName} ${validated.lastName}`,
              });
              break;
            }
          }
        } else {
          // No duplicate - create new record
          await createUseCase.execute({
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
          results.createdCount++;
          results.created.push({
            email: validated.email,
            fullName: `${validated.firstName} ${validated.lastName}`,
          });
        }
      } catch (error) {
        results.failureCount++;
        results.failures.push({
          index: i,
          identifier,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    revalidatePath("/persons");

    log.info("Bulk person upsert completed", {
      createdCount: results.createdCount,
      updatedCount: results.updatedCount,
      skipCount: results.skipCount,
      failureCount: results.failureCount,
    });

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to bulk upsert persons",
    };
  }
}
