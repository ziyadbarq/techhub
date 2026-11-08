import type { Metadata } from "next";
import { prisma } from "@/infrastructure/database/prisma/client";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";
import { RequestCatalog } from "./request-catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Service Requests | TechHub",
  description: "Submit a service request through TechHub's standalone portal.",
};

export default async function RequestPortalPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_REQUESTS_SUBMIT);
  const forms = await prisma.form.findMany({
    where: { isActive: true, publishedVersionId: { not: null } },
    select: { id: true, name: true, description: true },
    orderBy: { name: "asc" },
  });
  return <RequestCatalog forms={forms} />;
}
