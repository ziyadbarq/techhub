/**
 * Prisma Contract Repository Implementation
 *
 * Implements IContractRepository using Prisma ORM.
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";
import type { IContractRepository } from "@/core/repositories/contract.repository.interface";
import { Contract } from "@/core/domain/entities/contract.entity";
import type { ILoggerService } from "@/core/services";
import type { Contract as PrismaContract } from "@/generated/prisma";
import { fromJsonValue, toJsonValue } from "./prisma-helpers";

@injectable()
export class PrismaContractRepository implements IContractRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient) private prisma: PrismaClient,
    @inject(DI_TOKENS.ILoggerService) private logger: ILoggerService,
  ) {}

  async create(contract: Contract): Promise<Contract> {
    this.logger.debug("Creating contract", { contractId: contract.id });

    const data = await this.prisma.contract.create({
      data: {
        id: contract.id,
        contractTypeId: contract.contractTypeId,
        vendorId: contract.vendorId,
        name: contract.name,
        contractNumber: contract.contractNumber,
        startDate: contract.startDate,
        endDate: contract.endDate,
        autoRenew: contract.autoRenew,
        renewalTerms: contract.renewalTerms,
        slaDefinition: toJsonValue(contract.slaDefinition),
        totalValue: contract.totalValue,
        totalValueSar: contract.totalValueSar,
        currency: contract.currency,
        note: contract.note,
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
      },
    });

    return this.toDomain(data);
  }

  async findById(id: string): Promise<Contract | null> {
    this.logger.debug("Finding contract by id", { id });

    const data = await this.prisma.contract.findUnique({
      where: { id },
    });

    return data ? this.toDomain(data) : null;
  }

  async findByContractNumber(contractNumber: string): Promise<Contract | null> {
    this.logger.debug("Finding contract by number", { contractNumber });

    const data = await this.prisma.contract.findUnique({
      where: { contractNumber },
    });

    return data ? this.toDomain(data) : null;
  }

  async findAll(): Promise<Contract[]> {
    this.logger.debug("Finding all contracts");

    const data = await this.prisma.contract.findMany({
      orderBy: { createdAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByContractTypeId(contractTypeId: string): Promise<Contract[]> {
    this.logger.debug("Finding contracts by contract type", { contractTypeId });

    const data = await this.prisma.contract.findMany({
      where: { contractTypeId },
      orderBy: { createdAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findByVendorId(vendorId: string): Promise<Contract[]> {
    this.logger.debug("Finding contracts by vendor", { vendorId });

    const data = await this.prisma.contract.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findAllActive(asOfDate?: Date): Promise<Contract[]> {
    const checkDate = asOfDate ?? new Date();
    this.logger.debug("Finding active contracts", {
      asOf: checkDate.toISOString(),
    });

    const data = await this.prisma.contract.findMany({
      where: {
        startDate: { lte: checkDate },
        OR: [{ endDate: null }, { endDate: { gte: checkDate } }],
      },
      orderBy: { startDate: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async findExpiringSoon(daysAhead: number): Promise<Contract[]> {
    const now = new Date();
    const futureDate = new Date(
      now.getTime() + daysAhead * 24 * 60 * 60 * 1000,
    );

    this.logger.debug("Finding contracts expiring soon", { daysAhead });

    const data = await this.prisma.contract.findMany({
      where: {
        endDate: {
          gte: now,
          lte: futureDate,
        },
      },
      orderBy: { endDate: "asc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async search(
    query: string,
    options?: {
      skip?: number;
      take?: number;
      vendorId?: string;
    },
  ): Promise<Contract[]> {
    this.logger.debug("Searching contracts", { query, options });

    const data = await this.prisma.contract.findMany({
      where: {
        ...(options?.vendorId && { vendorId: options.vendorId }),
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { contractNumber: { contains: query, mode: "insensitive" } },
        ],
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: "desc" },
    });

    return data.map((item) => this.toDomain(item));
  }

  async update(contract: Contract): Promise<Contract> {
    this.logger.debug("Updating contract", { contractId: contract.id });

    const data = await this.prisma.contract.update({
      where: { id: contract.id },
      data: {
        contractTypeId: contract.contractTypeId,
        vendorId: contract.vendorId,
        name: contract.name,
        contractNumber: contract.contractNumber,
        startDate: contract.startDate,
        endDate: contract.endDate,
        autoRenew: contract.autoRenew,
        renewalTerms: contract.renewalTerms,
        slaDefinition: toJsonValue(contract.slaDefinition),
        totalValue: contract.totalValue,
        totalValueSar: contract.totalValueSar,
        currency: contract.currency,
        note: contract.note,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    this.logger.debug("Deleting contract", { id });

    await this.prisma.contract.delete({
      where: { id },
    });
  }

  async existsByContractNumber(
    contractNumber: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.contract.count({
      where: {
        contractNumber,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return count > 0;
  }

  /**
   * Maps Prisma model to domain entity
   */
  private toDomain(data: PrismaContract): Contract {
    return Contract.restore({
      id: data.id,
      contractTypeId: data.contractTypeId,
      vendorId: data.vendorId,
      name: data.name,
      contractNumber: data.contractNumber,
      startDate: data.startDate,
      endDate: data.endDate,
      autoRenew: data.autoRenew,
      renewalTerms: data.renewalTerms,
      slaDefinition: fromJsonValue<Record<string, unknown>>(data.slaDefinition),
      totalValue: data.totalValue !== null ? Number(data.totalValue) : null,
      totalValueSar:
        data.totalValueSar !== null ? Number(data.totalValueSar) : null,
      currency: data.currency,
      note: data.note,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
