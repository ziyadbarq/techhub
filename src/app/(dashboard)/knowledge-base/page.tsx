import { requireFeature } from "@/lib/features/server";
import { requirePermission } from "@/lib/permissions/server";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { KnowledgeCatalog } from "@/components/knowledge-base/KnowledgeCatalog";

export const dynamic = "force-dynamic";

export default async function KnowledgeBasePage() {
  await requireFeature(FEATURE_FLAGS.KNOWLEDGE_BASE);
  try {
    await requirePermission(PERMISSIONS.KNOWLEDGE_BASE_VIEW);
  } catch (error) {
    handlePermissionRedirect(error, "/knowledge-base");
    throw error;
  }
  return <KnowledgeCatalog />;
}
