/**
 * Asset Category Detail Page
 * Server component that fetches category and custom fields data
 */

import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getAssetCategoryAction } from "@/interface-adapters/controllers/asset-category.controller";
import { listEnrichedAssetCategoryFieldsAction } from "@/interface-adapters/controllers/asset-category-field.controller";
import { listFieldDefinitionsAction } from "@/interface-adapters/controllers/field-definition.controller";
import { AssetCategoryDetailPageClient } from "@/components/asset-categories/asset-category-detail-page-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssetCategoryDetailPage({ params }: PageProps) {
  // Await params (Next.js 16 async API)
  const { id } = await params;

  // Server-side permission check
  await requirePermission(PERMISSIONS.ASSET_CATEGORIES_VIEW);

  // Fetch category and fields in parallel
  const [categoryResult, fieldsResult, fieldDefinitionsResult] =
    await Promise.all([
      getAssetCategoryAction(id),
      listEnrichedAssetCategoryFieldsAction(id),
      listFieldDefinitionsAction(),
    ]);

  if (!categoryResult.success || !categoryResult.data) {
    notFound();
  }

  const category = categoryResult.data;
  const attachedFields = fieldsResult.success ? fieldsResult.data : [];
  const fieldDefinitions = fieldDefinitionsResult.success
    ? fieldDefinitionsResult.data
    : [];

  return (
    <AssetCategoryDetailPageClient
      category={category}
      attachedFields={attachedFields}
      fieldDefinitions={fieldDefinitions}
    />
  );
}
