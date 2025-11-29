/**
 * Asset Use Cases - Barrel Export
 */

export { CreateAssetUseCase } from "./create-asset.use-case";
export { GetAssetUseCase } from "./get-asset.use-case";
export { ListAssetsUseCase } from "./list-assets.use-case";
export { ListAssetsPaginatedUseCase } from "./list-assets-paginated.use-case";
export { UpdateAssetUseCase } from "./update-asset.use-case";
export { DeleteAssetUseCase } from "./delete-asset.use-case";
export { DeleteAssetWithConfirmationUseCase } from "./delete-asset-with-confirmation.use-case";
export { GetAssetStatisticsUseCase } from "./get-asset-statistics.use-case";
export {
  BulkDeleteAssetsUseCase,
  type BulkDeleteResult,
} from "./bulk-delete-assets.use-case";
export {
  BulkUpdateAssetStatusUseCase,
  type BulkUpdateStatusResult,
} from "./bulk-update-asset-status.use-case";
