import { NextResponse, type NextRequest } from "next/server";
import { getMicrosoftPortalAccess } from "@/lib/auth/microsoft-portal-access";
import { POST as submitExistingRequest } from "@/app/api/workflow/requests/route";

export const dynamic = "force-dynamic";

/** Standalone portal entrypoint; the underlying workflow engine and RBAC remain unchanged. */
export async function POST(request: NextRequest) {
  const access = await getMicrosoftPortalAccess();
  if (!access.allowed) {
    return NextResponse.json(
      { error: "MICROSOFT_SIGN_IN_REQUIRED", message: "Sign in with Microsoft to submit this request." },
      { status: 403 },
    );
  }

  return submitExistingRequest(request);
}
