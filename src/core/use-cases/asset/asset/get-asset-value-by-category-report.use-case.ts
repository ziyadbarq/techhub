import { inject, injectable } from "inversify";
import type {
  IAssetRepository,
  AssetCategoryValueSummary,
} from "@/core/repositories/asset.repository.interface";
import { DI_TOKENS } from "@/di/types";

export interface AssetCategoryValueReportItem {
  categoryId: string;
  categoryName: string;
  assetCount: number;
  totalValueSar: number;
  avgValueSar: number;
  percentage: number;
}

@injectable()
export class GetAssetValueByCategoryReportUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
  ) {}

  async execute(): Promise<AssetCategoryValueReportItem[]> {
    const summary = await this.assetRepository.findCategoryValueSummary();
    if (summary.length === 0) {
      return [];
    }

    const totalValue = summary.reduce(
      (sum, item) => sum + Number(item.totalPurchaseCostSar || 0),
      0,
    );

    return summary
      .map((item: AssetCategoryValueSummary) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName ?? "Unknown",
        assetCount: item.assetCount,
        totalValueSar: Number(item.totalPurchaseCostSar || 0),
        avgValueSar:
          item.assetCount > 0
            ? Number(item.totalPurchaseCostSar || 0) / item.assetCount
            : 0,
        percentage:
          totalValue > 0
            ? (Number(item.totalPurchaseCostSar || 0) / totalValue) * 100
            : 0,
      }))
      .sort((a, b) => b.totalValueSar - a.totalValueSar);
  }
}
