/**
 * Authenticated attachment download (Content-Disposition: attachment).
 * See serve-attachment.ts for why bytes go through the app.
 */

import type { NextRequest } from "next/server";

import { serveAttachment } from "../serve-attachment";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return serveAttachment(id, "attachment");
}
