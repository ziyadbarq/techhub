/**
 * Contracts Module - DI Bindings
 *
 * Binds repositories and use cases for contract types and contracts.
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { logger } from "@/lib/logger";

// Repositories
import type { IContractTypeRepository } from "@/core/repositories/contract-type.repository.interface";
import type { IContractRepository } from "@/core/repositories/contract.repository.interface";
import type { IContractLinkedObjectRepository } from "@/core/repositories/contract-linked-object.repository.interface";
import { PrismaContractTypeRepository } from "@/infrastructure/repositories/prisma-contract-type.repository";
import { PrismaContractRepository } from "@/infrastructure/repositories/prisma-contract.repository";
import { PrismaContractLinkedObjectRepository } from "@/infrastructure/repositories/prisma-contract-linked-object.repository";

// Use Cases - Contract Types
import { CreateContractTypeUseCase } from "@/core/use-cases/contract-type/create-contract-type.use-case";
import { GetContractTypeUseCase } from "@/core/use-cases/contract-type/get-contract-type.use-case";
import { ListContractTypesUseCase } from "@/core/use-cases/contract-type/list-contract-types.use-case";
import { UpdateContractTypeUseCase } from "@/core/use-cases/contract-type/update-contract-type.use-case";
import { DeleteContractTypeUseCase } from "@/core/use-cases/contract-type/delete-contract-type.use-case";

// Use Cases - Contracts
import { CreateContractUseCase } from "@/core/use-cases/contract/create-contract.use-case";
import { GetContractUseCase } from "@/core/use-cases/contract/get-contract.use-case";
import { ListContractsUseCase } from "@/core/use-cases/contract/list-contracts.use-case";
import { UpdateContractUseCase } from "@/core/use-cases/contract/update-contract.use-case";
import { DeleteContractUseCase } from "@/core/use-cases/contract/delete-contract.use-case";

// Use Cases - Contract Linked Objects
import { CreateContractLinkedObjectUseCase } from "@/core/use-cases/contract-linked-object/create-contract-linked-object.use-case";
import { GetContractLinkedObjectUseCase } from "@/core/use-cases/contract-linked-object/get-contract-linked-object.use-case";
import { ListContractLinkedObjectsUseCase } from "@/core/use-cases/contract-linked-object/list-contract-linked-objects.use-case";
import { UpdateContractLinkedObjectUseCase } from "@/core/use-cases/contract-linked-object/update-contract-linked-object.use-case";
import { DeleteContractLinkedObjectUseCase } from "@/core/use-cases/contract-linked-object/delete-contract-linked-object.use-case";

// Report Use Cases
import { GetContractExpirationReportUseCase } from "@/core/use-cases/reports/get-contract-expiration-report.use-case";

const diLogger = logger.scope("DI:ContractsModule");

export function bindContractsDependencies(container: Container): void {
  diLogger.debug(
    "bindContractsDependencies",
    "Binding Contracts dependencies...",
  );

  // Repositories
  container
    .bind<IContractTypeRepository>(DI_TOKENS.IContractTypeRepository)
    .to(PrismaContractTypeRepository)
    .inSingletonScope();

  container
    .bind<IContractRepository>(DI_TOKENS.IContractRepository)
    .to(PrismaContractRepository)
    .inSingletonScope();

  container
    .bind<IContractLinkedObjectRepository>(
      DI_TOKENS.IContractLinkedObjectRepository,
    )
    .to(PrismaContractLinkedObjectRepository)
    .inSingletonScope();

  // Contract Type Use Cases
  container
    .bind<CreateContractTypeUseCase>(DI_TOKENS.CreateContractTypeUseCase)
    .to(CreateContractTypeUseCase)
    .inTransientScope();
  container
    .bind<GetContractTypeUseCase>(DI_TOKENS.GetContractTypeUseCase)
    .to(GetContractTypeUseCase)
    .inTransientScope();
  container
    .bind<ListContractTypesUseCase>(DI_TOKENS.ListContractTypesUseCase)
    .to(ListContractTypesUseCase)
    .inTransientScope();
  container
    .bind<UpdateContractTypeUseCase>(DI_TOKENS.UpdateContractTypeUseCase)
    .to(UpdateContractTypeUseCase)
    .inTransientScope();
  container
    .bind<DeleteContractTypeUseCase>(DI_TOKENS.DeleteContractTypeUseCase)
    .to(DeleteContractTypeUseCase)
    .inTransientScope();

  // Contract Use Cases
  container
    .bind<CreateContractUseCase>(DI_TOKENS.CreateContractUseCase)
    .to(CreateContractUseCase)
    .inTransientScope();
  container
    .bind<GetContractUseCase>(DI_TOKENS.GetContractUseCase)
    .to(GetContractUseCase)
    .inTransientScope();
  container
    .bind<ListContractsUseCase>(DI_TOKENS.ListContractsUseCase)
    .to(ListContractsUseCase)
    .inTransientScope();
  container
    .bind<UpdateContractUseCase>(DI_TOKENS.UpdateContractUseCase)
    .to(UpdateContractUseCase)
    .inTransientScope();
  container
    .bind<DeleteContractUseCase>(DI_TOKENS.DeleteContractUseCase)
    .to(DeleteContractUseCase)
    .inTransientScope();

  // Contract Linked Object Use Cases
  container
    .bind<CreateContractLinkedObjectUseCase>(
      DI_TOKENS.CreateContractLinkedObjectUseCase,
    )
    .to(CreateContractLinkedObjectUseCase)
    .inTransientScope();
  container
    .bind<GetContractLinkedObjectUseCase>(
      DI_TOKENS.GetContractLinkedObjectUseCase,
    )
    .to(GetContractLinkedObjectUseCase)
    .inTransientScope();
  container
    .bind<ListContractLinkedObjectsUseCase>(
      DI_TOKENS.ListContractLinkedObjectsUseCase,
    )
    .to(ListContractLinkedObjectsUseCase)
    .inTransientScope();
  container
    .bind<UpdateContractLinkedObjectUseCase>(
      DI_TOKENS.UpdateContractLinkedObjectUseCase,
    )
    .to(UpdateContractLinkedObjectUseCase)
    .inTransientScope();
  container
    .bind<DeleteContractLinkedObjectUseCase>(
      DI_TOKENS.DeleteContractLinkedObjectUseCase,
    )
    .to(DeleteContractLinkedObjectUseCase)
    .inTransientScope();

  // Report Use Cases
  container
    .bind<GetContractExpirationReportUseCase>(
      DI_TOKENS.GetContractExpirationReportUseCase,
    )
    .to(GetContractExpirationReportUseCase)
    .inTransientScope();
}
