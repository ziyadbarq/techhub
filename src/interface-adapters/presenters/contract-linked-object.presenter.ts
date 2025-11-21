/**
 * ContractLinkedObject Presenter
 * Transforms ContractLinkedObject entities to DTOs for the presentation layer
 */

import type {
  ContractLinkedObject,
  TargetObjectType,
} from "@/core/domain/entities/contract-linked-object.entity";

export interface ContractLinkedObjectDTO {
  id: string;
  contractId: string;
  targetType: TargetObjectType;
  targetId: string;
  note: string | null;
  createdAt: Date;
}

export class ContractLinkedObjectPresenter {
  static toDTO(linkedObject: ContractLinkedObject): ContractLinkedObjectDTO {
    return {
      id: linkedObject.id,
      contractId: linkedObject.contractId,
      targetType: linkedObject.targetType,
      targetId: linkedObject.targetId,
      note: linkedObject.note,
      createdAt: linkedObject.createdAt,
    };
  }

  static toDTOList(
    linkedObjects: ContractLinkedObject[],
  ): ContractLinkedObjectDTO[] {
    return linkedObjects.map((linkedObject) => this.toDTO(linkedObject));
  }
}
