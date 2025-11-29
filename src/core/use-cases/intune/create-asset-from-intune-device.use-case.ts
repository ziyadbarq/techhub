/**
 * Create Asset From Intune Device Use Case
 *
 * Creates an ITAM Asset from an Intune device's data.
 * Auto-creates Vendor and AssetModel as needed.
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IIntuneDeviceRepository } from "@/core/repositories/intune-device.repository.interface";
import type { IVendorRepository } from "@/core/repositories/vendor.repository.interface";
import type { IAssetModelRepository } from "@/core/repositories/asset-model.repository.interface";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";
import { Vendor } from "@/core/domain/entities/vendor.entity";
import { AssetModel } from "@/core/domain/entities/asset-model.entity";
import { Asset } from "@/core/domain/entities/asset.entity";
import type { IntuneDevice } from "@/core/domain/entities/intune-device.entity";
import { VendorType } from "@/core/domain/value-objects/foundation-enums";

export interface CreateAssetFromIntuneDeviceInput {
  /** ID of the Intune device to create an asset from */
  deviceId: string;
  /** Asset category ID (required) */
  categoryId: string;
  /** Optional stock location ID */
  stockLocationId?: string;
  /** Optional lifecycle state ID */
  lifecycleStateId?: string;
  /** Whether to auto-create vendor from manufacturer (default: true) */
  autoCreateVendor?: boolean;
  /** Whether to auto-create asset model from model (default: true) */
  autoCreateModel?: boolean;
  /** Whether to auto-link the created asset to the device (default: true) */
  autoLinkToDevice?: boolean;
}

export interface CreateAssetFromIntuneDeviceOutput {
  asset: Asset;
  device: IntuneDevice;
  vendorCreated: boolean;
  modelCreated: boolean;
}

@injectable()
export class CreateAssetFromIntuneDeviceUseCase {
  private readonly logger: ILoggerService;

  constructor(
    @inject(DI_TOKENS.ILoggerService) logger: ILoggerService,
    @inject(DI_TOKENS.IIntuneDeviceRepository)
    private readonly deviceRepository: IIntuneDeviceRepository,
    @inject(DI_TOKENS.IVendorRepository)
    private readonly vendorRepository: IVendorRepository,
    @inject(DI_TOKENS.IAssetModelRepository)
    private readonly assetModelRepository: IAssetModelRepository,
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
    @inject(DI_TOKENS.ICodeGeneratorService)
    private readonly codeGenerator: ICodeGeneratorService,
  ) {
    this.logger = logger.child({
      useCase: "CreateAssetFromIntuneDeviceUseCase",
    });
  }

  async execute(
    input: CreateAssetFromIntuneDeviceInput,
  ): Promise<CreateAssetFromIntuneDeviceOutput> {
    const {
      deviceId,
      categoryId,
      stockLocationId,
      lifecycleStateId,
      autoCreateVendor = true,
      autoCreateModel = true,
      autoLinkToDevice = true,
    } = input;

    this.logger.debug("Creating asset from Intune device", {
      deviceId,
      categoryId,
      autoCreateVendor,
      autoCreateModel,
    });

    // 1. Get the Intune device
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) {
      throw new Error("Intune device not found");
    }

    // 2. Validate serial number exists (required for unique asset tracking)
    if (!device.serialNumber || device.serialNumber === "0") {
      throw new Error(
        "Cannot create asset: device has no valid serial number. " +
          "Assets require a unique serial number for tracking.",
      );
    }

    // 3. Check if an asset with this serial number already exists
    const existingAsset = await this.assetRepository.findBySerialNumber(
      device.serialNumber,
    );
    if (existingAsset) {
      throw new Error(
        `An asset with serial number "${device.serialNumber}" already exists (${existingAsset.assetTag})`,
      );
    }

    let vendorId: string | null = null;
    let vendorCreated = false;

    // 4. Find or create vendor from manufacturer
    if (device.manufacturer && autoCreateVendor) {
      let vendor = await this.vendorRepository.findByName(device.manufacturer);

      if (!vendor) {
        // Use CodeGeneratorService for consistent sequential codes (matching CreateVendorUseCase)
        const vendorCode = await this.codeGenerator.generateCode(
          "VENDOR",
          "VENDOR",
        );

        vendor = Vendor.create({
          name: device.manufacturer,
          code: vendorCode,
          vendorType: VendorType.MANUFACTURER,
          description: `Auto-created from Intune device: ${device.deviceName}`,
          isPreferred: false,
        });

        vendor = await this.vendorRepository.create(vendor);
        vendorCreated = true;

        this.logger.info("Created vendor from Intune manufacturer", {
          vendorId: vendor.id,
          name: device.manufacturer,
        });
      }

      vendorId = vendor.id;
    }

    let assetModelId: string | null = null;
    let modelCreated = false;

    // 5. Find or create asset model
    if (device.model && vendorId && autoCreateModel) {
      // Search for existing model
      const searchResults = await this.assetModelRepository.search(
        device.model,
        {
          assetCategoryId: categoryId,
          vendorId: vendorId,
          take: 1,
        },
      );

      if (searchResults.length > 0) {
        assetModelId = searchResults[0].id;
      } else {
        // Use CodeGeneratorService for consistent sequential codes (matching CreateAssetModelUseCase)
        const modelCode = await this.codeGenerator.generateCode(
          "ASSET_MODEL",
          "MODEL",
        );

        const assetModel = AssetModel.create({
          assetCategoryId: categoryId,
          vendorId: vendorId,
          name: device.model,
          code: modelCode,
          description: `Auto-created from Intune device: ${device.deviceName}`,
        });

        const createdModel = await this.assetModelRepository.create(assetModel);
        assetModelId = createdModel.id;
        modelCreated = true;

        this.logger.info("Created asset model from Intune model", {
          modelId: createdModel.id,
          name: device.model,
        });
      }
    }

    // 6. Generate asset tag
    const assetTag = await this.codeGenerator.generateCode("ASSET", "ASSET");

    // 7. Create the asset
    const asset = Asset.create({
      assetTag,
      assetCategoryId: categoryId,
      assetModelId,
      vendorId,
      lifecycleStateId: lifecycleStateId ?? null,
      serialNumber: device.serialNumber,
      purchaseDate: device.enrolledDateTime,
      currentStockLocationId: stockLocationId ?? null,
      note: `Created from Intune device: ${device.deviceName}`,
      attributes: {
        intuneDeviceId: device.intuneDeviceId,
        intuneDeviceName: device.deviceName,
        intuneOperatingSystem: device.operatingSystem,
        intuneOsVersion: device.osVersion,
        intuneOwnershipType: device.ownershipType,
        intuneComplianceState: device.complianceState,
      },
    });

    const createdAsset = await this.assetRepository.create(asset);

    this.logger.info("Created asset from Intune device", {
      assetId: createdAsset.id,
      assetTag: createdAsset.assetTag,
      serialNumber: device.serialNumber,
      deviceId: device.id,
    });

    // 8. Link the asset to the device if requested
    let updatedDevice = device;
    if (autoLinkToDevice) {
      device.linkToAsset(createdAsset.id, "auto_serial");
      updatedDevice = await this.deviceRepository.update(device);

      this.logger.debug("Linked asset to Intune device", {
        assetId: createdAsset.id,
        deviceId: device.id,
      });
    }

    return {
      asset: createdAsset,
      device: updatedDevice,
      vendorCreated,
      modelCreated,
    };
  }
}
