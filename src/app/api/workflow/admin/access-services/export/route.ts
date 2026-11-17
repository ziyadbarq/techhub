import { NextResponse } from "next/server";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import type { ExportAccessServicesUseCase } from "@/core/use-cases/access-service";
import {
  rosterWorkbook,
  xlsxResponseHeaders,
} from "@/lib/access-services/roster-workbook";

export const dynamic = "force-dynamic";

/** Current services in the template's layout, so it can be edited and re-imported. */
export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_ACCESS_SERVICES_VIEW);

  const uc = getContainer().get<ExportAccessServicesUseCase>(
    DI_TOKENS.ExportAccessServicesUseCase,
  );
  const body = rosterWorkbook(await uc.roster());
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(body), {
    headers: xlsxResponseHeaders(`access-services-${date}.xlsx`),
  });
}
