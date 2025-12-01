/**
 * User Provisioning Module - DI Bindings
 *
 * Binds use cases for admin user account provisioning and password management.
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { logger } from "@/lib/logger";

// Use Cases
import { CreateUserForPersonUseCase } from "@/core/use-cases/user-provisioning/create-user-for-person.use-case";
import { ResetUserPasswordUseCase } from "@/core/use-cases/user-provisioning/reset-user-password.use-case";
import { LinkUserToPersonUseCase } from "@/core/use-cases/user-provisioning/link-user-to-person.use-case";
import type { IPasswordService } from "@/core/services/password.service.interface";
import { PasswordService } from "@/infrastructure/services/security/password.service";

const diLogger = logger.scope("DI:UserProvisioningModule");

export function bindUserProvisioningDependencies(container: Container): void {
  diLogger.debug(
    "bindUserProvisioningDependencies",
    "Binding User Provisioning dependencies...",
  );

  // Use Cases
  container
    .bind(DI_TOKENS.CreateUserForPersonUseCase)
    .to(CreateUserForPersonUseCase);

  container
    .bind(DI_TOKENS.ResetUserPasswordUseCase)
    .to(ResetUserPasswordUseCase);

  container.bind(DI_TOKENS.LinkUserToPersonUseCase).to(LinkUserToPersonUseCase);

  // Services
  container
    .bind<IPasswordService>(DI_TOKENS.IPasswordService)
    .to(PasswordService)
    .inSingletonScope();

  diLogger.debug(
    "bindUserProvisioningDependencies",
    "User Provisioning dependencies bound successfully",
  );
}
