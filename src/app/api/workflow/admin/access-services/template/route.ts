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

/**
 * Excel template in the business sheet's layout: one row per service,
 * people by full name (as in Persons), several separated by commas.
 */
export async function GET() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_ACCESS_SERVICES_VIEW);

  const uc = getContainer().get<ExportAccessServicesUseCase>(
    DI_TOKENS.ExportAccessServicesUseCase,
  );
  return new NextResponse(new Uint8Array(rosterWorkbook(uc.template())), {
    headers: xlsxResponseHeaders("access-services-template.xlsx"),
  });
}
