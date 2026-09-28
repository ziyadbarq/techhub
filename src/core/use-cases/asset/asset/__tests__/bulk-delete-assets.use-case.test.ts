/**
 * BulkDeleteAssetsUseCase - Unit Tests
 *
 * Verifies the bulk delete loop delegates each asset to
 * DeleteAssetWithConfirmationUseCase and reports accurate counts.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { BulkDeleteAssetsUseCase } from "../bulk-delete-assets.use-case";
import type { DeleteAssetWithConfirmationUseCase } from "../delete-asset-with-confirmation.use-case";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

describe("BulkDeleteAssetsUseCase", () => {
  let mockDeleteAssetUseCase: {
    execute: ReturnType<typeof vi.fn>;
    executeSoftDelete: ReturnType<typeof vi.fn>;
  };
  let useCase: BulkDeleteAssetsUseCase;

  beforeEach(() => {
    mockDeleteAssetUseCase = {
      execute: vi.fn(),
      executeSoftDelete: vi.fn().mockResolvedValue(undefined),
    };
    useCase = new BulkDeleteAssetsUseCase(
      mockDeleteAssetUseCase as unknown as DeleteAssetWithConfirmationUseCase,
    );
  });

  it("returns zero counts for an empty request", async () => {
    const result = await useCase.execute([]);

    expect(result).toEqual({
      requestedCount: 0,
      deletedCount: 0,
      skippedCount: 0,
    });
    expect(mockDeleteAssetUseCase.execute).not.toHaveBeenCalled();
  });

  it("soft deletes every asset that has no blockers", async () => {
    mockDeleteAssetUseCase.execute.mockResolvedValue({
      canDelete: true,
      blockers: [],
    });

    const result = await useCase.execute(["a", "b", "c"]);

    expect(result).toEqual({
      requestedCount: 3,
      deletedCount: 3,
      skippedCount: 0,
    });
    expect(mockDeleteAssetUseCase.executeSoftDelete).toHaveBeenCalledTimes(3);
  });

  it("skips assets that have blockers without soft deleting them", async () => {
    mockDeleteAssetUseCase.execute
      .mockResolvedValueOnce({ canDelete: true, blockers: [] })
      .mockResolvedValueOnce({
        canDelete: false,
        blockers: ["1 active assignment(s). Unassign the asset first."],
      });

    const result = await useCase.execute(["deletable", "blocked"]);

    expect(result).toEqual({
      requestedCount: 2,
      deletedCount: 1,
      skippedCount: 1,
    });
    expect(mockDeleteAssetUseCase.executeSoftDelete).toHaveBeenCalledTimes(1);
    expect(mockDeleteAssetUseCase.executeSoftDelete).toHaveBeenCalledWith(
      "deletable",
    );
  });

  it("skips ids that no longer resolve to an asset", async () => {
    mockDeleteAssetUseCase.execute.mockRejectedValue(
      new NotFoundError('Asset with ID "missing" not found'),
    );

    const result = await useCase.execute(["missing"]);

    expect(result).toEqual({
      requestedCount: 1,
      deletedCount: 0,
      skippedCount: 1,
    });
    expect(mockDeleteAssetUseCase.executeSoftDelete).not.toHaveBeenCalled();
  });

  it("propagates unexpected errors instead of silently skipping", async () => {
    mockDeleteAssetUseCase.execute.mockRejectedValue(
      new Error("Database unavailable"),
    );

    await expect(useCase.execute(["a"])).rejects.toThrow(
      "Database unavailable",
    );
  });
});
