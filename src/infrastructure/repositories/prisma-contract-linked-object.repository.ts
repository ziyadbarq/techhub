/**
 * Prisma ContractLinkedObject Repository Implementation
 *
 * Implements IContractLinkedObjectRepository using Prisma ORM.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type {
  PrismaClient,
  TargetObjectTypeEnum,
} from "@/generated/prisma/server";
import type { IContractLinkedObjectRepository } from "@/core/repositories/contract-linked-object.repository.interface";
import {
  ContractLinkedObject,
  TargetObjectType,
} from "@/core/domain/entities/contract-linked-object.entity";
import type { ILoggerService } from "@/core/services";

@injectable()
export class PrismaContractLinkedObjectRepository
  implements IContractLinkedObjectRepository
{
  constructor(
    @inject(DI_TOKENS.PrismaClient) private prisma: PrismaClient,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async create(
    linkedObject: ContractLinkedObject,
  ): Promise<ContractLinkedObject> {
    this.logger.debug("Creating contract linked object", {
      id: linkedObject.id,
    });

    const data = await this.prisma.contractLinkedObject.create({
      data: {
        id: linkedObject.id,
        contractId: linkedObject.contractId,
        targetType: this.toDbTargetType(linkedObject.targetType),
        targetId: linkedObject.targetId,
        note: linkedObject.note,
        createdAt: linkedObject.createdAt,
      },
    });

    return this.toDomain(data);
  }

  async findById(id: string): Promise<ContractLinkedObject | null> {
    this.logger.debug("Finding contract linked object by id", { id });

    const data = await this.prisma.contractLinkedObject.findUnique({
      where: { id },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByContractId(contractId: string): Promise<ContractLinkedObject[]> {
    this.logger.debug("Finding linked objects for contract", { contractId });

    const data = await this.prisma.contractLinkedObject.findMany({
      where: { contractId },
      orderBy: { createdAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByTarget(
    targetType: TargetObjectType,
    targetId: string,
  ): Promise<ContractLinkedObject[]> {
    this.logger.debug("Finding linked objects for target", {
      targetType,
      targetId,
    });

    const data = await this.prisma.contractLinkedObject.findMany({
      where: {
        targetType: this.toDbTargetType(targetType),
        targetId,
      },
      orderBy: { createdAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByTargetType(
    targetType: TargetObjectType,
  ): Promise<ContractLinkedObject[]> {
    this.logger.debug("Finding linked objects by type", { targetType });

    const data = await this.prisma.contractLinkedObject.findMany({
      where: { targetType: this.toDbTargetType(targetType) },
      orderBy: { createdAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async update(
    linkedObject: ContractLinkedObject,
  ): Promise<ContractLinkedObject> {
    this.logger.debug("Updating contract linked object", {
      id: linkedObject.id,
    });

    const data = await this.prisma.contractLinkedObject.update({
      where: { id: linkedObject.id },
      data: {
        note: linkedObject.note,
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    this.logger.debug("Deleting contract linked object", { id });

    await this.prisma.contractLinkedObject.delete({
      where: { id },
    });
  }

  async exists(
    contractId: string,
    targetType: TargetObjectType,
    targetId: string,
  ): Promise<boolean> {
    const count = await this.prisma.contractLinkedObject.count({
      where: {
        contractId,
        targetType: this.toDbTargetType(targetType),
        targetId,
      },
    });

    return count > 0;
  }

  /**
   * Converts domain TargetObjectType to Prisma enum
   */
  private toDbTargetType(targetType: TargetObjectType): TargetObjectTypeEnum {
    switch (targetType) {
      case TargetObjectType.CONFIGURATION_ITEM:
        return "CI";
      case TargetObjectType.ASSET:
        return "ASSET";
      case TargetObjectType.LICENSE_ENTITLEMENT:
        return "LICENSE_ENTITLEMENT";
      default:
        throw new Error(`Unknown target type: ${targetType}`);
    }
  }

  /**
   * Converts Prisma enum to domain TargetObjectType
   */
  private fromDbTargetType(dbType: TargetObjectTypeEnum): TargetObjectType {
    switch (dbType) {
      case "CI":
        return TargetObjectType.CONFIGURATION_ITEM;
      case "ASSET":
        return TargetObjectType.ASSET;
      case "LICENSE_ENTITLEMENT":
        return TargetObjectType.LICENSE_ENTITLEMENT;
      default:
        throw new Error(`Unknown database target type: ${dbType}`);
    }
  }

  /**
   * Maps Prisma model to domain entity
   */
  private toDomain(data: {
    id: string;
    contractId: string;
    targetType: TargetObjectTypeEnum;
    targetId: string;
    note: string | null;
    createdAt: Date;
  }): ContractLinkedObject {
    return ContractLinkedObject.restore({
      id: data.id,
      contractId: data.contractId,
      targetType: this.fromDbTargetType(data.targetType),
      targetId: data.targetId,
      note: data.note,
      createdAt: data.createdAt,
    });
  }
}
