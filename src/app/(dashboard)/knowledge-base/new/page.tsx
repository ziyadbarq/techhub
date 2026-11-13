import { requireFeature } from "@/lib/features/server";
import { requirePermission } from "@/lib/permissions/server";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { handlePermissionRedirect } from "@/lib/permissions/handle-permission-redirect";
import { KnowledgeComposer } from "@/components/knowledge-base/KnowledgeComposer";

export const dynamic = "force-dynamic";

export default async function CreateKnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; type?: string }>;
}) {
  const { folder, type } = await searchParams;
  await requireFeature(FEATURE_FLAGS.KNOWLEDGE_BASE);
  try {
    await requirePermission(PERMISSIONS.KNOWLEDGE_BASE_CREATE);
  } catch (error) {
    handlePermissionRedirect(error, "/knowledge-base/new");
    throw error;
  }
  return (
    <KnowledgeComposer
      initialFolderId={folder ?? null}
      initialSourceType={type === "pdf" ? "PDF" : "EDITOR"}
    />
  );
}
