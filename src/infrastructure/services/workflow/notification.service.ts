import { randomBytes } from "crypto";

import { inject, injectable } from "inversify";

import type { NotificationChannel, Prisma } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { ActionKind } from "@/core/domain/workflow";
import type { Tx } from "@/core/repositories/workflow";
import type { IEmailService } from "@/core/services/email.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";

import {
  buildRequestVars,
  renderTemplate,
  type ITemplateRenderer,
} from "./template-renderer.service";

export interface SendNotificationInput {
  userId: string;
  channel?: NotificationChannel;
  requestId?: string | null;
  stepInstanceId?: string | null;
  templateKey?: string;
  subject: string;
  body: string;
  payload?: Record<string, unknown>;
  /** When set, the engine mints a single-use token per (user, action) and
   *  appends approve/reject/etc. links to the email body. */
  actionLinks?: ActionKind[];
}

export interface SendToUsersInput extends Omit<
  SendNotificationInput,
  "userId" | "channel"
> {
  userIds: string[];
  formId?: string;
}

/**
 * Notification service interface.
 *
 * Channel-aware notification dispatch. Persists every notification as an
 * in-app row; for EMAIL channel additionally invokes the configured email
 * service. Failures in the email transport are swallowed so they never block
 * the engine — the in-app row is the durable record.
 */
export interface INotificationService {
  send(tx: Tx, input: SendNotificationInput): Promise<{ id: string }>;
  sendToUsers(tx: Tx, input: SendToUsersInput): Promise<void>;
}

@injectable()
export class NotificationService implements INotificationService {
  private readonly logger: ILoggerService;

  constructor(
    @inject(DI_TOKENS.ILoggerService) logger: ILoggerService,
    @inject(DI_TOKENS.IEmailService)
    private readonly emailService: IEmailService,
    @inject(DI_TOKENS.IWorkflowTemplateRenderer)
    private readonly templateRenderer: ITemplateRenderer,
  ) {
    this.logger = logger.child({ service: "WorkflowNotificationService" });
  }

  async send(tx: Tx, input: SendNotificationInput): Promise<{ id: string }> {
    const channel = input.channel ?? "IN_APP";

    let subject = input.subject;
    let body = input.body;
    let templateBodyHtml: string | null = null;

    // If an admin has authored an EmailTemplate matching this templateKey,
    // it takes precedence over the inline subject/body. Variables in the
    // form {{path.to.value}} are substituted from the request context.
    if (input.templateKey && input.requestId) {
      const tpl = await tx.emailTemplate.findUnique({
        where: { key: input.templateKey },
        select: { subject: true, bodyHtml: true, bodyText: true },
      });
      if (tpl) {
        const vars = await this.templateRenderer.buildRequestVars(
          tx,
          input.requestId,
          { stepInstanceId: input.stepInstanceId ?? null },
        );
        subject = this.templateRenderer.render(tpl.subject, vars);
        // Prefer plain-text body; if only HTML is authored, strip tags so
        // the in-app notification doesn't show <p>…</p> markup.
        body = tpl.bodyText
          ? this.templateRenderer.render(tpl.bodyText, vars)
          : htmlToPlainText(this.templateRenderer.render(tpl.bodyHtml, vars));
        templateBodyHtml = this.templateRenderer.render(tpl.bodyHtml, vars);
      }
    }

    const row = await tx.notification.create({
      data: {
        userId: input.userId,
        channel,
        requestId: input.requestId ?? null,
        stepInstanceId: input.stepInstanceId ?? null,
        templateKey: input.templateKey ?? null,
        subject,
        body,
        payloadJson:
          ((input.payload ?? null) as Prisma.InputJsonValue | null) ??
          undefined,
      },
      select: { id: true },
    });

    if (channel === "EMAIL") {
      try {
        const user = await tx.user.findUnique({
          where: { id: input.userId },
          select: { email: true, name: true },
        });
        if (user) {
          // Build action links via single-use tokens (24h TTL by default).
          const actionLines: string[] = [];
          if (
            input.actionLinks &&
            input.actionLinks.length > 0 &&
            input.stepInstanceId
          ) {
            const baseUrl =
              process.env.PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "";
            for (const action of input.actionLinks) {
              const token = randomBytes(32).toString("base64url");
              await tx.emailActionToken.create({
                data: {
                  token,
                  userId: input.userId,
                  stepInstanceId: input.stepInstanceId,
                  action,
                  expiresAt: new Date(Date.now() + 24 * 3600_000),
                },
              });
              const link = baseUrl
                ? `${baseUrl}/api/workflow/email-tokens/${token}`
                : `/api/workflow/email-tokens/${token}`;
              actionLines.push(`${labelFor(action)}: ${link}`);
            }
          }

          const finalBody =
            actionLines.length > 0
              ? `${body}\n\nActions:\n${actionLines.join("\n")}`
              : body;

          await this.emailService.sendEmail({
            to: user.email,
            subject,
            body: templateBodyHtml ?? finalBody,
            html: templateBodyHtml !== null,
          });
        }
      } catch (error) {
        this.logger.warn("email transport failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return row;
  }

  async sendToUsers(tx: Tx, input: SendToUsersInput): Promise<void> {
    if (input.userIds.length === 0) return;

    const prefs = input.formId
      ? await tx.watcherChannelPreference.findMany({
          where: { formId: input.formId, userId: { in: input.userIds } },
          select: { userId: true, channel: true },
        })
      : [];
    const prefMap = new Map(prefs.map((p) => [p.userId, p.channel]));

    for (const userId of input.userIds) {
      const pref = prefMap.get(userId);
      if (pref === "MUTED") continue;

      const channels: NotificationChannel[] =
        pref === "BOTH"
          ? ["IN_APP", "EMAIL"]
          : pref === "EMAIL"
            ? ["EMAIL"]
            : ["IN_APP"];

      for (const ch of channels) {
        await this.send(tx, { ...input, userId, channel: ch });
      }
    }
  }
}

function labelFor(action: ActionKind): string {
  switch (action) {
    case "APPROVE":
      return "Approve";
    case "REJECT":
      return "Reject";
    case "COMPLETE":
      return "Mark complete";
    case "ACKNOWLEDGE":
      return "Acknowledge";
    case "REQUEST_INFO":
      return "Request more info";
    case "PROVIDE_INFO":
      return "Provide info";
  }
}

/**
 * Best-effort HTML → plain text. Replaces block-level tags with newlines,
 * decodes the most common entities, and collapses whitespace. Used when an
 * EmailTemplate has only `bodyHtml` so the in-app notification shows clean
 * text instead of raw markup.
 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Re-export module-level template helpers for compatibility with code that
// imports them directly (e.g. tests or other ported services).
export { buildRequestVars, renderTemplate };
