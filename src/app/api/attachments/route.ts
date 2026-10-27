/**
 * Attachment upload endpoint.
 *
 * Exists only so the browser can report real upload progress: server actions
 * give no progress events, an XMLHttpRequest to a route does. All rules
 * (permission, attachment type, size, magic number, person attribution) stay
 * in uploadAttachmentFile, so both entry points enforce the same checks.
 */

import { type NextRequest, NextResponse } from "next/server";

import { uploadAttachmentFile } from "@/interface-adapters/controllers/attachment.controller";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Expected multipart form data" },
      { status: 400 },
    );
  }

  const result = await uploadAttachmentFile(formData);

  return NextResponse.json(result, { status: result.success ? 201 : 400 });
}
