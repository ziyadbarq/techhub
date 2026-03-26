import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleOciResourceSync } from "../oci-resource-sync.handler";
import type { OciSyncJobData } from "@/core/domain/jobs/job-data.types";

const mockFeatureFlagRepository = {
  isFeatureEnabled: vi.fn(),
};

const mockSyncUseCase = {
  execute: vi.fn(),
};

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

vi.mock("@/di/container", () => ({
  getContainer: vi.fn(() => ({
    get: vi.fn((token) => {
      const tokenKey = token.toString();
      if (tokenKey === Symbol.for("IFeatureFlagRepository").toString()) {
        return mockFeatureFlagRepository;
      }
      if (tokenKey === Symbol.for("SyncOciResourcesUseCase").toString()) {
        return mockSyncUseCase;
      }
      if (tokenKey === Symbol.for("ILoggerService").toString()) {
        return mockLogger;
      }
      return null;
    }),
  })),
}));

describe("handleOciResourceSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips scheduled sync jobs when the OCI_SYNC feature flag is disabled", async () => {
    const job = {
      id: "job-123",
      data: {} satisfies OciSyncJobData,
      updateProgress: vi.fn(),
    };

    mockFeatureFlagRepository.isFeatureEnabled.mockResolvedValue(false);

    await handleOciResourceSync(job as never);

    expect(mockFeatureFlagRepository.isFeatureEnabled).toHaveBeenCalledWith(
      "OCI_SYNC",
    );
    expect(mockSyncUseCase.execute).not.toHaveBeenCalled();
    expect(job.updateProgress).toHaveBeenCalledWith(100);
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Skipping OCI cloud resource sync because feature is disabled",
      { jobId: "job-123" },
    );
  });
});
