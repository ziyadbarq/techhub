import { requireFeature } from "@/lib/features/server";
import { requirePermission } from "@/lib/permissions/server";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { KnowledgeReader } from "@/components/knowledge-base/KnowledgeReader";

export const dynamic = "force-dynamic";

export default async function KnowledgeArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ draft?: string }>;
}) {
  const { id } = await params;
  const { draft } = await searchParams;
  await requireFeature(FEATURE_FLAGS.KNOWLEDGE_BASE);
  try {
    await requirePermission(PERMISSIONS.KNOWLEDGE_BASE_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/knowledge-base/" + id);
    throw error;
  }
  return <KnowledgeReader articleId={id} draft={draft === "1"} />;
}
