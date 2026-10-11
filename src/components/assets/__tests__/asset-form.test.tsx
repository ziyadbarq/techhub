/**
 * AssetForm Component - Unit Tests
 *
 * Tests for the AssetForm component including:
 * - Form rendering in create and edit modes
 * - Form field visibility and values
 * - Form submission success and error handling
 * - Form validation
 * - Loading states
 * - Dialog open/close behavior
 *
 * @vitest-environment jsdom
 */

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import { toast } from "sonner";

// Mock server-only module to prevent import errors
vi.mock("server-only", () => ({}));

// Mock server actions
vi.mock("@/interface-adapters/controllers/asset.controller", () => ({
  createAssetAction: vi.fn(),
  updateAssetAction: vi.fn(),
  getAssetFilterOptionsAction: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: {
        categories: [],
        lifecycleStates: [],
        stockLocations: [],
        vendors: [],
        owningCompanies: [
          { value: "org-barq", label: "Barq" },
          { value: "org-aoun", label: "Aoun" },
        ],
      },
    }),
  ),
}));

vi.mock("@/interface-adapters/controllers/asset-category.controller", () => ({
  listAssetCategoriesAction: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: [
        { id: "cat-1", name: "Laptop", code: "LAP" },
        { id: "cat-2", name: "Desktop", code: "DSK" },
      ],
    }),
  ),
}));

vi.mock("@/interface-adapters/controllers/asset-model.controller", () => ({
  listAssetModelsAction: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: [
        { id: "model-1", name: "Dell XPS 15", code: "XPS15" },
        { id: "model-2", name: "MacBook Pro", code: "MBP" },
      ],
    }),
  ),
}));

vi.mock("@/interface-adapters/controllers/vendor.controller", () => ({
  listVendorsAction: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: [
        { id: "vendor-1", name: "Dell Technologies", code: "DELL" },
        { id: "vendor-2", name: "Apple Inc", code: "AAPL" },
      ],
    }),
  ),
}));

vi.mock("@/interface-adapters/controllers/stock-location.controller", () => ({
  listStockLocationsAction: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: [
        { id: "loc-1", name: "HQ Warehouse", code: "HQ-WH" },
        { id: "loc-2", name: "Branch Office", code: "BR-01" },
      ],
    }),
  ),
}));

vi.mock("@/interface-adapters/controllers/lifecycle-state.controller", () => ({
  listLifecycleStatesAction: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: [
        { id: "state-1", name: "Active", code: "ACT" },
        { id: "state-2", name: "Retired", code: "RET" },
      ],
    }),
  ),
}));

// Mock custom fields hook
vi.mock("@/hooks/use-category-fields", () => ({
  useCategoryFields: () => ({
    fields: [],
    isLoading: false,
  }),
}));

vi.mock("@/components/auth/PermissionGuard", () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks
import { AssetForm } from "../asset-form";
import {
  createAssetAction,
  updateAssetAction,
} from "@/interface-adapters/controllers/asset.controller";

// Sample asset data for editing
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
  note: "Test note",
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

describe("AssetForm", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render dialog when open is true", async () => {
      render(
        <AssetForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("should not render dialog when open is false", () => {
      render(
        <AssetForm
          open={false}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />,
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should show 'Create Asset' title in create mode", async () => {
      render(
        <AssetForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText(/Create Asset:/)).toBeInTheDocument();
      });
    });

    it("should show 'Edit Asset' title in edit mode", async () => {
      const asset = createMockAsset();

      render(
        <AssetForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          asset={asset}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText(/Edit Asset:/)).toBeInTheDocument();
      });
    });
  });

  describe("form fields", () => {
    it("should render all required form fields", async () => {
      const user = userEvent.setup();
      render(
        <AssetForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Asset Category")).toBeInTheDocument();
      });

      // Expand remaining sections to assert nested fields
      await user.click(
        screen.getByRole("button", { name: /Location & Status/i }),
      );
      await user.click(screen.getByRole("button", { name: /Procurement/i }));
      await user.click(
        screen.getByRole("button", { name: /Additional Details/i }),
      );

      expect(screen.getByText("Device Model")).toBeInTheDocument();
      expect(screen.getByText("Supplier / Manufacturer")).toBeInTheDocument();
      expect(screen.getByText("Stock Location")).toBeInTheDocument();
      expect(screen.getByText("Lifecycle State")).toBeInTheDocument();
      expect(screen.getByText("Serial Number")).toBeInTheDocument();
      expect(screen.getByText("Condition")).toBeInTheDocument();
      expect(screen.getByText("Purchase Date")).toBeInTheDocument();
      expect(screen.getByText("Purchase Cost")).toBeInTheDocument();
      expect(screen.getByText("Currency")).toBeInTheDocument();
      expect(screen.getByText("Note")).toBeInTheDocument();
    });

    it("should populate fields with asset data in edit mode", async () => {
      const user = userEvent.setup();
      const asset = createMockAsset({
        serialNumber: "TEST-SERIAL-123",
        note: "Test note for asset",
      });

      render(
        <AssetForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          asset={asset}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole("button", { name: /Additional Details/i }),
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("TEST-SERIAL-123")).toBeInTheDocument();
        expect(
          screen.getByDisplayValue("Test note for asset"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("form submission - create mode", () => {
    it("should call createAssetAction on successful form submission", async () => {
      const user = userEvent.setup();
      (createAssetAction as Mock).mockResolvedValue({ success: true });

      render(
        <AssetForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />,
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Select a category (required field)
      // Get the first combobox which is the category selector
      const comboboxes = screen.getAllByRole("combobox");
      await user.click(comboboxes[0]);

      await waitFor(() => {
        expect(screen.getByText("Laptop (LAP)")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Laptop (LAP)"));

      // Submit the form
      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(createAssetAction).toHaveBeenCalled();
      });
    });

    it("should show success toast and call onSuccess after successful creation", async () => {
      const user = userEvent.setup();
      (createAssetAction as Mock).mockResolvedValue({ success: true });

      render(
        <AssetForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Select a category
      // Get the first combobox which is the category selector
      const comboboxes = screen.getAllByRole("combobox");
      await user.click(comboboxes[0]);

      await waitFor(() => {
        expect(screen.getByText("Laptop (LAP)")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Laptop (LAP)"));

      // Submit
      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Asset created!");
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("should show error toast when creation fails", async () => {
      const user = userEvent.setup();
      (createAssetAction as Mock).mockResolvedValue({
        success: false,
        error: "Asset tag already exists",
      });

      render(
        <AssetForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Select a category
      // Get the first combobox which is the category selector
      const comboboxes = screen.getAllByRole("combobox");
      await user.click(comboboxes[0]);

      await waitFor(() => {
        expect(screen.getByText("Laptop (LAP)")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Laptop (LAP)"));

      // Submit
      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Asset tag already exists");
        expect(mockOnSuccess).not.toHaveBeenCalled();
      });
    });
  });

  describe("form submission - edit mode", () => {
    it("should call updateAssetAction on successful edit submission", async () => {
      const user = userEvent.setup();
      const asset = createMockAsset();
      (updateAssetAction as Mock).mockResolvedValue({ success: true });

      render(
        <AssetForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          asset={asset}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Submit the form
      const submitButton = screen.getByRole("button", { name: /update/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(updateAssetAction).toHaveBeenCalledWith(
          asset.assetTag,
          expect.any(Object),
        );
      });
    });

    it("should show success toast and call onSuccess after successful update", async () => {
      const user = userEvent.setup();
      const asset = createMockAsset();
      (updateAssetAction as Mock).mockResolvedValue({ success: true });

      render(
        <AssetForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          asset={asset}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const submitButton = screen.getByRole("button", { name: /update/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Asset updated!");
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("cancel button", () => {
    it("should call onOpenChange(false) when cancel is clicked", async () => {
      const user = userEvent.setup();

      render(
        <AssetForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("loading state", () => {
    it("should show 'Creating...' text while submitting in create mode", async () => {
      const user = userEvent.setup();
      let resolveCreate: (value: { success: boolean }) => void;
      const createPromise = new Promise<{ success: boolean }>((resolve) => {
        resolveCreate = resolve;
      });
      (createAssetAction as Mock).mockReturnValue(createPromise);

      render(
        <AssetForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Select a category
      // Get the first combobox which is the category selector
      const comboboxes = screen.getAllByRole("combobox");
      await user.click(comboboxes[0]);

      await waitFor(() => {
        expect(screen.getByText("Laptop (LAP)")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Laptop (LAP)"));

      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Creating...")).toBeInTheDocument();
      });

      // Cleanup
      resolveCreate!({ success: true });
    });

    it("should show 'Updating...' text while submitting in edit mode", async () => {
      const user = userEvent.setup();
      const asset = createMockAsset();
      let resolveUpdate: (value: { success: boolean }) => void;
      const updatePromise = new Promise<{ success: boolean }>((resolve) => {
        resolveUpdate = resolve;
      });
      (updateAssetAction as Mock).mockReturnValue(updatePromise);

      render(
        <AssetForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          asset={asset}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const submitButton = screen.getByRole("button", { name: /update/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Updating...")).toBeInTheDocument();
      });

      // Cleanup
      resolveUpdate!({ success: true });
    });
  });

  describe("error handling", () => {
    it("should show error toast when exception is thrown during creation", async () => {
      const user = userEvent.setup();
      (createAssetAction as Mock).mockRejectedValue(new Error("Network error"));

      render(
        <AssetForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Select a category
      // Get the first combobox which is the category selector
      const comboboxes = screen.getAllByRole("combobox");
      await user.click(comboboxes[0]);

      await waitFor(() => {
        expect(screen.getByText("Laptop (LAP)")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Laptop (LAP)"));

      const submitButton = screen.getByRole("button", { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to create asset");
      });
    });

    it("should show error toast when exception is thrown during update", async () => {
      const user = userEvent.setup();
      const asset = createMockAsset();
      (updateAssetAction as Mock).mockRejectedValue(new Error("Network error"));

      render(
        <AssetForm
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          asset={asset}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const submitButton = screen.getByRole("button", { name: /update/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to update asset");
      });
    });
  });
});
