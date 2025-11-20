/**
 * Email Service DI Module
 *
 * Configures dependency injection bindings for email services.
 *
 * This module is imported by the main DI container and provides
 * email sending capabilities throughout the application.
 *
 * Production TODO:
 * Replace MockEmailService with a real email provider:
 * - SendGrid (@sendgrid/mail)
 * - AWS SES (@aws-sdk/client-ses)
 * - Resend (resend)
 * - Nodemailer (nodemailer)
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { MockEmailService } from "@/infrastructure/services/email/mock-email.service";
import type { IEmailService } from "@/core/services";
import { logger } from "@/lib/logger";

const diLogger = logger.scope("DI");

/**
 * Binds email service dependencies to the DI container
 *
 * @param container - InversifyJS container instance
 */
export function bindEmailDependencies(container: Container): void {
  // Bind IEmailService to MockEmailService
  // Singleton scope to reuse service instance across the application
  container
    .bind<IEmailService>(DI_TOKENS.IEmailService)
    .to(MockEmailService)
    .inSingletonScope();

  // Production: Conditionally bind based on environment
  // if (env.NODE_ENV === 'production') {
  //   container
  //     .bind<IEmailService>(DI_TOKENS.IEmailService)
  //     .to(SendGridEmailService)
  //     .inSingletonScope();
  // } else {
  //   container
  //     .bind<IEmailService>(DI_TOKENS.IEmailService)
  //     .to(MockEmailService)
  //     .inSingletonScope();
  // }

  diLogger.debug(
    "bindEmailDependencies",
    "Email service registered (MockEmailService)",
  );
}

/**
 * Implementation Notes:
 *
 * 1. Service Scope:
 *    - IEmailService: Singleton (shared instance, stateless service)
 *    - Mock implementation logs emails instead of sending them
 *
 * 2. Production Migration:
 *    - Add email provider SDK to package.json
 *    - Create production implementation in infrastructure/services/email/
 *    - Add environment variables for API keys
 *    - Update binding to use production service
 *
 * 3. Testing:
 *    - MockEmailService includes getStats() for testing
 *    - Can verify emails were "sent" in tests
 *    - InversifyJS v7: Use `await container.rebind()` or `container.rebindSync()` to inject test doubles
 *    - Example:
 *      await container.rebind(DI_TOKENS.IEmailService)
 *               .toConstantValue(mockEmailService);
 *      // Or sync:
 *      container.rebindSync(DI_TOKENS.IEmailService)
 *               .toConstantValue(mockEmailService);
 */
