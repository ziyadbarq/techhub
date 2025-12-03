/**
 * Send Test Email Use Case
 * Sends a test email to verify email service configuration
 */

import { injectable, inject, optional } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IEmailService } from "@/core/services/email.service.interface";
import type { ILoggerService } from "@/core/services";
import { LogExecution } from "@/lib/decorators";

export interface SendTestEmailDto {
  to: string;
  message?: string;
}

export interface SendTestEmailResultDto {
  success: boolean;
  messageId?: string;
  error?: string;
}

@injectable()
export class SendTestEmailUseCase {
  constructor(
    @inject(DI_TOKENS.IEmailService)
    @optional()
    private readonly emailService: IEmailService | null,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("system.test-email.send")
  async execute(dto: SendTestEmailDto): Promise<SendTestEmailResultDto> {
    this.logger.info("Sending test email", { to: dto.to });

    // Check if email service is available
    if (!this.emailService) {
      this.logger.warn("Email service not configured");
      return {
        success: false,
        error: "Email service is not configured",
      };
    }

    try {
      // Send test email
      const result = await this.emailService.sendEmail({
        to: dto.to,
        subject: "Test Email from Barq CMDB System",
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1a1a1a; margin-bottom: 10px;">Test Email</h1>
              </div>
              <p style="color: #333; font-size: 16px;">This is a test email from the Barq CMDB System.</p>
              ${dto.message ? `<p style="color: #333; font-size: 16px; margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #FFD100;">${dto.message}</p>` : ""}
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                If you received this email, your email service is configured correctly.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">
                barq TechHub - IT Asset Management
              </p>
            </body>
          </html>
        `,
        html: true,
      });

      if (result.success) {
        this.logger.info("Test email sent successfully", {
          to: dto.to,
          messageId: result.messageId,
        });
        return {
          success: true,
          messageId: result.messageId,
        };
      } else {
        this.logger.error(
          "Failed to send test email",
          new Error(result.error),
          {
            to: dto.to,
          },
        );
        return {
          success: false,
          error: result.error || "Failed to send test email",
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      this.logger.error("Error sending test email", error as Error, {
        to: dto.to,
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
