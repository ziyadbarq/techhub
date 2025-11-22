/**
 * Disposal Module - DI Bindings
 *
 * This module configures all Disposal Workflow dependencies:
 * - Repositories (asset disposals, approvals, documents)
 * - Use cases (disposal workflow, approval process, certificate generation)
 *
 * Disposal module provides comprehensive asset disposal workflow with
 * multi-level approvals, sanitization tracking, and certificate of destruction.
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { logger } from "@/lib/logger";

// Asset Disposal Repository
import type { IAssetDisposalRepository } from "@/core/repositories/asset-disposal.repository.interface";
import { PrismaAssetDisposalRepository } from "@/infrastructure/repositories/prisma-asset-disposal.repository";

// Disposal Approval Repository
import type { IDisposalApprovalRepository } from "@/core/repositories/disposal-approval.repository.interface";
import { PrismaDisposalApprovalRepository } from "@/infrastructure/repositories/prisma-disposal-approval.repository";

// Disposal Document Repository
import type { IDisposalDocumentRepository } from "@/core/repositories/disposal-document.repository.interface";
import { PrismaDisposalDocumentRepository } from "@/infrastructure/repositories/prisma-disposal-document.repository";

// Disposal Use Cases
import {
  CreateAssetDisposalUseCase,
  GetAssetDisposalUseCase,
  ListAssetDisposalsUseCase,
  ApproveDisposalUseCase,
  RejectDisposalUseCase,
  StartDisposalUseCase,
  CompleteSanitizationUseCase,
  CompleteDisposalUseCase,
  GenerateCertificateUseCase,
  GenerateDisposalCertificatePDFUseCase,
  CancelDisposalUseCase,
  DeleteAssetDisposalUseCase,
} from "@/core/use-cases/disposal";

const diLogger = logger.scope("DI");

/**
 * Load disposal workflow module into DI container
 */
export function loadDisposalModule(container: Container): void {
  diLogger.debug("loadDisposalModule", "Loading Disposal module...");

  // ==========================================
  // Repositories
  // ==========================================

  container
    .bind<IAssetDisposalRepository>(DI_TOKENS.IAssetDisposalRepository)
    .to(PrismaAssetDisposalRepository)
    .inSingletonScope();

  container
    .bind<IDisposalApprovalRepository>(DI_TOKENS.IDisposalApprovalRepository)
    .to(PrismaDisposalApprovalRepository)
    .inSingletonScope();

  container
    .bind<IDisposalDocumentRepository>(DI_TOKENS.IDisposalDocumentRepository)
    .to(PrismaDisposalDocumentRepository)
    .inSingletonScope();

  // ==========================================
  // Use Cases
  // ==========================================

  // Asset Disposal Workflow
  container
    .bind<CreateAssetDisposalUseCase>(DI_TOKENS.CreateAssetDisposalUseCase)
    .to(CreateAssetDisposalUseCase)
    .inSingletonScope();

  container
    .bind<GetAssetDisposalUseCase>(DI_TOKENS.GetAssetDisposalUseCase)
    .to(GetAssetDisposalUseCase)
    .inSingletonScope();

  container
    .bind<ListAssetDisposalsUseCase>(DI_TOKENS.ListAssetDisposalsUseCase)
    .to(ListAssetDisposalsUseCase)
    .inSingletonScope();

  container
    .bind<ApproveDisposalUseCase>(DI_TOKENS.ApproveDisposalUseCase)
    .to(ApproveDisposalUseCase)
    .inSingletonScope();

  container
    .bind<RejectDisposalUseCase>(DI_TOKENS.RejectDisposalUseCase)
    .to(RejectDisposalUseCase)
    .inSingletonScope();

  container
    .bind<StartDisposalUseCase>(DI_TOKENS.StartDisposalUseCase)
    .to(StartDisposalUseCase)
    .inSingletonScope();

  container
    .bind<CompleteSanitizationUseCase>(DI_TOKENS.CompleteSanitizationUseCase)
    .to(CompleteSanitizationUseCase)
    .inSingletonScope();

  container
    .bind<CompleteDisposalUseCase>(DI_TOKENS.CompleteDisposalUseCase)
    .to(CompleteDisposalUseCase)
    .inSingletonScope();

  container
    .bind<GenerateCertificateUseCase>(DI_TOKENS.GenerateCertificateUseCase)
    .to(GenerateCertificateUseCase)
    .inSingletonScope();

  container
    .bind<GenerateDisposalCertificatePDFUseCase>(
      DI_TOKENS.GenerateDisposalCertificatePDFUseCase,
    )
    .to(GenerateDisposalCertificatePDFUseCase)
    .inSingletonScope();

  container
    .bind<CancelDisposalUseCase>(DI_TOKENS.CancelDisposalUseCase)
    .to(CancelDisposalUseCase)
    .inSingletonScope();

  container
    .bind<DeleteAssetDisposalUseCase>(DI_TOKENS.DeleteAssetDisposalUseCase)
    .to(DeleteAssetDisposalUseCase)
    .inSingletonScope();

  diLogger.debug("loadDisposalModule", "Disposal module loaded successfully");
}
