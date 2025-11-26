/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import type { DisposalDocument } from "@/core/domain/entities/disposal-document.entity";
import type { DisposalDocumentDTO } from "../dtos/generated/disposal-document.dto";

export class DisposalDocumentPresenter {
  static toDTO(document: DisposalDocument): DisposalDocumentDTO {
    return {
      id: document.id,
      disposalId: document.disposalId,
      documentType: document.documentType,
      fileName: document.fileName,
      filePath: document.filePath,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      uploadedById: document.uploadedById,
      uploadedAt: document.uploadedAt,
    };
  }

  static toDTOList(documents: DisposalDocument[]): DisposalDocumentDTO[] {
    return documents.map((document) => this.toDTO(document));
  }
}
