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
      sizeBytes: document.sizeBytes,
      mimeType: document.mimeType,
      uploadedById: document.uploadedById,
      uploadedAt: document.uploadedAt,
    };
  }

  static toDTOList(documents: DisposalDocument[]): DisposalDocumentDTO[] {
    return documents.map((document) => this.toDTO(document));
  }
}
