import { inject, injectable } from "inversify";
import { differenceInDays } from "date-fns";
import type {
  IAssetRepository,
  UnassignedAssetSnapshot,
} from "@/core/repositories/asset.repository.interface";
import { DI_TOKENS } from "@/di/types";

export interface UnassignedAssetReportItem {
  assetTag: string;
  categoryName: string;
  stockLocationName: string;
  purchaseDate: Date | null;
  daysInStock: number;
}

@injectable()
export class GetUnassignedAssetsReportUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
  ) {}

  async execute(): Promise<UnassignedAssetReportItem[]> {
    const now = new Date();
    const assets = await this.assetRepository.findUnassignedAssetsSnapshot(now);

    return assets
      .map((asset: UnassignedAssetSnapshot) => {
        const purchaseDate = asset.purchaseDate;
        const daysInStock = purchaseDate
          ? differenceInDays(now, purchaseDate)
          : 0;

        return {
          assetTag: asset.assetTag,
          categoryName: asset.assetCategoryName ?? "Unknown",
          stockLocationName: asset.stockLocationName ?? "Unknown",
          purchaseDate,
          daysInStock,
        };
      })
      .sort((a, b) => b.daysInStock - a.daysInStock);
  }
}
