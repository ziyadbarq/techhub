/**
 * Prisma ContractType Repository Implementation
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";
import type { IContractTypeRepository } from "@/core/repositories/contract-type.repository.interface";
import { ContractType } from "@/core/domain/entities/contract-type.entity";
import type { ContractType as PrismaContractType } from "@/generated/prisma";

@injectable()
export class PrismaContractTypeRepository implements IContractTypeRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}
  async create(contractType: ContractType): Promise<ContractType> {
    const created = await this.prisma.contractType.create({
      data: {
        name: contractType.name,
        code: contractType.code,
        description: contractType.description,
        isActive: contractType.isActive,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<ContractType | null> {
    const contractType = await this.prisma.contractType.findUnique({
      where: { id },
    });

    return contractType ? this.toDomain(contractType) : null;
  }

  async findByName(name: string): Promise<ContractType | null> {
    const contractType = await this.prisma.contractType.findUnique({
      where: { name },
    });

    return contractType ? this.toDomain(contractType) : null;
  }

  async findByCode(code: string): Promise<ContractType | null> {
    const contractType = await this.prisma.contractType.findUnique({
      where: { code },
    });

    return contractType ? this.toDomain(contractType) : null;
  }

  async findAll(): Promise<ContractType[]> {
    const contractTypes = await this.prisma.contractType.findMany({
      orderBy: { name: "asc" },
    });

    return contractTypes.map((ct) => this.toDomain(ct));
  }

  async findAllActive(): Promise<ContractType[]> {
    const contractTypes = await this.prisma.contractType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return contractTypes.map((ct) => this.toDomain(ct));
  }

  async update(contractType: ContractType): Promise<ContractType> {
    const updated = await this.prisma.contractType.update({
      where: { id: contractType.id },
      data: {
        name: contractType.name,
        code: contractType.code,
        description: contractType.description,
        isActive: contractType.isActive,
        updatedAt: contractType.updatedAt,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.contractType.delete({
      where: { id },
    });
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.contractType.count({
      where: {
        name,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return count > 0;
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.contractType.count({
      where: {
        code,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return count > 0;
  }

  private toDomain(prismaType: PrismaContractType): ContractType {
    return ContractType.reconstitute({
      id: prismaType.id,
      name: prismaType.name,
      code: prismaType.code,
      description: prismaType.description,
      isActive: prismaType.isActive,
      createdAt: prismaType.createdAt,
      updatedAt: prismaType.updatedAt,
    });
  }
}
