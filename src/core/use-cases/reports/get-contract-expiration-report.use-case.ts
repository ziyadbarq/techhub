import { inject, injectable } from "inversify";
import { differenceInDays } from "date-fns";
import type { IContractRepository } from "@/core/repositories/contract.repository.interface";
import { DI_TOKENS } from "@/di/types";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";
import type { ILoggerService } from "@/core/services/logger.service.interface";

export type ContractExpirationStatus =
  | "active"
  | "expiring_30"
  | "expiring_60"
  | "expiring_90"
  | "expired";

export interface ContractExpirationReportItem {
  contractId: string;
  contractName: string;
  contractNumber: string | null;
  startDate: Date;
  endDate: Date | null;
  daysUntilExpiry: number | null;
  autoRenew: boolean;
  totalValueSar: number | null;
  status: ContractExpirationStatus;
}

export interface ContractExpirationReportSummary {
  items: ContractExpirationReportItem[];
  totalContracts: number;
  activeCount: number;
  expiring30Count: number;
  expiring60Count: number;
  expiring90Count: number;
  expiredCount: number;
  totalValueAtRiskSar: number;
}

@injectable()
export class GetContractExpirationReportUseCase {
  constructor(
    @inject(DI_TOKENS.IContractRepository)
    private readonly contractRepo: IContractRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("reports.contractExpiration")
  async execute(): Promise<ContractExpirationReportSummary> {
    const now = new Date();
    const contracts = await this.contractRepo.findAll();

    const items: ContractExpirationReportItem[] = contracts.map((contract) => {
      const daysUntilExpiry = contract.endDate
        ? differenceInDays(contract.endDate, now)
        : null;

      let status: ContractExpirationStatus = "active";
      if (daysUntilExpiry !== null) {
        if (daysUntilExpiry < 0) {
          status = "expired";
        } else if (daysUntilExpiry <= 30) {
          status = "expiring_30";
        } else if (daysUntilExpiry <= 60) {
          status = "expiring_60";
        } else if (daysUntilExpiry <= 90) {
          status = "expiring_90";
        }
      }

      return {
        contractId: contract.id,
        contractName: contract.name,
        contractNumber: contract.contractNumber,
        startDate: contract.startDate,
        endDate: contract.endDate,
        daysUntilExpiry,
        autoRenew: contract.autoRenew,
        totalValueSar: contract.totalValueSar,
        status,
      };
    });

    // Sort by urgency: expired first, then expiring_30, expiring_60, expiring_90, active
    const statusOrder: Record<ContractExpirationStatus, number> = {
      expired: 0,
      expiring_30: 1,
      expiring_60: 2,
      expiring_90: 3,
      active: 4,
    };
    items.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    const atRiskItems = items.filter(
      (i) =>
        i.status === "expiring_30" ||
        i.status === "expiring_60" ||
        i.status === "expiring_90",
    );
    const totalValueAtRiskSar = atRiskItems.reduce(
      (sum, item) => sum + (item.totalValueSar ?? 0),
      0,
    );

    return {
      items,
      totalContracts: items.length,
      activeCount: items.filter((i) => i.status === "active").length,
      expiring30Count: items.filter((i) => i.status === "expiring_30").length,
      expiring60Count: items.filter((i) => i.status === "expiring_60").length,
      expiring90Count: items.filter((i) => i.status === "expiring_90").length,
      expiredCount: items.filter((i) => i.status === "expired").length,
      totalValueAtRiskSar,
    };
  }
}
