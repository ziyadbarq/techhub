import { beforeEach, describe, expect, it, vi } from "vitest";
import { SyncDevicesFromIntuneUseCase } from "../sync-devices-from-intune.use-case";
import { IntuneDevice } from "@/core/domain/entities/intune-device.entity";
import type { IntuneComplianceHistory } from "@/core/domain/entities/intune-compliance-history.entity";
import type { IIntuneDeviceRepository } from "@/core/repositories/intune-device.repository.interface";
import type { IIntuneComplianceHistoryRepository } from "@/core/repositories/intune-device.repository.interface";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { IMicrosoftGraphService } from "@/core/services/microsoft-graph.service.interface";
import type {
  IIntuneDeviceMapperService,
  IntuneDeviceSyncInput,
} from "@/core/services/intune-device-mapper.service.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";

class MockLoggerService implements Partial<ILoggerService> {
  debug = vi.fn();
  info = vi.fn();
  warn = vi.fn();
  error = vi.fn();
  startTimer = vi.fn().mockReturnValue({
    startTime: Date.now(),
    operation: "test",
  });
  endTimer = vi.fn();
  audit = vi.fn();
  child(): ILoggerService {
    return this as ILoggerService;
  }
  async withTiming<T>(_operation: string, fn: () => Promise<T>): Promise<T> {
    return await fn();
  }
}

class MockIntuneDeviceRepository implements Partial<IIntuneDeviceRepository> {
  public createdDevice: IntuneDevice | null = null;
  private failedAssetLinkOnce = false;

  constructor(
    private readonly staleDevice: IntuneDevice,
    private readonly assetId: string,
  ) {}

  async findByIntuneDeviceId(
    intuneDeviceId: string,
  ): Promise<IntuneDevice | null> {
    if (this.staleDevice.intuneDeviceId === intuneDeviceId) {
      return this.staleDevice;
    }
    if (this.createdDevice?.intuneDeviceId === intuneDeviceId) {
      return this.createdDevice;
    }
    return null;
  }

  async findByAzureAdDeviceId(
    _azureAdDeviceId: string,
  ): Promise<IntuneDevice | null> {
    return null;
  }

  async findByLinkedAsset(assetId: string): Promise<IntuneDevice | null> {
    if (this.staleDevice.linkedAssetId === assetId) {
      return this.staleDevice;
    }
    if (this.createdDevice?.linkedAssetId === assetId) {
      return this.createdDevice;
    }
    return null;
  }

  async create(device: IntuneDevice): Promise<IntuneDevice> {
    this.createdDevice = device;
    return device;
  }

  async update(device: IntuneDevice): Promise<IntuneDevice> {
    if (
      this.createdDevice &&
      device.id === this.createdDevice.id &&
      device.linkedAssetId === this.assetId &&
      device.linkedPersonId === null &&
      !this.failedAssetLinkOnce
    ) {
      this.failedAssetLinkOnce = true;
      throw new Error("Simulated asset link failure");
    }

    return device;
  }

  async deactivateNotIn(): Promise<number> {
    return 0;
  }
}

class MockComplianceHistoryRepository implements Partial<IIntuneComplianceHistoryRepository> {
  async create(
    history: IntuneComplianceHistory,
  ): Promise<IntuneComplianceHistory> {
    return history;
  }
}

class MockAssetRepository implements Partial<IAssetRepository> {
  constructor(
    private readonly asset: {
      id: string;
      assetTag: string;
    },
  ) {}

  async findBySerialNumber(serialNumber: string) {
    return serialNumber === "SERIAL-001"
      ? (this.asset as Awaited<
          ReturnType<IAssetRepository["findBySerialNumber"]>
        >)
      : null;
  }
}

class MockPersonRepository implements Partial<IPersonRepository> {
  async findByAzureAdId(azureAdId: string) {
    return azureAdId === "person-azure-id"
      ? ({ id: "person-1" } as Awaited<
          ReturnType<IPersonRepository["findByAzureAdId"]>
        >)
      : null;
  }
}

class MockGraphService implements Partial<IMicrosoftGraphService> {
  async fetchAllManagedDevices() {
    return [
      { id: "graph-device-1", deviceName: "Fresh Intune Device" },
    ] as never;
  }
}

class MockIntuneDeviceMapper implements Partial<IIntuneDeviceMapperService> {
  transformGraphDeviceToSyncInput(): IntuneDeviceSyncInput {
    return {
      intuneDeviceId: "intune-new-1",
      azureAdDeviceId: "azure-new-1",
      deviceName: "Fresh Intune Device",
      serialNumber: "SERIAL-001",
      manufacturer: "Dell",
      model: "Latitude",
      operatingSystem: "Windows",
      osVersion: "11",
      imei: null,
      wiFiMacAddress: null,
      ethernetMacAddress: null,
      intuneUserId: "person-azure-id",
      userPrincipalName: "user@example.com",
      userDisplayName: "Example User",
      ownershipType: "CORPORATE" as const,
      complianceState: "COMPLIANT" as const,
      managementState: "MANAGED" as const,
      isEncrypted: true,
      isSupervised: false,
      isJailBroken: false,
      enrolledDateTime: new Date("2026-03-20T10:00:00Z"),
      lastSyncDateTime: new Date("2026-03-27T10:00:00Z"),
    };
  }
}

describe("SyncDevicesFromIntuneUseCase", () => {
  let useCase: SyncDevicesFromIntuneUseCase;
  let deviceRepository: MockIntuneDeviceRepository;
  let staleDevice: IntuneDevice;

  beforeEach(() => {
    let idCounter = 0;
    const idGenerator: IIdGenerator = {
      generateId: () => `generated-intune-device-id-${idCounter++}`,
    };

    staleDevice = IntuneDevice.create(
      {
        intuneDeviceId: "intune-stale-1",
        azureAdDeviceId: "azure-stale-1",
        deviceName: "Old Intune Device",
        serialNumber: "SERIAL-001",
        ownershipType: "CORPORATE",
        complianceState: "COMPLIANT",
        managementState: "MANAGED",
        lastSyncDateTime: new Date("2025-01-01T00:00:00Z"),
      },
      idGenerator,
    );
    staleDevice.linkToAsset("asset-1", "auto_serial");

    deviceRepository = new MockIntuneDeviceRepository(staleDevice, "asset-1");

    useCase = new SyncDevicesFromIntuneUseCase(
      new MockLoggerService() as ILoggerService,
      deviceRepository as unknown as IIntuneDeviceRepository,
      new MockComplianceHistoryRepository() as unknown as IIntuneComplianceHistoryRepository,
      new MockAssetRepository({
        id: "asset-1",
        assetTag: "AST-001",
      }) as unknown as IAssetRepository,
      new MockPersonRepository() as unknown as IPersonRepository,
      new MockGraphService() as unknown as IMicrosoftGraphService,
      new MockIntuneDeviceMapper() as IIntuneDeviceMapperService,
      idGenerator,
    );
  });

  it("reverts the new device's in-memory asset link when relinking fails", async () => {
    const result = await useCase.execute();

    expect(result.errors).toEqual([]);
    expect(result.linkedToAssets).toBe(0);
    expect(result.linkedToPersons).toBe(1);
    expect(staleDevice.linkedAssetId).toBe("asset-1");
    expect(deviceRepository.createdDevice).not.toBeNull();
    expect(deviceRepository.createdDevice?.linkedAssetId).toBeNull();
    expect(deviceRepository.createdDevice?.linkedPersonId).toBe("person-1");
  });
});
