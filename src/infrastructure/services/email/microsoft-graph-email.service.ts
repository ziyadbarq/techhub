/**
 * Microsoft Graph Email Service Implementation
 *
 * Implements the IEmailService interface for sending emails via Microsoft Graph API.
 * Uses Client Credentials Flow for app-only authentication.
 *
 * Required Azure AD Permissions:
 * - Mail.Send (Application permission, requires admin consent)
 *
 * Required Environment Variables (email-specific credentials):
 * - AZURE_EMAIL_TENANT_ID: Azure AD tenant ID for email app
 * - AZURE_EMAIL_CLIENT_ID: Application (client) ID for email app
 * - AZURE_EMAIL_CLIENT_SECRET: Client secret for email app
 * - AZURE_EMAIL_FROM: Email address to send from (e.g., noreply@company.com)
 */

import { inject, injectable } from "inversify";
import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import type { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import type {
  IEmailService,
  EmailMessage,
  SendEmailResult,
} from "@/core/services/email.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { DI_TOKENS } from "@/di/types";

/**
 * Microsoft Graph Email Service
 *
 * Sends emails via Microsoft Graph API using application permissions.
 * The sender mailbox must be licensed for Exchange Online.
 */
@injectable()
export class MicrosoftGraphEmailService implements IEmailService {
  private client: Client | null = null;
  private readonly logger: ILoggerService;
  private emailsSent = 0;

  constructor(@inject(DI_TOKENS.ILoggerService) logger: ILoggerService) {
    this.logger = logger.child({ service: "MicrosoftGraphEmailService" });
  }

  /**
   * Lazy initialization of Graph client
   * Allows service to be instantiated even if env vars are missing
   */
  private getClient(): Client {
    if (this.client) {
      return this.client;
    }

    const tenantId = process.env.AZURE_EMAIL_TENANT_ID;
    const clientId = process.env.AZURE_EMAIL_CLIENT_ID;
    const clientSecret = process.env.AZURE_EMAIL_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error(
        "Missing Microsoft Graph Email configuration. Required environment variables: " +
          "AZURE_EMAIL_TENANT_ID, AZURE_EMAIL_CLIENT_ID, AZURE_EMAIL_CLIENT_SECRET",
      );
    }

    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret,
    );

    // Create custom auth provider
    const authProvider = {
      getAccessToken: async (): Promise<string> => {
        const token = await credential.getToken(
          "https://graph.microsoft.com/.default",
        );
        return token.token;
      },
    };

    this.client = Client.initWithMiddleware({
      authProvider:
        authProvider as unknown as TokenCredentialAuthenticationProvider,
    });

    this.logger.debug("Graph email client initialized");
    return this.client;
  }

  /**
   * Get the sender email address from environment
   */
  private getFromAddress(): string {
    const from = process.env.AZURE_EMAIL_FROM;
    if (!from) {
      throw new Error(
        "Missing AZURE_EMAIL_FROM environment variable. " +
          "This should be the email address to send from (e.g., noreply@company.com)",
      );
    }
    return from;
  }

  /**
   * Send an email via Microsoft Graph API
   */
  async sendEmail(message: EmailMessage): Promise<SendEmailResult> {
    try {
      const client = this.getClient();
      const from = message.from ?? this.getFromAddress();

      // Build the Graph API message payload
      const graphMessage = this.buildGraphMessage(message, from);

      this.logger.debug("Sending email via Graph API", {
        to: message.to,
        from,
        subject: message.subject,
        hasAttachments: (message.attachments?.length ?? 0) > 0,
      });

      // Send email using Graph API
      // POST /users/{from}/sendMail
      await client.api(`/users/${from}/sendMail`).post({
        message: graphMessage,
        saveToSentItems: true,
      });

      this.emailsSent++;

      this.logger.info("Email sent successfully via Graph API", {
        to: message.to,
        from,
        subject: message.subject,
        emailNumber: this.emailsSent,
      });

      return {
        success: true,
        messageId: `graph-${Date.now()}-${this.emailsSent}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        "Failed to send email via Graph API",
        error instanceof Error ? error : new Error(errorMessage),
        {
          to: message.to,
          subject: message.subject,
        },
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send a templated email
   */
  async sendTemplatedEmail(
    to: string,
    templateName: string,
    variables: Record<string, unknown>,
  ): Promise<SendEmailResult> {
    this.logger.debug("Sending templated email", {
      to,
      templateName,
      variables,
    });

    // Create subject and body from template
    const subject = `[${templateName}] Notification`;
    const body = this.renderTemplate(templateName, variables);

    return this.sendEmail({
      to,
      subject,
      body,
      html: true,
      templateVariables: variables,
    });
  }

  /**
   * Send a batch of emails
   */
  async sendBatch(messages: EmailMessage[]): Promise<SendEmailResult[]> {
    this.logger.info("Starting batch email send", {
      count: messages.length,
    });

    const results: SendEmailResult[] = [];

    // Send emails sequentially to avoid rate limiting
    for (const message of messages) {
      const result = await this.sendEmail(message);
      results.push(result);

      // Small delay between emails to respect rate limits
      if (messages.indexOf(message) < messages.length - 1) {
        await this.delay(100);
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    this.logger.info("Batch email send completed", {
      totalSent: successCount,
      totalFailed: failureCount,
    });

    return results;
  }

  /**
   * Build a Microsoft Graph API message object
   */
  private buildGraphMessage(
    message: EmailMessage,
    from: string,
  ): Record<string, unknown> {
    const graphMessage: Record<string, unknown> = {
      subject: message.subject,
      body: {
        contentType: message.html !== false ? "HTML" : "Text",
        content: message.body,
      },
      from: {
        emailAddress: {
          address: from,
        },
      },
      toRecipients: [
        {
          emailAddress: {
            address: message.to,
          },
        },
      ],
    };

    // Add CC recipients
    if (message.cc && message.cc.length > 0) {
      graphMessage.ccRecipients = message.cc.map((email) => ({
        emailAddress: { address: email },
      }));
    }

    // Add BCC recipients
    if (message.bcc && message.bcc.length > 0) {
      graphMessage.bccRecipients = message.bcc.map((email) => ({
        emailAddress: { address: email },
      }));
    }

    // Add reply-to
    if (message.replyTo) {
      graphMessage.replyTo = [
        {
          emailAddress: { address: message.replyTo },
        },
      ];
    }

    // Add attachments
    if (message.attachments && message.attachments.length > 0) {
      graphMessage.attachments = message.attachments.map((attachment) => ({
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: attachment.filename,
        contentType: attachment.contentType ?? "application/octet-stream",
        contentBytes:
          typeof attachment.content === "string"
            ? Buffer.from(attachment.content).toString("base64")
            : attachment.content.toString("base64"),
      }));
    }

    return graphMessage;
  }

  /**
   * Render a simple email template
   * In production, consider using a proper template engine
   */
  private renderTemplate(
    templateName: string,
    variables: Record<string, unknown>,
  ): string {
    const templates: Record<string, string> = {
      welcome: `
        <html>
          <body style="font-family: sans-serif; padding: 20px;">
            <h1>Welcome, {{name}}!</h1>
            <p>Thanks for joining our platform.</p>
            <p>Email: {{email}}</p>
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

    // Simple variable substitution
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
   * Helper function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get statistics (useful for testing)
   */
  getStats() {
    return {
      emailsSent: this.emailsSent,
    };
  }
}
