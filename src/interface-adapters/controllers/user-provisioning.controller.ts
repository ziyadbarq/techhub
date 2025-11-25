/**
 * User Provisioning Controller
 *
 * Server actions for admin user account creation and password management.
 * Handles creating User accounts for existing Persons and resetting passwords.
 */

"use server";

import { revalidatePath } from "next/cache";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import { getSession } from "@/lib/auth/session";
import type { CreateUserForPersonUseCase } from "@/core/use-cases/user-provisioning/create-user-for-person.use-case";
import type { ResetUserPasswordUseCase } from "@/core/use-cases/user-provisioning/reset-user-password.use-case";
import type { CheckPermissionUseCase } from "@/core/use-cases/rbac/check-permission.use-case";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { prisma } from "@/infrastructure/database/prisma/client";

/**
 * Person without User account DTO
 */
export interface PersonWithoutUserDTO {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  employeeId: string | null;
  title: string | null;
  department: string | null;
  isActive: boolean;
  orgUnit: {
    id: string;
    name: string;
  };
  primaryRole: {
    id: string;
    name: string;
    displayName: string;
  };
}

/**
 * User credentials DTO (returned after user creation/password reset)
 */
export interface UserCredentialsDTO {
  userId: string;
  personId: string;
  email: string;
  password: string;
  passwordGenerated: boolean;
}

/**
 * List all Persons without linked User accounts
 *
 * Used for the user provisioning UI to show which employees
 * don't have login access yet.
 */
export async function listPersonsWithoutUsersAction(): Promise<
  ActionResponse<PersonWithoutUserDTO[]>
> {
  try {
    // Check permission
    const { user } = await getSession();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const container = getContainer();
    const checkPermission = container.get<CheckPermissionUseCase>(
      DI_TOKENS.CheckPermissionUseCase,
    );

    const hasPermission = await checkPermission.execute({
      userId: user.id,
      permission: PERMISSIONS.USERS_MANAGE,
    });

    if (!hasPermission) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Fetch Persons without userId
    const persons = await prisma.person.findMany({
      where: {
        userId: null,
        isActive: true, // Only show active employees
      },
      include: {
        orgUnit: {
          select: {
            id: true,
            name: true,
          },
        },
        primaryRole: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    const data: PersonWithoutUserDTO[] = persons.map((person) => ({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      middleName: person.middleName,
      email: person.email,
      employeeId: person.employeeId,
      title: person.title,
      department: person.department,
      isActive: person.isActive,
      orgUnit: person.orgUnit,
      primaryRole: person.primaryRole,
    }));

    return { success: true, data };
  } catch (error) {
    const { user } = await getSession();
    return handleControllerError(
      error,
      {
        function: "listPersonsWithoutUsersAction",
        userId: user?.id,
      },
      "Failed to list persons without user accounts",
    );
  }
}

/**
 * Create a User account for an existing Person
 *
 * Generates a secure random password, creates the User account,
 * links it to the Person, and assigns default viewer role.
 *
 * @param personId - ID of the Person to create User account for
 * @returns User credentials including the generated password (only shown once!)
 */
export async function createUserForPersonAction(
  personId: string,
): Promise<ActionResponse<UserCredentialsDTO>> {
  try {
    // Check permission
    const { user } = await getSession();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const container = getContainer();
    const checkPermission = container.get<CheckPermissionUseCase>(
      DI_TOKENS.CheckPermissionUseCase,
    );

    const hasPermission = await checkPermission.execute({
      userId: user.id,
      permission: PERMISSIONS.USERS_MANAGE,
    });

    if (!hasPermission) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Execute use case
    const createUserForPerson = container.get<CreateUserForPersonUseCase>(
      DI_TOKENS.CreateUserForPersonUseCase,
    );

    const result = await createUserForPerson.execute({
      personId,
      createdBy: user.id,
    });

    // Revalidate relevant pages
    revalidatePath("/admin/users");
    revalidatePath("/admin/user-provisioning");

    return { success: true, data: result };
  } catch (error) {
    const { user } = await getSession();
    return handleControllerError(
      error,
      {
        function: "createUserForPersonAction",
        userId: user?.id,
        personId,
      },
      "Failed to create user account for person",
    );
  }
}

/**
 * Reset a user's password
 *
 * Generates a new secure random password and updates the user's account.
 * Invalidates all existing sessions to force re-login.
 *
 * @param userId - ID of the User to reset password for
 * @returns New user credentials including the generated password
 */
export async function resetUserPasswordAction(
  userId: string,
): Promise<ActionResponse<UserCredentialsDTO>> {
  try {
    // Check permission
    const { user } = await getSession();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const container = getContainer();
    const checkPermission = container.get<CheckPermissionUseCase>(
      DI_TOKENS.CheckPermissionUseCase,
    );

    const hasPermission = await checkPermission.execute({
      userId: user.id,
      permission: PERMISSIONS.USERS_MANAGE,
    });

    if (!hasPermission) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Execute use case
    const resetUserPassword = container.get<ResetUserPasswordUseCase>(
      DI_TOKENS.ResetUserPasswordUseCase,
    );

    const result = await resetUserPassword.execute({
      userId,
      resetBy: user.id,
    });

    // Revalidate relevant pages
    revalidatePath("/admin/users");

    // Return result with personId (need to fetch from user)
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { person: { select: { id: true } } },
    });

    return {
      success: true,
      data: {
        ...result,
        personId: updatedUser?.person?.id ?? "",
      },
    };
  } catch (error) {
    const { user } = await getSession();
    return handleControllerError(
      error,
      {
        function: "resetUserPasswordAction",
        userId: user?.id,
        targetUserId: userId,
      },
      "Failed to reset user password",
    );
  }
}
