/**
 * Setup Controller
 * Server actions for first-time setup (admin role assignment)
 */

"use server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import type { CheckFirstAdminUseCase } from "@/core/use-cases/rbac/check-first-admin.use-case";
import { type CheckFirstAdminResult } from "@/core/use-cases/rbac/check-first-admin.use-case";
import type { AssignFirstAdminUseCase } from "@/core/use-cases/rbac/assign-first-admin.use-case";
import { type AssignFirstAdminResult } from "@/core/use-cases/rbac/assign-first-admin.use-case";
import { getCurrentUserId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

/**
 * Check if first admin setup is needed
 */
export async function checkFirstAdminAction(): Promise<
  ActionResponse<CheckFirstAdminResult>
> {
  try {
    const container = getContainer();
    const checkFirstAdmin = container.get<CheckFirstAdminUseCase>(
      DI_TOKENS.CheckFirstAdminUseCase,
    );

    const result = await checkFirstAdmin.execute();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "checkFirstAdminAction" },
      "Failed to check admin status",
    );
  }
}

/**
 * Assign admin role to current user (first-time setup)
 */
export async function assignFirstAdminAction(): Promise<
  ActionResponse<AssignFirstAdminResult>
> {
  try {
    // Get current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const container = getContainer();
    const assignFirstAdmin = container.get<AssignFirstAdminUseCase>(
      DI_TOKENS.AssignFirstAdminUseCase,
    );

    const result = await assignFirstAdmin.execute({
      userId,
      metadata: {
        // You could add IP/UA tracking here if needed
      },
    });

    if (result.success) {
      // Revalidate to update permissions
      revalidatePath("/");
      revalidatePath("/setup");
      revalidatePath("/admin");
    }

    return result.success
      ? { success: true as const, data: result }
      : { success: false as const, error: result.message };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "assignFirstAdminAction" },
      "Failed to assign admin role",
    );
  }
}
