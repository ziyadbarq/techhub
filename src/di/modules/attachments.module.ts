/**
 * Attachments Module - DI Bindings
 *
 * Binds repositories and use cases for attachment types and attachments.
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { logger } from "@/lib/logger";

// Repositories
import type { IAttachmentTypeRepository } from "@/core/repositories/attachment-type.repository.interface";
import type { IAttachmentRepository } from "@/core/repositories/attachment.repository.interface";
import { PrismaAttachmentTypeRepository } from "@/infrastructure/repositories/prisma-attachment-type.repository";
import { PrismaAttachmentRepository } from "@/infrastructure/repositories/prisma-attachment.repository";

// Use Cases - Attachment Type
import { CreateAttachmentTypeUseCase } from "@/core/use-cases/attachments/attachment-type/create-attachment-type.use-case";
import { GetAttachmentTypeUseCase } from "@/core/use-cases/attachments/attachment-type/get-attachment-type.use-case";
import { ListAttachmentTypesUseCase } from "@/core/use-cases/attachments/attachment-type/list-attachment-types.use-case";
import { UpdateAttachmentTypeUseCase } from "@/core/use-cases/attachments/attachment-type/update-attachment-type.use-case";
import { DeleteAttachmentTypeUseCase } from "@/core/use-cases/attachments/attachment-type/delete-attachment-type.use-case";

// Use Cases - Attachment
import { CreateAttachmentUseCase } from "@/core/use-cases/attachments/attachment/create-attachment.use-case";
import { GetAttachmentUseCase } from "@/core/use-cases/attachments/attachment/get-attachment.use-case";
import { ListAttachmentsUseCase } from "@/core/use-cases/attachments/attachment/list-attachments.use-case";
import { GetAttachmentsByTargetUseCase } from "@/core/use-cases/attachments/attachment/get-attachments-by-target.use-case";
import { UpdateAttachmentUseCase } from "@/core/use-cases/attachments/attachment/update-attachment.use-case";
import { DeleteAttachmentUseCase } from "@/core/use-cases/attachments/attachment/delete-attachment.use-case";

const diLogger = logger.scope("DI:AttachmentsModule");

export function bindAttachmentsDependencies(container: Container): void {
  diLogger.debug(
    "bindAttachmentsDependencies",
    "Binding Attachments dependencies...",
  );

  // Repositories
  container
    .bind<IAttachmentTypeRepository>(DI_TOKENS.IAttachmentTypeRepository)
    .to(PrismaAttachmentTypeRepository)
    .inSingletonScope();

  container
    .bind<IAttachmentRepository>(DI_TOKENS.IAttachmentRepository)
    .to(PrismaAttachmentRepository)
    .inSingletonScope();

  // Attachment Type Use Cases
  container
    .bind<CreateAttachmentTypeUseCase>(DI_TOKENS.CreateAttachmentTypeUseCase)
    .to(CreateAttachmentTypeUseCase)
    .inTransientScope();
  container
    .bind<GetAttachmentTypeUseCase>(DI_TOKENS.GetAttachmentTypeUseCase)
    .to(GetAttachmentTypeUseCase)
    .inTransientScope();
  container
    .bind<ListAttachmentTypesUseCase>(DI_TOKENS.ListAttachmentTypesUseCase)
    .to(ListAttachmentTypesUseCase)
    .inTransientScope();
  container
    .bind<UpdateAttachmentTypeUseCase>(DI_TOKENS.UpdateAttachmentTypeUseCase)
    .to(UpdateAttachmentTypeUseCase)
    .inTransientScope();
  container
    .bind<DeleteAttachmentTypeUseCase>(DI_TOKENS.DeleteAttachmentTypeUseCase)
    .to(DeleteAttachmentTypeUseCase)
    .inTransientScope();

  // Attachment Use Cases
  container
    .bind<CreateAttachmentUseCase>(DI_TOKENS.CreateAttachmentUseCase)
    .to(CreateAttachmentUseCase)
    .inTransientScope();
  container
    .bind<GetAttachmentUseCase>(DI_TOKENS.GetAttachmentUseCase)
    .to(GetAttachmentUseCase)
    .inTransientScope();
  container
    .bind<ListAttachmentsUseCase>(DI_TOKENS.ListAttachmentsUseCase)
    .to(ListAttachmentsUseCase)
    .inTransientScope();
  container
    .bind<GetAttachmentsByTargetUseCase>(
      DI_TOKENS.GetAttachmentsByTargetUseCase,
    )
    .to(GetAttachmentsByTargetUseCase)
    .inTransientScope();
  container
    .bind<UpdateAttachmentUseCase>(DI_TOKENS.UpdateAttachmentUseCase)
    .to(UpdateAttachmentUseCase)
    .inTransientScope();
  container
    .bind<DeleteAttachmentUseCase>(DI_TOKENS.DeleteAttachmentUseCase)
    .to(DeleteAttachmentUseCase)
    .inTransientScope();

  diLogger.debug(
    "bindAttachmentsDependencies",
    "Attachments dependencies bound successfully",
  );
}
