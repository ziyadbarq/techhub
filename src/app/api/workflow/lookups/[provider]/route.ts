import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { getSession } from "@/lib/auth/session";
import type { ILookupProviderRegistry } from "@/core/domain/workflow/lookup-provider.interface";

export const dynamic = "force-dynamic";

const ALLOWED_PROVIDERS = new Set(["ACCESS_SERVICES"]);

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ provider: string }> },
) {
  try {
    await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);

    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const providerKey = params.provider.toUpperCase();
    if (!ALLOWED_PROVIDERS.has(providerKey)) {
      return NextResponse.json(
        { error: `Unknown lookup provider: ${params.provider}` },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim();
    const query = searchParams.get("q") ?? "";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);

    const registry = getContainer().get<ILookupProviderRegistry>(
      DI_TOKENS.IWorkflowLookupProviderRegistry,
    );
    const provider = registry.get(providerKey);
    if (id) {
      const result = await provider.findById(id, session.user.id);
      return NextResponse.json({ results: result ? [result] : [] });
    }
    const results = await provider.search(query, session.user.id, limit);

    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof Error && error.message.includes("feature")) {
      return NextResponse.json(
        { error: "Feature not available" },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
