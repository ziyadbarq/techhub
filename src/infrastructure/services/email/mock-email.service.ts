/**
 * Mock Email Service Implementation
 *
 * A mock implementation of IEmailService that logs emails instead of sending them.
 * Useful for development and testing environments.
 *
 * Architecture:
 * - Implements IEmailService interface from core layer
 * - Uses structured logger for output
 * - Simulates email sending with configurable success rate
 *
 * Production TODO:
 * Replace this with a real email service implementation:
 * - SendGrid: @sendgrid/mail
 * - AWS SES: @aws-sdk/client-ses
 * - Resend: resend
 * - Nodemailer: nodemailer
 *
 * Example Integration:
 * ```typescript
 * // In DI container
 * if (env.NODE_ENV === 'production') {
 *   container.bind(DI_TOKENS.IEmailService).to(SendGridEmailService);
 * } else {
 *   container.bind(DI_TOKENS.IEmailService).to(MockEmailService);
 * }
 * ```
 */

import { injectable, inject } from "inversify";
import type {
  IEmailService,
  EmailMessage,
  SendEmailResult,
} from "@/core/services/email.service.interface";
import type { ILoggerService } from "@/core/services";
import { DI_TOKENS } from "@/di/types";

/**
 * Mock Email Service
 *
 * Logs email operations instead of actually sending emails.
 * Perfect for development and testing.
 */
@injectable()
export class MockEmailService implements IEmailService {
  private emailsSent = 0;

  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private logger: ILoggerService,
  ) {
    this.logger.info("MockEmailService initialized", {
      mode: "mock",
      note: "Emails will be logged but not sent",
    });
  }

  /**
   * Mock send email - logs the email instead of sending
   */
  async sendEmail(message: EmailMessage): Promise<SendEmailResult> {
    this.emailsSent++;

    // Log the email details
    this.logger.info("📧 Mock email sent", {
      emailNumber: this.emailsSent,
      to: message.to,
      from: message.from ?? "noreply@example.com",
      subject: message.subject,
      bodyPreview: message.body.substring(0, 100),
      isHtml: message.html ?? true,
      cc: message.cc,
      bcc: message.bcc,
      replyTo: message.replyTo,
      attachmentCount: message.attachments?.length ?? 0,
      templateVariables: message.templateVariables,
    });

    // Optionally log the full body in development
    if (process.env.NODE_ENV === "development") {
      this.logger.debug("Mock email body", {
        to: message.to,
        subject: message.subject,
        fullBody: message.body,
      });
    }

    // Simulate successful send
    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }

  /**
   * Mock send templated email - uses simple template substitution
   */
  async sendTemplatedEmail(
    to: string,
    templateName: string,
    variables: Record<string, unknown>,
  ): Promise<SendEmailResult> {
    this.logger.info("📧 Mock templated email", {
      to,
      templateName,
      variables,
    });

    // Create a simple mock template
    const subject = `[${templateName}] Notification`;
    const body = this.renderMockTemplate(templateName, variables);

    return this.sendEmail({
      to,
      subject,
      body,
      html: true,
      templateVariables: variables,
    });
  }

  /**
   * Mock send batch - sends emails sequentially
   */
  async sendBatch(messages: EmailMessage[]): Promise<SendEmailResult[]> {
    this.logger.info("📧 Mock batch email send started", {
      count: messages.length,
    });

    const results: SendEmailResult[] = [];

    for (const message of messages) {
      const result = await this.sendEmail(message);
      results.push(result);
    }

    this.logger.info("📧 Mock batch email send completed", {
      totalSent: results.filter((r) => r.success).length,
      totalFailed: results.filter((r) => !r.success).length,
    });

    return results;
  }

  /**
   * Render a mock email template
   * In production, use a real template engine like Handlebars, EJS, or React Email
   */
  private renderMockTemplate(
    templateName: string,
    variables: Record<string, unknown>,
  ): string {
    // Simple template examples
    const templates: Record<string, string> = {
      welcome: `
        <html>
          <body style="font-family: sans-serif; padding: 20px;">
            <h1>Welcome, {{name}}!</h1>
            <p>Thanks for joining our platform.</p>
            <p>Email: {{email}}</p>
            <p><a href="{{verificationLink}}">Verify your email</a></p>
          </body>
        </html>
      `,
      "task-reminder": `
        <html>
          <body style="font-family: sans-serif; padding: 20px;">
            <h1>Task Reminder</h1>
            <p>Hello {{userName}},</p>
            <p>This is a reminder about your task: <strong>{{taskTitle}}</strong></p>
            <p>Due date: {{dueDate}}</p>
            <p><a href="{{taskLink}}">View Task</a></p>
          </body>
        </html>
      `,
      "task-notification": `
        <html>
          <body style="font-family: sans-serif; padding: 20px;">
            <h1>Task Notification</h1>
            <p>Hello {{userName}},</p>
            <p>{{message}}</p>
            <p>Task: <strong>{{taskTitle}}</strong></p>
          </body>
        </html>
      `,
      "password-reset": `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a1a; margin-bottom: 10px;">Reset Your Password</h1>
            </div>
            <p style="color: #333; font-size: 16px;">Hi {{name}},</p>
            <p style="color: #333; font-size: 16px;">We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="{{resetLink}}" style="background-color: #FFD100; color: #1a1a1a; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">This link expires in {{expiresIn}}.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">barq TechHub - IT Asset Management</p>
          </body>
        </html>
      `,
      "email-verification": `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a1a; margin-bottom: 10px;">Verify Your Email</h1>
            </div>
            <p style="color: #333; font-size: 16px;">Hi {{name}},</p>
            <p style="color: #333; font-size: 16px;">Please verify your email address to complete your account setup:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="{{verificationLink}}" style="background-color: #FFD100; color: #1a1a1a; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Verify Email
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">This link expires in {{expiresIn}}.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">barq TechHub - IT Asset Management</p>
          </body>
        </html>
      `,
    };

    let template =
      templates[templateName] ??
      `
      <html>
        <body style="font-family: sans-serif; padding: 20px;">
          <h1>Notification</h1>
          <p>Template: ${templateName}</p>
          <pre>${JSON.stringify(variables, null, 2)}</pre>
        </body>
      </html>
    `;

    // Simple variable substitution (in production, use a real template engine)
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      template = template.replace(
        new RegExp(placeholder, "g"),
        String(value ?? ""),
      );
    });

    return template;
  }

  /**
   * Get statistics (useful for testing)
   */
  getStats() {
    return {
      emailsSent: this.emailsSent,
    };
  }

  /**
   * Reset statistics (useful for testing)
   */
  resetStats() {
    this.emailsSent = 0;
  }
}

/**
 * Production Email Service Example (commented out - uncomment when ready)
 *
 * Example implementation using SendGrid:
 *
 * ```typescript
 * import sgMail from '@sendgrid/mail';
 *
 * @injectable()
 * export class SendGridEmailService implements IEmailService {
 *   constructor(
 *     @inject(DI_TOKENS.ILoggerService)
 *     private logger: ILoggerService,
 *   ) {
 *     sgMail.setApiKey(env.SENDGRID_API_KEY);
 *   }
 *
 *   async sendEmail(message: EmailMessage): Promise<SendEmailResult> {
 *     try {
 *       const result = await sgMail.send({
 *         to: message.to,
 *         from: message.from ?? env.DEFAULT_FROM_EMAIL,
 *         subject: message.subject,
 *         html: message.body,
 *         cc: message.cc,
 *         bcc: message.bcc,
 *         replyTo: message.replyTo,
 *       });
 *
 *       this.logger.info('Email sent successfully', {
 *         to: message.to,
 *         messageId: result[0].headers['x-message-id'],
 *       });
 *
 *       return {
 *         success: true,
 *         messageId: result[0].headers['x-message-id'],
 *       };
 *     } catch (error) {
 *       this.logger.error('Failed to send email', error as Error, {
 *         to: message.to,
 *         subject: message.subject,
 *       });
 *
 *       return {
 *         success: false,
 *         error: (error as Error).message,
 *       };
 *     }
 *   }
 *
 *   // Implement other methods...
 * }
 * ```
 */
