/**
 * Email Service DI Module
 *
 * Configures dependency injection bindings for email services.
 *
 * This module is imported by the main DI container and provides
 * email sending capabilities throughout the application.
 *
 * Available Implementations:
 * - MockEmailService: Logs emails to console (development/testing)
 * - MicrosoftGraphEmailService: Sends via Microsoft Graph API (production)
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import {
  MockEmailService,
  MicrosoftGraphEmailService,
} from "@/infrastructure/services/email";
import type { IEmailService } from "@/core/services";
import { logger } from "@/lib/logger";

const diLogger = logger.scope("DI");

/**
 * Binds email service dependencies to the DI container
 *
 * Uses MicrosoftGraphEmailService when AZURE_EMAIL_FROM is configured,
 * otherwise falls back to MockEmailService for development/testing.
 *
 * @param container - InversifyJS container instance
 */
export function bindEmailDependencies(container: Container): void {
  const azureEmailFrom = process.env.AZURE_EMAIL_FROM;

  if (azureEmailFrom) {
    // Production: Use Microsoft Graph API for email sending
    container
      .bind<IEmailService>(DI_TOKENS.IEmailService)
      .to(MicrosoftGraphEmailService)
      .inSingletonScope();

    diLogger.debug(
      "bindEmailDependencies",
      `Email service registered (MicrosoftGraphEmailService, from: ${azureEmailFrom})`,
    );
  } else {
    // Development/Testing: Use mock service that logs emails
    container
      .bind<IEmailService>(DI_TOKENS.IEmailService)
      .to(MockEmailService)
      .inSingletonScope();

    diLogger.debug(
      "bindEmailDependencies",
      "Email service registered (MockEmailService - set AZURE_EMAIL_FROM for production)",
    );
  }
}

/**
 * Implementation Notes:
 *
 * 1. Service Scope:
 *    - IEmailService: Singleton (shared instance, stateless service)
 *    - Mock implementation logs emails instead of sending them
 *    - MicrosoftGraphEmailService sends via Graph API
 *
 * 2. Configuration:
 *    - Set AZURE_EMAIL_FROM to enable production email sending
 *    - Requires AZURE_EMAIL_TENANT_ID, AZURE_EMAIL_CLIENT_ID, AZURE_EMAIL_CLIENT_SECRET
 *    - These are separate from Intune credentials (AZURE_TENANT_ID, etc.)
 *    - Azure AD app needs Mail.Send application permission
 *
 * 3. Testing:
 *    - Both services include getStats() for testing
 *    - Can verify emails were "sent" in tests
 *    - InversifyJS v7: Use `await container.rebind()` or `container.rebindSync()` to inject test doubles
 *    - Example:
 *      await container.rebind(DI_TOKENS.IEmailService)
 *               .toConstantValue(mockEmailService);
 *      // Or sync:
 *      container.rebindSync(DI_TOKENS.IEmailService)
 *               .toConstantValue(mockEmailService);
 */
