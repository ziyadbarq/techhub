import { inject, injectable } from "inversify";
import type { IConfigurationItemRepository } from "@/core/repositories/configuration-item.repository.interface";
import type { ICIClassRepository } from "@/core/repositories/ci-class.repository.interface";
import type { ILifecycleStateRepository } from "@/core/repositories/lifecycle-state.repository.interface";
import { DI_TOKENS } from "@/di/types";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";
import type { ILoggerService } from "@/core/services/logger.service.interface";

export interface OciResourceInventoryItem {
  ciId: string;
  ciName: string;
  ciClassName: string;
  environment: string;
  criticality: string;
  lifecycleState: string;
  region: string | null;
  compartment: string | null;
  lastSyncedAt: string | null;
}

export interface OciResourceInventorySummary {
  items: OciResourceInventoryItem[];
  totalResources: number;
  byType: Array<{ type: string; count: number }>;
  byRegion: Array<{ region: string; count: number }>;
  byLifecycleState: Array<{ state: string; count: number }>;
}

@injectable()
export class GetOciResourceInventoryReportUseCase {
  constructor(
    @inject(DI_TOKENS.IConfigurationItemRepository)
    private readonly ciRepo: IConfigurationItemRepository,
    @inject(DI_TOKENS.ICIClassRepository)
    private readonly ciClassRepo: ICIClassRepository,
    @inject(DI_TOKENS.ILifecycleStateRepository)
    private readonly lifecycleStateRepo: ILifecycleStateRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("reports.ociResourceInventory")
  async execute(): Promise<OciResourceInventorySummary> {
    const [allCIs, ciClasses, lifecycleStates] = await Promise.all([
      this.ciRepo.findAll(),
      this.ciClassRepo.findAll(),
      this.lifecycleStateRepo.findAll(),
    ]);

    const classMap = new Map(ciClasses.map((c) => [c.id, c.name]));
    const stateMap = new Map(lifecycleStates.map((s) => [s.id, s.name]));

    // Filter to OCI-sourced CIs by checking attributes
    const ociCIs = allCIs.filter((ci) => {
      const attrs = ci.attributes as Record<string, unknown> | null;
      return attrs && (attrs["OCI_OCID"] || attrs["OCI_SOURCE"]);
    });

    const items: OciResourceInventoryItem[] = ociCIs.map((ci) => {
      const attrs = (ci.attributes as Record<string, unknown>) ?? {};
      return {
        ciId: ci.id,
        ciName: ci.name,
        ciClassName: classMap.get(ci.ciClassId) ?? "Unknown",
        environment: ci.environment ?? "OTHER",
        criticality: ci.criticality ?? "MEDIUM",
        lifecycleState: ci.lifecycleStateId
          ? (stateMap.get(ci.lifecycleStateId) ?? "Unknown")
          : "Unknown",
        region: (attrs["OCI_REGION"] as string) ?? null,
        compartment: (attrs["OCI_COMPARTMENT_NAME"] as string) ?? null,
        lastSyncedAt: (attrs["OCI_LAST_SYNCED_AT"] as string) ?? null,
      };
    });

    // Aggregate by type
    const typeMap = new Map<string, number>();
    for (const item of items) {
      typeMap.set(item.ciClassName, (typeMap.get(item.ciClassName) ?? 0) + 1);
    }
    const byType = Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Aggregate by region
    const regionMap = new Map<string, number>();
    for (const item of items) {
      const region = item.region ?? "Unknown";
      regionMap.set(region, (regionMap.get(region) ?? 0) + 1);
    }
    const byRegion = Array.from(regionMap.entries())
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);

    // Aggregate by lifecycle state
    const stateAggMap = new Map<string, number>();
    for (const item of items) {
      stateAggMap.set(
        item.lifecycleState,
        (stateAggMap.get(item.lifecycleState) ?? 0) + 1,
      );
    }
    const byLifecycleState = Array.from(stateAggMap.entries())
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);

    return {
      items,
      totalResources: items.length,
      byType,
      byRegion,
      byLifecycleState,
    };
  }
}
