/**
 * Prisma Exchange Rate Repository Implementation
 */

import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import type { ExchangeRate as PrismaExchangeRate } from "@/generated/prisma";

import { DI_TOKENS } from "@/di/types";
import { ExchangeRate } from "@/core/domain/entities/exchange-rate.entity";
import type { IExchangeRateRepository } from "@/core/repositories/exchange-rate.repository.interface";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaExchangeRateRepository implements IExchangeRateRepository {
  private readonly logger = createRepositoryLogger("ExchangeRateRepository");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(exchangeRate: ExchangeRate): Promise<ExchangeRate> {
    const timer = this.logger.startTimer();

    try {
      const created = await this.prisma.exchangeRate.create({
        data: {
          currency: exchangeRate.currency,
          rateToSAR: exchangeRate.rateToSAR,
          isActive: exchangeRate.isActive,
        },
      });

      this.logger.timed("create", "Exchange rate created", timer(), {
        id: created.id,
        currency: created.currency,
      });
      return this.toDomain(created);
    } catch (error) {
      this.logger.error("create", "Failed to create exchange rate", error);
      throw error;
    }
  }

  async findById(id: string): Promise<ExchangeRate | null> {
    const exchangeRate = await this.prisma.exchangeRate.findUnique({
      where: { id },
    });

    return exchangeRate ? this.toDomain(exchangeRate) : null;
  }

  async findByCurrency(currency: string): Promise<ExchangeRate | null> {
    const exchangeRate = await this.prisma.exchangeRate.findUnique({
      where: { currency: currency.toUpperCase() },
    });

    return exchangeRate ? this.toDomain(exchangeRate) : null;
  }

  async findActiveByCurrency(currency: string): Promise<ExchangeRate | null> {
    const exchangeRate = await this.prisma.exchangeRate.findFirst({
      where: {
        currency: currency.toUpperCase(),
        isActive: true,
      },
    });

    return exchangeRate ? this.toDomain(exchangeRate) : null;
  }

  async findAll(options?: {
    onlyActive?: boolean;
    orderBy?: "currency" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<ExchangeRate[]> {
    const exchangeRates = await this.prisma.exchangeRate.findMany({
      where: options?.onlyActive ? { isActive: true } : undefined,
      orderBy: options?.orderBy
        ? { [options.orderBy]: options.order ?? "asc" }
        : { currency: "asc" },
    });

    return exchangeRates.map((rate: PrismaExchangeRate) => this.toDomain(rate));
  }

  async count(onlyActive?: boolean): Promise<number> {
    return await this.prisma.exchangeRate.count({
      where: onlyActive ? { isActive: true } : undefined,
    });
  }

  async update(exchangeRate: ExchangeRate): Promise<ExchangeRate> {
    const timer = this.logger.startTimer();

    try {
      const updated = await this.prisma.exchangeRate.update({
        where: { id: exchangeRate.id },
        data: {
          rateToSAR: exchangeRate.rateToSAR,
          isActive: exchangeRate.isActive,
          updatedAt: exchangeRate.updatedAt,
        },
      });

      this.logger.timed("update", "Exchange rate updated", timer(), {
        id: updated.id,
        currency: updated.currency,
      });
      return this.toDomain(updated);
    } catch (error) {
      this.logger.error("update", "Failed to update exchange rate", error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const timer = this.logger.startTimer();

    try {
      // Soft delete by marking as inactive
      await this.prisma.exchangeRate.update({
        where: { id },
        data: { isActive: false },
      });

      this.logger.timed("delete", "Exchange rate deactivated", timer(), { id });
    } catch (error) {
      this.logger.error("delete", "Failed to delete exchange rate", error);
      throw error;
    }
  }

  async existsByCurrency(
    currency: string,
    excludeId?: string,
  ): Promise<boolean> {
    const exchangeRate = await this.prisma.exchangeRate.findFirst({
      where: {
        currency: currency.toUpperCase(),
        ...(excludeId && { NOT: { id: excludeId } }),
      },
      select: { id: true },
    });
    return !!exchangeRate;
  }

  private toDomain(prismaExchangeRate: PrismaExchangeRate): ExchangeRate {
    return ExchangeRate.reconstitute({
      id: prismaExchangeRate.id,
      currency: prismaExchangeRate.currency,
      rateToSAR: prismaExchangeRate.rateToSAR,
      isActive: prismaExchangeRate.isActive,
      createdAt: prismaExchangeRate.createdAt,
      updatedAt: prismaExchangeRate.updatedAt,
    });
  }
}
