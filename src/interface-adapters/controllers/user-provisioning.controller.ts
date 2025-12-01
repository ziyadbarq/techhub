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
import type { LinkUserToPersonUseCase } from "@/core/use-cases/user-provisioning/link-user-to-person.use-case";
import type { CheckPermissionUseCase } from "@/core/use-cases/rbac/check-permission.use-case";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { IUserRepository } from "@/core/repositories/user-repository.interface";

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
    const personRepository = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );
    const persons = await personRepository.findNotLinkedToUsersWithDetails();

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
      orgUnit: person.orgUnit ?? { id: "", name: "" },
      primaryRole:
        person.primaryRole ??
        ({
          id: "",
          name: "",
          displayName: "",
        } as PersonWithoutUserDTO["primaryRole"]),
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
    const userRepository = container.get<IUserRepository>(
      DI_TOKENS.IUserRepository,
    );
    const updatedUser = await userRepository.findByIdWithPerson(userId);

    return {
      success: true,
      data: {
        ...result,
        personId: updatedUser?.personId ?? "",
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

// ============================================================================
// User-Person Linking DTOs and Actions
// ============================================================================

/**
 * User without Person DTO
 */
export interface UserWithoutPersonDTO {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
}

/**
 * Person available for linking DTO
 */
export interface PersonForLinkingDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string | null;
  title: string | null;
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
 * User available for linking DTO
 */
export interface UserForLinkingDTO {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
}

/**
 * Link result DTO
 */
export interface LinkResultDTO {
  userId: string;
  personId: string;
  email: string;
  personName: string;
}

/**
 * List all Users without linked Person records
 *
 * Used for the user provisioning UI to show which users
 * don't have Person records linked yet.
 */
export async function listUsersWithoutPersonsAction(): Promise<
  ActionResponse<UserWithoutPersonDTO[]>
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

    // Fetch Users without linked Person
    const userRepository = container.get<IUserRepository>(
      DI_TOKENS.IUserRepository,
    );
    const users = await userRepository.findWithoutPerson();

    return { success: true, data: users };
  } catch (error) {
    const { user } = await getSession();
    return handleControllerError(
      error,
      {
        function: "listUsersWithoutPersonsAction",
        userId: user?.id,
      },
      "Failed to list users without persons",
    );
  }
}

/**
 * List unlinked Persons that match a User's email
 *
 * Used to find Person records that can be linked to a specific User.
 * Only returns Persons with matching email (case-insensitive).
 */
export async function listUnlinkedPersonsForUserAction(
  userId: string,
): Promise<ActionResponse<PersonForLinkingDTO[]>> {
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

    // Get the target user's email
    const userRepository = container.get<IUserRepository>(
      DI_TOKENS.IUserRepository,
    );
    const targetUser = await userRepository.findById(userId);

    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    // Find unlinked Persons with matching email
    const personRepository = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );
    const persons = await personRepository.findNotLinkedToUsersByEmail(
      targetUser.email,
    );

    const data: PersonForLinkingDTO[] = persons.map((person) => ({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      employeeId: person.employeeId,
      title: person.title,
      orgUnit: person.orgUnit ?? { id: "", name: "" },
      primaryRole:
        person.primaryRole ??
        ({
          id: "",
          name: "",
          displayName: "",
        } as PersonForLinkingDTO["primaryRole"]),
    }));

    return { success: true, data };
  } catch (error) {
    const { user } = await getSession();
    return handleControllerError(
      error,
      {
        function: "listUnlinkedPersonsForUserAction",
        userId: user?.id,
        targetUserId: userId,
      },
      "Failed to list unlinked persons for user",
    );
  }
}

/**
 * List unlinked Users that match a Person's email
 *
 * Used to find User records that can be linked to a specific Person.
 * Only returns Users with matching email (case-insensitive).
 */
export async function listUnlinkedUsersForPersonAction(
  personId: string,
): Promise<ActionResponse<UserForLinkingDTO[]>> {
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

    // Get the target person's email
    const personRepository = container.get<IPersonRepository>(
      DI_TOKENS.IPersonRepository,
    );
    const targetPerson = await personRepository.findById(personId);

    if (!targetPerson) {
      return { success: false, error: "Person not found" };
    }

    // Find unlinked Users with matching email
    const userRepository = container.get<IUserRepository>(
      DI_TOKENS.IUserRepository,
    );
    const users = await userRepository.findWithoutPersonByEmail(
      targetPerson.email,
    );

    return { success: true, data: users };
  } catch (error) {
    const { user } = await getSession();
    return handleControllerError(
      error,
      {
        function: "listUnlinkedUsersForPersonAction",
        userId: user?.id,
        targetPersonId: personId,
      },
      "Failed to list unlinked users for person",
    );
  }
}

/**
 * Link an existing User to an existing Person
 *
 * Validates that both exist, are not already linked,
 * and have matching emails.
 */
export async function linkUserToPersonAction(
  userId: string,
  personId: string,
): Promise<ActionResponse<LinkResultDTO>> {
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
    const linkUserToPerson = container.get<LinkUserToPersonUseCase>(
      DI_TOKENS.LinkUserToPersonUseCase,
    );

    const result = await linkUserToPerson.execute({
      userId,
      personId,
      linkedBy: user.id,
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
        function: "linkUserToPersonAction",
        userId: user?.id,
        targetUserId: userId,
        targetPersonId: personId,
      },
      "Failed to link user to person",
    );
  }
}
