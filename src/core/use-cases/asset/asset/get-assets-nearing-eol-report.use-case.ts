import { inject, injectable } from "inversify";
import { differenceInDays } from "date-fns";
import type {
  AssetDepreciationSnapshot,
  IAssetRepository,
} from "@/core/repositories/asset.repository.interface";
import { DI_TOKENS } from "@/di/types";

export type AssetEolStatus = "expired" | "critical" | "warning";

export interface AssetEolReportItem {
  assetTag: string;
  categoryName: string | null;
  purchaseDate: Date | null;
  depreciationEnd: Date | null;
  daysUntilEOL: number;
  status: AssetEolStatus;
}

@injectable()
export class GetAssetsNearingEolReportUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
  ) {}

  async execute(): Promise<AssetEolReportItem[]> {
    const snapshot = await this.assetRepository.findDepreciationSnapshot();
    const now = new Date();

    return snapshot
      .filter(
        (
          asset,
        ): asset is AssetDepreciationSnapshot & { depreciationEnd: Date } =>
          !!asset.depreciationEnd,
      )
      .map((asset) => {
        const daysUntilEOL = differenceInDays(asset.depreciationEnd!, now);

        let status: AssetEolStatus = "warning";
        if (daysUntilEOL < 0) {
          status = "expired";
        } else if (daysUntilEOL <= 90) {
          status = "critical";
        }

        return {
          assetTag: asset.assetTag,
          categoryName: asset.assetCategoryName ?? "Unknown",
          purchaseDate: asset.purchaseDate,
          depreciationEnd: asset.depreciationEnd,
          daysUntilEOL,
          status,
        };
      })
      .filter(
        (asset) =>
          asset.status === "expired" ||
          asset.status === "critical" ||
          (asset.status === "warning" && asset.daysUntilEOL <= 365),
      )
      .sort((a, b) => a.daysUntilEOL - b.daysUntilEOL);
  }
}
