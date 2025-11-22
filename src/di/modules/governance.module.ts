/**
 * Governance Module - DI Bindings
 *
 * Binds repositories and use cases for data domains, data ownerships,
 * verification campaigns, and verification items.
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { logger } from "@/lib/logger";

// Repositories
import type { IDataDomainRepository } from "@/core/repositories/data-domain.repository.interface";
import type { IDataOwnershipRepository } from "@/core/repositories/data-ownership.repository.interface";
import type { IVerificationCampaignRepository } from "@/core/repositories/verification-campaign.repository.interface";
import type { IVerificationItemRepository } from "@/core/repositories/verification-item.repository.interface";
import { PrismaDataDomainRepository } from "@/infrastructure/repositories/prisma-data-domain.repository";
import { PrismaDataOwnershipRepository } from "@/infrastructure/repositories/prisma-data-ownership.repository";
import { PrismaVerificationCampaignRepository } from "@/infrastructure/repositories/prisma-verification-campaign.repository";
import { PrismaVerificationItemRepository } from "@/infrastructure/repositories/prisma-verification-item.repository";

// Use Cases - Data Domain
import { CreateDataDomainUseCase } from "@/core/use-cases/governance/data-domain/create-data-domain.use-case";
import { GetDataDomainUseCase } from "@/core/use-cases/governance/data-domain/get-data-domain.use-case";
import { ListDataDomainsUseCase } from "@/core/use-cases/governance/data-domain/list-data-domains.use-case";
import { UpdateDataDomainUseCase } from "@/core/use-cases/governance/data-domain/update-data-domain.use-case";
import { DeleteDataDomainUseCase } from "@/core/use-cases/governance/data-domain/delete-data-domain.use-case";

// Use Cases - Data Ownership
import { CreateDataOwnershipUseCase } from "@/core/use-cases/governance/data-ownership/create-data-ownership.use-case";
import { GetDataOwnershipUseCase } from "@/core/use-cases/governance/data-ownership/get-data-ownership.use-case";
import { ListDataOwnershipsUseCase } from "@/core/use-cases/governance/data-ownership/list-data-ownerships.use-case";
import { UpdateDataOwnershipUseCase } from "@/core/use-cases/governance/data-ownership/update-data-ownership.use-case";
import { DeleteDataOwnershipUseCase } from "@/core/use-cases/governance/data-ownership/delete-data-ownership.use-case";

// Use Cases - Verification Campaign
import { CreateVerificationCampaignUseCase } from "@/core/use-cases/governance/verification-campaign/create-verification-campaign.use-case";
import { GetVerificationCampaignUseCase } from "@/core/use-cases/governance/verification-campaign/get-verification-campaign.use-case";
import { ListVerificationCampaignsUseCase } from "@/core/use-cases/governance/verification-campaign/list-verification-campaigns.use-case";
import { UpdateVerificationCampaignUseCase } from "@/core/use-cases/governance/verification-campaign/update-verification-campaign.use-case";
import { DeleteVerificationCampaignUseCase } from "@/core/use-cases/governance/verification-campaign/delete-verification-campaign.use-case";
import { StartVerificationCampaignUseCase } from "@/core/use-cases/governance/verification-campaign/start-verification-campaign.use-case";
import { CompleteVerificationCampaignUseCase } from "@/core/use-cases/governance/verification-campaign/complete-verification-campaign.use-case";

// Use Cases - Verification Item
import { CreateVerificationItemUseCase } from "@/core/use-cases/governance/verification-item/create-verification-item.use-case";
import { GetVerificationItemUseCase } from "@/core/use-cases/governance/verification-item/get-verification-item.use-case";
import { ListVerificationItemsUseCase } from "@/core/use-cases/governance/verification-item/list-verification-items.use-case";
import { UpdateVerificationItemUseCase } from "@/core/use-cases/governance/verification-item/update-verification-item.use-case";
import { DeleteVerificationItemUseCase } from "@/core/use-cases/governance/verification-item/delete-verification-item.use-case";
import { VerifyItemUseCase } from "@/core/use-cases/governance/verification-item/verify-verification-item.use-case";
import { FlagExceptionUseCase } from "@/core/use-cases/governance/verification-item/flag-exception-verification-item.use-case";

const diLogger = logger.scope("DI:GovernanceModule");

export function bindGovernanceDependencies(container: Container): void {
  diLogger.debug(
    "bindGovernanceDependencies",
    "Binding Governance dependencies...",
  );

  // Repositories
  container
    .bind<IDataDomainRepository>(DI_TOKENS.IDataDomainRepository)
    .to(PrismaDataDomainRepository)
    .inSingletonScope();

  container
    .bind<IDataOwnershipRepository>(DI_TOKENS.IDataOwnershipRepository)
    .to(PrismaDataOwnershipRepository)
    .inSingletonScope();

  container
    .bind<IVerificationCampaignRepository>(
      DI_TOKENS.IVerificationCampaignRepository,
    )
    .to(PrismaVerificationCampaignRepository)
    .inSingletonScope();

  container
    .bind<IVerificationItemRepository>(DI_TOKENS.IVerificationItemRepository)
    .to(PrismaVerificationItemRepository)
    .inSingletonScope();

  // Data Domain Use Cases
  container
    .bind<CreateDataDomainUseCase>(DI_TOKENS.CreateDataDomainUseCase)
    .to(CreateDataDomainUseCase)
    .inTransientScope();
  container
    .bind<GetDataDomainUseCase>(DI_TOKENS.GetDataDomainUseCase)
    .to(GetDataDomainUseCase)
    .inTransientScope();
  container
    .bind<ListDataDomainsUseCase>(DI_TOKENS.ListDataDomainsUseCase)
    .to(ListDataDomainsUseCase)
    .inTransientScope();
  container
    .bind<UpdateDataDomainUseCase>(DI_TOKENS.UpdateDataDomainUseCase)
    .to(UpdateDataDomainUseCase)
    .inTransientScope();
  container
    .bind<DeleteDataDomainUseCase>(DI_TOKENS.DeleteDataDomainUseCase)
    .to(DeleteDataDomainUseCase)
    .inTransientScope();

  // Data Ownership Use Cases
  container
    .bind<CreateDataOwnershipUseCase>(DI_TOKENS.CreateDataOwnershipUseCase)
    .to(CreateDataOwnershipUseCase)
    .inTransientScope();
  container
    .bind<GetDataOwnershipUseCase>(DI_TOKENS.GetDataOwnershipUseCase)
    .to(GetDataOwnershipUseCase)
    .inTransientScope();
  container
    .bind<ListDataOwnershipsUseCase>(DI_TOKENS.ListDataOwnershipsUseCase)
    .to(ListDataOwnershipsUseCase)
    .inTransientScope();
  container
    .bind<UpdateDataOwnershipUseCase>(DI_TOKENS.UpdateDataOwnershipUseCase)
    .to(UpdateDataOwnershipUseCase)
    .inTransientScope();
  container
    .bind<DeleteDataOwnershipUseCase>(DI_TOKENS.DeleteDataOwnershipUseCase)
    .to(DeleteDataOwnershipUseCase)
    .inTransientScope();

  // Verification Campaign Use Cases
  container
    .bind<CreateVerificationCampaignUseCase>(
      DI_TOKENS.CreateVerificationCampaignUseCase,
    )
    .to(CreateVerificationCampaignUseCase)
    .inTransientScope();
  container
    .bind<GetVerificationCampaignUseCase>(
      DI_TOKENS.GetVerificationCampaignUseCase,
    )
    .to(GetVerificationCampaignUseCase)
    .inTransientScope();
  container
    .bind<ListVerificationCampaignsUseCase>(
      DI_TOKENS.ListVerificationCampaignsUseCase,
    )
    .to(ListVerificationCampaignsUseCase)
    .inTransientScope();
  container
    .bind<UpdateVerificationCampaignUseCase>(
      DI_TOKENS.UpdateVerificationCampaignUseCase,
    )
    .to(UpdateVerificationCampaignUseCase)
    .inTransientScope();
  container
    .bind<DeleteVerificationCampaignUseCase>(
      DI_TOKENS.DeleteVerificationCampaignUseCase,
    )
    .to(DeleteVerificationCampaignUseCase)
    .inTransientScope();
  container
    .bind<StartVerificationCampaignUseCase>(
      DI_TOKENS.StartVerificationCampaignUseCase,
    )
    .to(StartVerificationCampaignUseCase)
    .inTransientScope();
  container
    .bind<CompleteVerificationCampaignUseCase>(
      DI_TOKENS.CompleteVerificationCampaignUseCase,
    )
    .to(CompleteVerificationCampaignUseCase)
    .inTransientScope();

  // Verification Item Use Cases
  container
    .bind<CreateVerificationItemUseCase>(
      DI_TOKENS.CreateVerificationItemUseCase,
    )
    .to(CreateVerificationItemUseCase)
    .inTransientScope();
  container
    .bind<GetVerificationItemUseCase>(DI_TOKENS.GetVerificationItemUseCase)
    .to(GetVerificationItemUseCase)
    .inTransientScope();
  container
    .bind<ListVerificationItemsUseCase>(DI_TOKENS.ListVerificationItemsUseCase)
    .to(ListVerificationItemsUseCase)
    .inTransientScope();
  container
    .bind<UpdateVerificationItemUseCase>(
      DI_TOKENS.UpdateVerificationItemUseCase,
    )
    .to(UpdateVerificationItemUseCase)
    .inTransientScope();
  container
    .bind<DeleteVerificationItemUseCase>(
      DI_TOKENS.DeleteVerificationItemUseCase,
    )
    .to(DeleteVerificationItemUseCase)
    .inTransientScope();
  container
    .bind<VerifyItemUseCase>(DI_TOKENS.VerifyItemUseCase)
    .to(VerifyItemUseCase)
    .inTransientScope();
  container
    .bind<FlagExceptionUseCase>(DI_TOKENS.FlagExceptionUseCase)
    .to(FlagExceptionUseCase)
    .inTransientScope();

  diLogger.debug(
    "bindGovernanceDependencies",
    "Governance dependencies bound successfully",
  );
}
