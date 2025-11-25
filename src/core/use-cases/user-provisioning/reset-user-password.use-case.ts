/**
 * Reset User Password Use Case
 *
 * Generates a new password for a user and updates their account.
 * Used by administrators to reset forgotten passwords or provision
 * new credentials for users.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IUserRepository } from "@/core/repositories/user-repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { generateSecurePassword, hashPassword } from "@/lib/utils/password";

export interface ResetUserPasswordRequest {
  userId: string;
  /** If not provided, a secure random password will be generated */
  newPassword?: string;
  /** User ID performing the reset (for audit trail) */
  resetBy?: string;
}

export interface ResetUserPasswordResponse {
  userId: string;
  email: string;
  /** The plain text password (only returned once, store securely!) */
  password: string;
  /** Whether the password was auto-generated */
  passwordGenerated: boolean;
}

@injectable()
export class ResetUserPasswordUseCase {
  constructor(
    @inject(DI_TOKENS.IUserRepository)
    private userRepository: IUserRepository,
    @inject(DI_TOKENS.ILoggerService)
    private logger: ILoggerService,
  ) {}

  async execute(
    request: ResetUserPasswordRequest,
  ): Promise<ResetUserPasswordResponse> {
    this.logger.info("Resetting user password", {
      userId: request.userId,
      resetBy: request.resetBy,
      hasProvidedPassword: !!request.newPassword,
    });

    // 1. Validate user exists
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error(`User not found: ${request.userId}`);
    }

    // 2. Generate or use provided password
    const plainPassword = request.newPassword ?? generateSecurePassword();
    const passwordGenerated = !request.newPassword;

    // 3. Hash password
    const passwordHash = await hashPassword(plainPassword);

    // 4. Update user's password (also invalidates sessions)
    await this.userRepository.updatePassword(user.id, passwordHash);

    this.logger.info("Password reset successfully", {
      userId: user.id,
      email: user.email,
      resetBy: request.resetBy,
    });

    return {
      userId: user.id,
      email: user.email,
      password: plainPassword,
      passwordGenerated,
    };
  }
}
