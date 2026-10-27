/**
 * Authenticated attachment preview (Content-Disposition: inline), for PDFs
 * and images only. next.config.ts lets this one route be framed by our own
 * pages so the preview dialog can embed it.
 */

import type { NextRequest } from "next/server";

import { serveAttachment } from "../serve-attachment";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return serveAttachment(id, "inline");
}
