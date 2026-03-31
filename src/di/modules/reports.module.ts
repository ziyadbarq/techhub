/**
 * Reports Module - DI Bindings
 *
 * Binds services, repositories, and use cases for the Reports & Analytics feature.
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { logger } from "@/lib/logger";

// Services
import type { IReportPdfService } from "@/core/services/report-pdf.service.interface";
import { ReportPdfService } from "@/infrastructure/services/reports/report-pdf.service";

// Repositories
import type { IReportScheduleRepository } from "@/core/repositories/report-schedule.repository.interface";
import { PrismaReportScheduleRepository } from "@/infrastructure/repositories/prisma-report-schedule.repository";

// Use Cases
import { GetReportCatalogUseCase } from "@/core/use-cases/reports/get-report-catalog.use-case";
import { GenerateReportDataUseCase } from "@/core/use-cases/reports/generate-report-data.use-case";
import { GenerateReportPdfUseCase } from "@/core/use-cases/reports/generate-report-pdf.use-case";
import { CreateReportScheduleUseCase } from "@/core/use-cases/reports/create-report-schedule.use-case";
import { ListReportSchedulesUseCase } from "@/core/use-cases/reports/list-report-schedules.use-case";
import { DeleteReportScheduleUseCase } from "@/core/use-cases/reports/delete-report-schedule.use-case";
import { ExecuteScheduledReportUseCase } from "@/core/use-cases/reports/execute-scheduled-report.use-case";

const diLogger = logger.scope("DI:ReportsModule");

export function bindReportsDependencies(container: Container): void {
  if (container.isBound(DI_TOKENS.GetReportCatalogUseCase)) {
    diLogger.debug(
      "bindReportsDependencies",
      "Reports dependencies already bound, skipping",
    );
    return;
  }

  diLogger.debug("bindReportsDependencies", "Binding Reports dependencies...");

  // ==========================================
  // Services
  // ==========================================

  container
    .bind<IReportPdfService>(DI_TOKENS.IReportPdfService)
    .to(ReportPdfService)
    .inSingletonScope();

  // ==========================================
  // Repositories
  // ==========================================

  container
    .bind<IReportScheduleRepository>(DI_TOKENS.IReportScheduleRepository)
    .to(PrismaReportScheduleRepository)
    .inSingletonScope();

  // ==========================================
  // Use Cases
  // ==========================================

  container
    .bind<GetReportCatalogUseCase>(DI_TOKENS.GetReportCatalogUseCase)
    .to(GetReportCatalogUseCase)
    .inTransientScope();

  container
    .bind<GenerateReportDataUseCase>(DI_TOKENS.GenerateReportDataUseCase)
    .to(GenerateReportDataUseCase)
    .inTransientScope();

  container
    .bind<GenerateReportPdfUseCase>(DI_TOKENS.GenerateReportPdfUseCase)
    .to(GenerateReportPdfUseCase)
    .inTransientScope();

  container
    .bind<CreateReportScheduleUseCase>(DI_TOKENS.CreateReportScheduleUseCase)
    .to(CreateReportScheduleUseCase)
    .inTransientScope();

  container
    .bind<ListReportSchedulesUseCase>(DI_TOKENS.ListReportSchedulesUseCase)
    .to(ListReportSchedulesUseCase)
    .inTransientScope();

  container
    .bind<DeleteReportScheduleUseCase>(DI_TOKENS.DeleteReportScheduleUseCase)
    .to(DeleteReportScheduleUseCase)
    .inTransientScope();

  container
    .bind<ExecuteScheduledReportUseCase>(
      DI_TOKENS.ExecuteScheduledReportUseCase,
    )
    .to(ExecuteScheduledReportUseCase)
    .inTransientScope();

  diLogger.debug(
    "bindReportsDependencies",
    "Reports dependencies bound successfully",
  );
}
