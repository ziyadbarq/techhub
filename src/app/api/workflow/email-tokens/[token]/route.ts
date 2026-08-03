import { NextResponse, type NextRequest } from "next/server";

import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IEmailActionTokenService } from "@/infrastructure/services/workflow/email-action-tokens.service";
import { WorkflowEngineError } from "@/core/domain/workflow";

export const dynamic = "force-dynamic";

/**
 * GET handler invoked when the recipient clicks an email-button link. The
 * action is encoded in the token itself, so the URL only carries the token.
 *
 * On success: render a small HTML confirmation.
 * On failure: render a small HTML error message.
 *
 * Auth: the token itself is the auth (single-use, expiring, tied to a
 * specific user/step/action). No session check.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const service = getContainer().get<IEmailActionTokenService>(
    DI_TOKENS.IWorkflowEmailActionTokenService,
  );

  try {
    await service.consume(token);
    return new NextResponse(
      htmlMessage(
        "Action recorded",
        "Thanks — your action has been recorded. You can close this tab.",
      ),
      { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  } catch (error) {
    const message =
      error instanceof WorkflowEngineError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unknown error";
    return new NextResponse(htmlMessage("Action failed", message), {
      status: 400,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
}

function htmlMessage(title: string, body: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escape(title)}</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; padding: 48px; max-width: 480px; margin: 0 auto; color: #1c1c1e; }
  h1 { font-size: 22px; margin-bottom: 12px; }
  p { color: #555a6a; line-height: 1.5; }
  a { display: inline-block; margin-top: 24px; padding: 10px 20px; background: #1c1c1e; color: white; border-radius: 9999px; text-decoration: none; font-size: 14px; font-weight: 500; }
</style></head>
<body>
  <h1>${escape(title)}</h1>
  <p>${escape(body)}</p>
  <a href="/dashboard">Open Dashboard</a>
</body></html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
