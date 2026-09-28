/**
 * BulkDeleteAssets Use Case
 * Business Logic: Soft-delete multiple assets at once
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { NotFoundError } from "@/core/domain/errors/not-found.error";
import type { DeleteAssetWithConfirmationUseCase } from "./delete-asset-with-confirmation.use-case";

export interface BulkDeleteResult {
  requestedCount: number;
  deletedCount: number;
  skippedCount: number;
}

@injectable()
export class BulkDeleteAssetsUseCase {
  constructor(
    @inject(DI_TOKENS.DeleteAssetWithConfirmationUseCase)
    private readonly deleteAssetUseCase: DeleteAssetWithConfirmationUseCase,
  ) {}

  async execute(ids: string[]): Promise<BulkDeleteResult> {
    if (ids.length === 0) {
      return {
        requestedCount: 0,
        deletedCount: 0,
        skippedCount: 0,
      };
    }

    let deletedCount = 0;

    for (const id of ids) {
      let confirmation;
      try {
        confirmation = await this.deleteAssetUseCase.execute({ id });
      } catch (error) {
        if (error instanceof NotFoundError) {
          continue;
        }
        throw error;
      }

      if (!confirmation.canDelete) {
        continue;
      }

      await this.deleteAssetUseCase.executeSoftDelete(id);
      deletedCount += 1;
    }

    return {
      requestedCount: ids.length,
      deletedCount,
      skippedCount: ids.length - deletedCount,
    };
  }
}
