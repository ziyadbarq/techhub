import { NextResponse } from "next/server";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { ExportAccessServicesUseCase } from "@/core/use-cases/access-service";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_ACCESS_SERVICES_VIEW);

  const uc = getContainer().get<ExportAccessServicesUseCase>(
    DI_TOKENS.ExportAccessServicesUseCase,
  );
  const csvBuffer = await uc.execute();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return new NextResponse(csvBuffer.toString("utf-8"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="access-services-${timestamp}.csv"`,
    },
  });
}
