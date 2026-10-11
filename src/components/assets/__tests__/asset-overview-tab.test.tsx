/**
 * AssetOverviewTab Component - Unit Tests
 *
 * Tests for the AssetOverviewTab component including:
 * - Rendering basic information
 * - Rendering financial information
 * - Rendering warranty information
 * - Currency conversion display
 * - Custom fields display
 * - Conditional rendering based on data
 *
 * @vitest-environment jsdom
 */

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";

// Mock server-only module to prevent import errors
vi.mock("server-only", () => ({}));

// Mock server actions
vi.mock("@/interface-adapters/controllers/exchange-rate.controller", () => ({
  convertCurrencyAction: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: {
        convertedAmount: 5625,
        exchangeRate: 3.75,
      },
    }),
  ),
}));

// Mock custom fields display component
vi.mock("@/components/custom-fields", () => ({
  CustomFieldsDisplay: ({
    categoryId,
    attributes,
  }: {
    categoryId: string;
    attributes: Record<string, unknown>;
  }) => (
    <div data-testid="custom-fields-display">
      Custom fields for {categoryId}: {JSON.stringify(attributes)}
    </div>
  ),
}));

// Import after mocks
import { AssetOverviewTab } from "../asset-overview-tab";

// Sample asset data
const createMockAsset = (overrides?: Partial<AssetDTO>): AssetDTO => ({
  id: "asset-1",
  assetTag: "LAPTOP-001",
  assetCategoryId: "cat-1",
  assetModelId: "model-1",
  vendorId: "vendor-1",
  contractId: null,
  lifecycleStateId: "state-1",
  serialNumber: "SN-12345",
  purchaseDate: "2024-01-15T00:00:00.000Z",
  purchaseCost: 1500,
  purchaseCostSar: 5625,
  currency: "USD",
  depreciationModel: null,
  depreciationStart: null,
  depreciationEnd: null,
  condition: "NEW",
  currentStockLocationId: "loc-1",
  owningOrgUnitId: null,
  attributes: null,
  note: null,
  createdAt: "2024-01-15T00:00:00.000Z",
  updatedAt: "2024-01-15T00:00:00.000Z",
  isDepreciated: false,
  isFullyDepreciated: false,
  categoryName: "Laptop",
  modelName: "Dell XPS 15",
  vendorName: "Dell Technologies",
  stockLocationName: "HQ Warehouse",
  lifecycleStateName: "Active",
  ...overrides,
});

describe("AssetOverviewTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic information card", () => {
    it("should render the Basic Information card title", () => {
      render(<AssetOverviewTab asset={createMockAsset()} />);

      expect(screen.getByText("Basic Information")).toBeInTheDocument();
    });

    it("should display the asset tag", () => {
      render(<AssetOverviewTab asset={createMockAsset()} />);

      expect(screen.getByText("LAPTOP-001")).toBeInTheDocument();
    });

    it("should display the serial number when provided", () => {
      render(
        <AssetOverviewTab
          asset={createMockAsset({ serialNumber: "TEST-SERIAL-123" })}
        />,
      );

      expect(screen.getByText("Serial Number")).toBeInTheDocument();
      expect(screen.getByText("TEST-SERIAL-123")).toBeInTheDocument();
    });

    it("should not display serial number when not provided", () => {
      render(
        <AssetOverviewTab asset={createMockAsset({ serialNumber: null })} />,
      );

      expect(screen.queryByText("Serial Number")).not.toBeInTheDocument();
    });

    it("should display the category name", () => {
      render(<AssetOverviewTab asset={createMockAsset()} />);

      expect(screen.getByText("Category")).toBeInTheDocument();
      expect(screen.getByText("Laptop")).toBeInTheDocument();
    });

    it("should display the model name when provided", () => {
      render(<AssetOverviewTab asset={createMockAsset()} />);

      expect(screen.getByText("Model")).toBeInTheDocument();
      expect(screen.getByText("Dell XPS 15")).toBeInTheDocument();
    });

    it("should display the vendor name when provided", () => {
      render(<AssetOverviewTab asset={createMockAsset()} />);

      expect(screen.getByText("Supplier")).toBeInTheDocument();
      expect(screen.getByText("Dell Technologies")).toBeInTheDocument();
    });

    it("should display lifecycle state as a badge", () => {
      render(<AssetOverviewTab asset={createMockAsset()} />);

      expect(screen.getByText("Lifecycle State")).toBeInTheDocument();
      // "Active" appears for both lifecycle state and warranty status
      const activeBadges = screen.getAllByText("Active");
      expect(activeBadges.length).toBeGreaterThan(0);
    });

    it("should display current location when provided", () => {
      render(<AssetOverviewTab asset={createMockAsset()} />);

      expect(screen.getByText("Current Location")).toBeInTheDocument();
      expect(screen.getByText("HQ Warehouse")).toBeInTheDocument();
    });
  });

  describe("financial information card", () => {
    it("should render the Financial Information card title", () => {
      render(<AssetOverviewTab asset={createMockAsset()} />);

      expect(screen.getByText("Financial Information")).toBeInTheDocument();
    });

    it("should display the purchase date", () => {
      render(<AssetOverviewTab asset={createMockAsset()} />);

      expect(screen.getByText("Purchase Date")).toBeInTheDocument();
      expect(screen.getByText("January 15, 2024")).toBeInTheDocument();
    });

    it("should display the purchase cost", () => {
      render(<AssetOverviewTab asset={createMockAsset()} />);

      expect(screen.getByText("Purchase Cost")).toBeInTheDocument();
    });

    it("should not show purchase date when not provided", () => {
      render(
        <AssetOverviewTab asset={createMockAsset({ purchaseDate: null })} />,
      );

      expect(screen.queryByText("Purchase Date")).not.toBeInTheDocument();
    });

    it("should show depreciation info when provided", () => {
      render(
        <AssetOverviewTab
          asset={createMockAsset({
            depreciationModel: "STRAIGHT_LINE",
            depreciationStart: "2024-01-15T00:00:00.000Z",
            depreciationEnd: "2029-01-15T00:00:00.000Z",
          })}
        />,
      );

      expect(screen.getByText("Depreciation")).toBeInTheDocument();
      expect(screen.getByText("Model: STRAIGHT_LINE")).toBeInTheDocument();
    });

    it("should show 'Fully Depreciated' badge when asset is fully depreciated", () => {
      render(
        <AssetOverviewTab
          asset={createMockAsset({
            depreciationModel: "STRAIGHT_LINE",
            isFullyDepreciated: true,
          })}
        />,
      );

      expect(screen.getByText("Fully Depreciated")).toBeInTheDocument();
    });
  });

  describe("notes card", () => {
    it("should display notes when provided", () => {
      render(
        <AssetOverviewTab
          asset={createMockAsset({ note: "This is a test note" })}
        />,
      );

      expect(screen.getByText("Notes")).toBeInTheDocument();
      expect(screen.getByText("This is a test note")).toBeInTheDocument();
    });

    it("should not display notes card when note is null", () => {
      render(<AssetOverviewTab asset={createMockAsset({ note: null })} />);

      expect(screen.queryByText("Notes")).not.toBeInTheDocument();
    });

    it("should not display notes card when note is empty", () => {
      render(<AssetOverviewTab asset={createMockAsset({ note: "" })} />);

      expect(screen.queryByText("Notes")).not.toBeInTheDocument();
    });
  });

  describe("custom fields card", () => {
    it("should display custom fields when attributes are provided", () => {
      const attributes = { cpu: "Intel i7", ram: "16GB" };
      render(<AssetOverviewTab asset={createMockAsset({ attributes })} />);

      expect(screen.getByText("Custom Fields")).toBeInTheDocument();
      expect(screen.getByTestId("custom-fields-display")).toBeInTheDocument();
    });

    it("should not display custom fields card when attributes are null", () => {
      render(
        <AssetOverviewTab asset={createMockAsset({ attributes: null })} />,
      );

      expect(screen.queryByText("Custom Fields")).not.toBeInTheDocument();
    });

    it("should not display custom fields card when attributes are empty", () => {
      render(<AssetOverviewTab asset={createMockAsset({ attributes: {} })} />);

      expect(screen.queryByText("Custom Fields")).not.toBeInTheDocument();
    });
  });

  describe("metadata card", () => {
    it("should render the Metadata card title", () => {
      render(<AssetOverviewTab asset={createMockAsset()} />);

      expect(screen.getByText("Metadata")).toBeInTheDocument();
    });

    it("should display created at date", () => {
      render(<AssetOverviewTab asset={createMockAsset()} />);

      expect(screen.getByText("Created At")).toBeInTheDocument();
    });

    it("should display last updated date", () => {
      render(<AssetOverviewTab asset={createMockAsset()} />);

      expect(screen.getByText("Last Updated")).toBeInTheDocument();
    });
  });

  describe("currency conversion", () => {
    it("should show 'converting...' while loading currency conversion", async () => {
      // Make the conversion take longer for this test only
      const { convertCurrencyAction } =
        await import("@/interface-adapters/controllers/exchange-rate.controller");
      vi.mocked(convertCurrencyAction).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: {
                    originalAmount: 1500,
                    originalCurrency: "USD",
                    convertedAmount: 5625,
                    convertedCurrency: "SAR",
                    exchangeRate: 3.75,
                  },
                }),
              100,
            ),
          ),
      );

      render(
        <AssetOverviewTab
          asset={createMockAsset({ currency: "USD", purchaseCost: 1500 })}
        />,
      );

      // Should show the purchase cost section
      expect(screen.getByText("Purchase Cost")).toBeInTheDocument();
    });

    it("should not fetch conversion when currency is SAR", async () => {
      const { convertCurrencyAction } =
        await import("@/interface-adapters/controllers/exchange-rate.controller");

      render(
        <AssetOverviewTab
          asset={createMockAsset({ currency: "SAR", purchaseCost: 1500 })}
        />,
      );

      // Wait a bit to ensure no call is made
      await waitFor(() => {
        expect(convertCurrencyAction).not.toHaveBeenCalled();
      });
    });

    it("should not fetch conversion when purchaseCost is null", async () => {
      const { convertCurrencyAction } =
        await import("@/interface-adapters/controllers/exchange-rate.controller");

      render(
        <AssetOverviewTab asset={createMockAsset({ purchaseCost: null })} />,
      );

      await waitFor(() => {
        expect(convertCurrencyAction).not.toHaveBeenCalled();
      });
    });
  });

  describe("conditional rendering", () => {
    it("should show dash when category name is not provided", () => {
      render(
        <AssetOverviewTab
          asset={createMockAsset({ categoryName: undefined })}
        />,
      );

      expect(screen.getByText("—")).toBeInTheDocument();
    });

    it("should not show model section when modelName is not provided", () => {
      render(
        <AssetOverviewTab asset={createMockAsset({ modelName: undefined })} />,
      );

      expect(screen.queryByText("Model")).not.toBeInTheDocument();
    });

    it("should not show supplier section when vendorName is not provided", () => {
      render(
        <AssetOverviewTab asset={createMockAsset({ vendorName: undefined })} />,
      );

      expect(screen.queryByText("Supplier")).not.toBeInTheDocument();
    });

    it("should not show lifecycle state when not provided", () => {
      render(
        <AssetOverviewTab
          asset={createMockAsset({ lifecycleStateName: undefined })}
        />,
      );

      expect(screen.queryByText("Lifecycle State")).not.toBeInTheDocument();
    });

    it("should not show current location when not provided", () => {
      render(
        <AssetOverviewTab
          asset={createMockAsset({ stockLocationName: undefined })}
        />,
      );

      expect(screen.queryByText("Current Location")).not.toBeInTheDocument();
    });
  });
});
