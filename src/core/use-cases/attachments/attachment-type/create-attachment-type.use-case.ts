/**
 * Create AttachmentType Use Case
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAttachmentTypeRepository } from "@/core/repositories/attachment-type.repository.interface";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";
import { AttachmentType } from "@/core/domain/entities/attachment-type.entity";

export interface CreateAttachmentTypeRequest {
  name: string;
  code?: string;
  description?: string | null;
  allowedExtensions?: string[];
  maxFileSizeMB?: number;
  isActive?: boolean;
}

@injectable()
export class CreateAttachmentTypeUseCase {
  constructor(
    @inject(DI_TOKENS.IAttachmentTypeRepository)
    private attachmentTypeRepository: IAttachmentTypeRepository,
    @inject(DI_TOKENS.ICodeGeneratorService)
    private readonly codeGenerator: ICodeGeneratorService,
  ) {}

  async execute(request: CreateAttachmentTypeRequest): Promise<AttachmentType> {
    // Auto-generate code if not provided or empty
    const code =
      request.code ||
      (await this.codeGenerator.generateCode("ATTACHMENT_TYPE", "ATT"));

    // Check for duplicate name
    const existingByName = await this.attachmentTypeRepository.existsByName(
      request.name,
    );
    if (existingByName) {
      throw new Error("An attachment type with this name already exists");
    }

    // Check for duplicate code
    const existingByCode =
      await this.attachmentTypeRepository.existsByCode(code);
    if (existingByCode) {
      throw new Error("An attachment type with this code already exists");
    }

    // Create attachment type entity
    const attachmentType = AttachmentType.create({
      name: request.name,
      code,
      description: request.description,
      allowedExtensions: request.allowedExtensions,
      maxFileSizeMB: request.maxFileSizeMB,
      isActive: request.isActive,
    });

    return await this.attachmentTypeRepository.create(attachmentType);
  }
}
