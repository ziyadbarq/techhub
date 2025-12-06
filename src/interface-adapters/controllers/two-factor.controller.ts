/**
 * Two-Factor Authentication Controller
 * Server actions for managing 2FA (TOTP) setup, verification, and backup codes
 */

"use server";

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { auth } from "@/infrastructure/services/auth/better-auth";
import type { ActionResponse } from "./types";
import { handleControllerError } from "./error-handler";
import { getCurrentUserId } from "@/lib/auth/session";
import { z } from "zod";
import { headers } from "next/headers";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
  canAttempt2FAVerification,
  reset2FARateLimit,
} from "@/infrastructure/rate-limiting/two-factor-rate-limiter";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { prisma } from "@/infrastructure/database/prisma/client";

// ============================================================================
// 2FA Setup Actions
// ============================================================================

const PasswordSchema = z
  .string()
  .min(1, "Password is required for this operation");

const TOTPCodeSchema = z
  .string()
  .length(6, "TOTP code must be 6 digits")
  .regex(/^\d{6}$/, "TOTP code must contain only digits");

export interface Enable2FAResult {
  totpUri: string;
  backupCodes: string[];
}

/**
 * Enable 2FA for the current user
 * Returns TOTP URI (for QR code) and backup codes
 *
 * @param password - User's password for verification
 * @returns TOTP URI and backup codes
 */
export async function enable2FAAction(
  password: string,
): Promise<ActionResponse<Enable2FAResult>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate password
    const validatedPassword = PasswordSchema.parse(password);

    // Get request headers for authentication
    const requestHeaders = await headers();

    // Call Better Auth to enable 2FA
    const result = await auth.api.enableTwoFactor({
      body: {
        password: validatedPassword,
      },
      headers: requestHeaders,
    });

    if (!result || typeof result !== "object") {
      return {
        success: false,
        error: "Failed to enable 2FA. Please try again.",
      };
    }

    // Extract data from Better Auth response
    const responseData = result as {
      totpUri?: string;
      totpURI?: string;
      backupCodes?: string[];
    };
    const totpUri = responseData.totpUri ?? responseData.totpURI;

    if (!totpUri || !responseData.backupCodes) {
      return {
        success: false,
        error: "Invalid response from 2FA setup. Please try again.",
      };
    }

    return {
      success: true,
      data: {
        totpUri,
        backupCodes: responseData.backupCodes,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "enable2FAAction" },
      "Failed to enable 2FA",
    );
  }
}

/**
 * Verify TOTP code during 2FA setup
 * Completes the 2FA enablement process
 *
 * Rate Limited: 5 attempts per 15 minutes per user
 *
 * @param code - 6-digit TOTP code from authenticator app
 */
export async function verify2FASetupAction(
  code: string,
): Promise<ActionResponse<{ verified: boolean }>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Check rate limit
    const rateLimitResult = await canAttempt2FAVerification(userId);
    if (!rateLimitResult.allowed) {
      const minutes = Math.ceil((rateLimitResult.resetAfterSeconds || 0) / 60);
      return {
        success: false,
        error: `Too many failed attempts. Please try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`,
      };
    }

    // Validate code format
    const validatedCode = TOTPCodeSchema.parse(code);

    // Get request headers for authentication
    const requestHeaders = await headers();

    // Call Better Auth to verify the code
    const result = await auth.api.verifyTOTP({
      body: {
        code: validatedCode,
      },
      headers: requestHeaders,
    });

    if (!result || typeof result !== "object") {
      return {
        success: false,
        error: "Invalid TOTP code. Please try again.",
      };
    }

    const responseData = result as { token?: string } | undefined;
    if (!responseData || typeof responseData !== "object") {
      return {
        success: false,
        error: "Invalid TOTP code. Please try again.",
      };
    }

    // Success - reset rate limit
    await reset2FARateLimit(userId);

    // Invalidate all existing sessions by incrementing tokenVersion
    // This forces users to re-authenticate on all devices after enabling 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        tokenVersion: { increment: 1 },
      },
    });

    return { success: true, data: { verified: true } };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "verify2FASetupAction" },
      "Failed to verify 2FA code",
    );
  }
}

// ============================================================================
// 2FA Management Actions
// ============================================================================

/**
 * Disable 2FA for the current user
 * Requires password confirmation
 *
 * @param password - User's password for verification
 */
export async function disable2FAAction(
  password: string,
): Promise<ActionResponse<{ disabled: boolean }>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate password
    const validatedPassword = PasswordSchema.parse(password);

    // Get request headers for authentication
    const requestHeaders = await headers();

    // Call Better Auth to disable 2FA
    const result = await auth.api.disableTwoFactor({
      body: {
        password: validatedPassword,
      },
      headers: requestHeaders,
    });

    if (!result || typeof result !== "object") {
      return {
        success: false,
        error:
          "Failed to disable 2FA. Please verify your password and try again.",
      };
    }

    // Invalidate all existing sessions by incrementing tokenVersion
    // This forces users to re-authenticate on all devices after disabling 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        tokenVersion: { increment: 1 },
      },
    });

    return {
      success: true,
      data: { disabled: true },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "disable2FAAction" },
      "Failed to disable 2FA",
    );
  }
}

/**
 * Regenerate backup codes for the current user
 * Requires password confirmation
 * Old backup codes will be invalidated
 *
 * @param password - User's password for verification
 * @returns New backup codes
 */
export async function regenerateBackupCodesAction(
  password: string,
): Promise<ActionResponse<{ backupCodes: string[] }>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate password
    const validatedPassword = PasswordSchema.parse(password);

    // Get request headers for authentication
    const requestHeaders = await headers();

    // Call Better Auth to regenerate backup codes
    const result = await auth.api.generateBackupCodes({
      body: {
        password: validatedPassword,
      },
      headers: requestHeaders,
    });

    if (!result || typeof result !== "object") {
      return {
        success: false,
        error:
          "Failed to regenerate backup codes. Please verify your password and try again.",
      };
    }

    const responseData = result as { backupCodes?: string[] };

    if (!responseData.backupCodes) {
      return {
        success: false,
        error:
          "Invalid response from backup codes generation. Please try again.",
      };
    }

    return {
      success: true,
      data: {
        backupCodes: responseData.backupCodes,
      },
    };
  } catch (error) {
    return handleControllerError(
      error,
      { function: "regenerateBackupCodesAction" },
      "Failed to regenerate backup codes",
    );
  }
}
