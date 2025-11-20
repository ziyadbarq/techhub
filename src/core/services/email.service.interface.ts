/**
 * Email Service Interface
 *
 * Defines the contract for email sending operations.
 * This interface follows Clean Architecture principles by defining
 * the contract in the core layer while implementations live in infrastructure.
 *
 * Architecture:
 * - Interface in Core layer (this file)
 * - Implementation in Infrastructure layer
 * - Injected via DI container
 *
 * Example Usage:
 * ```typescript
 * @injectable()
 * class MyUseCase {
 *   constructor(
 *     @inject(DI_TOKENS.IEmailService)
 *     private emailService: IEmailService
 *   ) {}
 *
 *   async execute() {
 *     await this.emailService.sendEmail({
 *       to: 'user@example.com',
 *       subject: 'Welcome!',
 *       body: 'Thanks for joining!'
 *     });
 *   }
 * }
 * ```
 */

/**
 * Email message data
 */
export interface EmailMessage {
  /**
   * Recipient email address
   */
  to: string;

  /**
   * Email subject line
   */
  subject: string;

  /**
   * Email body content (HTML or plain text)
   */
  body: string;

  /**
   * Optional sender email address
   * Falls back to default from email provider if not specified
   */
  from?: string;

  /**
   * Optional CC recipients
   */
  cc?: string[];

  /**
   * Optional BCC recipients
   */
  bcc?: string[];

  /**
   * Whether the body is HTML (default: true)
   */
  html?: boolean;

  /**
   * Optional reply-to email address
   */
  replyTo?: string;

  /**
   * Optional attachments
   */
  attachments?: EmailAttachment[];

  /**
   * Optional template variables for template-based emails
   */
  templateVariables?: Record<string, unknown>;
}

/**
 * Email attachment data
 */
export interface EmailAttachment {
  /**
   * Filename
   */
  filename: string;

  /**
   * File content (Buffer or string)
   */
  content: Buffer | string;

  /**
   * MIME type
   */
  contentType?: string;
}

/**
 * Result of sending an email
 */
export interface SendEmailResult {
  /**
   * Whether the email was sent successfully
   */
  success: boolean;

  /**
   * Message ID from email provider (if successful)
   */
  messageId?: string;

  /**
   * Error message (if failed)
   */
  error?: string;
}

/**
 * Email Service Interface
 *
 * Provides email sending capabilities for the application.
 */
export interface IEmailService {
  /**
   * Send an email
   *
   * @param message - Email message data
   * @returns Result indicating success/failure
   *
   * @throws Never throws - errors are captured in result
   *
   * @example
   * ```typescript
   * const result = await emailService.sendEmail({
   *   to: 'user@example.com',
   *   subject: 'Welcome',
   *   body: '<h1>Welcome to our app!</h1>',
   *   html: true
   * });
   *
   * if (result.success) {
   *   console.log('Email sent!', result.messageId);
   * } else {
   *   console.error('Failed:', result.error);
   * }
   * ```
   */
  sendEmail(message: EmailMessage): Promise<SendEmailResult>;

  /**
   * Send a templated email
   *
   * @param to - Recipient email
   * @param templateName - Name of the email template
   * @param variables - Template variables
   * @returns Result indicating success/failure
   *
   * @example
   * ```typescript
   * await emailService.sendTemplatedEmail(
   *   'user@example.com',
   *   'welcome',
   *   { name: 'John', verificationLink: 'https://...' }
   * );
   * ```
   */
  sendTemplatedEmail(
    to: string,
    templateName: string,
    variables: Record<string, unknown>,
  ): Promise<SendEmailResult>;

  /**
   * Send a batch of emails
   *
   * @param messages - Array of email messages
   * @returns Array of results for each email
   *
   * @example
   * ```typescript
   * const results = await emailService.sendBatch([
   *   { to: 'user1@example.com', subject: 'Hi', body: 'Hello' },
   *   { to: 'user2@example.com', subject: 'Hi', body: 'Hello' },
   * ]);
   * ```
   */
  sendBatch(messages: EmailMessage[]): Promise<SendEmailResult[]>;
}
