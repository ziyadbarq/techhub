import { requireFeature } from "@/lib/features/server";
import { requirePermission } from "@/lib/permissions/server";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { KnowledgeComposer } from "@/components/knowledge-base/KnowledgeComposer";

export const dynamic = "force-dynamic";

export default async function CreateKnowledgePage() {
  await requireFeature(FEATURE_FLAGS.KNOWLEDGE_BASE);
  try {
    await requirePermission(PERMISSIONS.KNOWLEDGE_BASE_CREATE);
  } catch (error) {
    handlePermissionRedirect(error, "/knowledge-base/new");
    throw error;
  }
  return <KnowledgeComposer />;
}
