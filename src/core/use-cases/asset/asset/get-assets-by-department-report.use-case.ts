import { inject, injectable } from "inversify";
import type { IAssetAssignmentRepository } from "@/core/repositories/asset-assignment.repository.interface";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import { DI_TOKENS } from "@/di/types";

export interface AssetsByDepartmentReportItem {
  departmentId: string;
  departmentName: string;
  assetCount: number;
  totalValueSar: number;
  avgPurchaseCostSar: number;
}

@injectable()
export class GetAssetsByDepartmentReportUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetAssignmentRepository)
    private readonly assetAssignmentRepository: IAssetAssignmentRepository,
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
    @inject(DI_TOKENS.IPersonRepository)
    private readonly personRepository: IPersonRepository,
  ) {}

  async execute(): Promise<AssetsByDepartmentReportItem[]> {
    const now = new Date();

    // Fetch assignments (person assignees only) and filter to active
    const assignments =
      await this.assetAssignmentRepository.findByAssigneeType("PERSON");
    const activeAssignments = assignments.filter(
      (assignment) => assignment.endDate === null || assignment.endDate >= now,
    );

    if (activeAssignments.length === 0) {
      return [];
    }

    const uniqueAssetIds = Array.from(
      new Set(activeAssignments.map((a) => a.assetId)),
    );
    const assets = await this.assetRepository.findByIds(uniqueAssetIds);
    const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

    const uniqueAssigneeIds = Array.from(
      new Set(activeAssignments.map((a) => a.assigneeId)),
    );

    const persons = await Promise.all(
      uniqueAssigneeIds.map((id) => this.personRepository.findById(id)),
    );
    const personMap = new Map(
      persons
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .map((p) => [p.id, p]),
    );

    const departmentMap = new Map<
      string,
      { count: number; totalValueSar: number; name: string }
    >();

    for (const assignment of activeAssignments) {
      const asset = assetMap.get(assignment.assetId);
      if (!asset) continue;

      const person = personMap.get(assignment.assigneeId);
      const name =
        person?.department ||
        person?.orgUnitId ||
        `${person?.firstName ?? "Unknown"} ${person?.lastName ?? ""}`.trim() ||
        "Unknown";

      const existing = departmentMap.get(assignment.assigneeId) || {
        count: 0,
        totalValueSar: 0,
        name,
      };

      departmentMap.set(assignment.assigneeId, {
        count: existing.count + 1,
        totalValueSar:
          existing.totalValueSar +
          Number(asset.purchaseCostSar || asset.purchaseCost || 0),
        name: existing.name || name,
      });
    }

    const results: AssetsByDepartmentReportItem[] = Array.from(
      departmentMap.entries(),
    ).map(([deptId, data]) => ({
      departmentId: deptId,
      departmentName: data.name || "Unknown",
      assetCount: data.count,
      totalValueSar: data.totalValueSar,
      avgPurchaseCostSar: data.count > 0 ? data.totalValueSar / data.count : 0,
    }));

    return results.sort((a, b) => b.assetCount - a.assetCount);
  }
}
