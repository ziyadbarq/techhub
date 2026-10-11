/**
 * AssetsTable Component - Unit Tests
 *
 * Tests for the AssetsTable component including:
 * - Rendering assets in the table
 * - Delete button visibility based on permissions
 * - Delete confirmation dialog
 * - Delete action execution
 * - Error handling for delete failures
 * - Success feedback after deletion
 *
 * @vitest-environment jsdom
 */

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssetsTable } from "../assets-table";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";
import { toast } from "sonner";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

// Mock the server actions
vi.mock("@/interface-adapters/controllers/asset.controller", () => ({
  deleteAssetAction: vi.fn(),
}));

vi.mock("@/interface-adapters/controllers/exchange-rate.controller", () => ({
  listExchangeRatesAction: vi.fn(() =>
    Promise.resolve({ success: true, data: [] }),
  ),
}));

// Mock the permissions hook
const mockHasPermission = vi.fn();
vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission,
    permissions: [],
    isLoading: false,
  }),
}));

// Mock the custom field columns hook
vi.mock("../custom-field-columns", () => ({
  useCustomFieldColumns: () => ({
    columns: [],
    isLoading: false,
  }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock next/navigation router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Import after mocks
import { deleteAssetAction } from "@/interface-adapters/controllers/asset.controller";

// Sample asset data
const createMockAsset = (overrides?: Partial<AssetDTO>): AssetDTO => ({
  id: "asset-1",
  assetTag: "LAPTOP-001",
  assetCategoryId: "cat-laptop",
  assetModelId: "model-dell",
  vendorId: "vendor-dell",
  contractId: null,
  lifecycleStateId: "state-active",
  serialNumber: "SN-12345",
  purchaseDate: "2024-01-15T00:00:00.000Z",
  purchaseCost: 1500,
  purchaseCostSar: 5625,
  currency: "USD",
  depreciationModel: null,
  depreciationStart: null,
  depreciationEnd: null,
  condition: "NEW",
  currentStockLocationId: "stock-hq",
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

describe("AssetsTable", () => {
  const mockOnEdit = vi.fn();
  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: user has all permissions
    mockHasPermission.mockImplementation((permission: string) => {
      return (
        permission === PERMISSIONS.ASSETS_UPDATE ||
        permission === PERMISSIONS.ASSETS_DELETE
      );
    });
  });

  describe("rendering", () => {
    it("should render assets in the table", async () => {
      const assets = [
        createMockAsset({ assetTag: "LAPTOP-001", id: "1" }),
        createMockAsset({ assetTag: "LAPTOP-002", id: "2" }),
      ];

      render(
        <AssetsTable
          data={assets}
          onEdit={mockOnEdit}
          onRefresh={mockOnRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("LAPTOP-001")).toBeInTheDocument();
        expect(screen.getByText("LAPTOP-002")).toBeInTheDocument();
      });
    });

    it("should display asset category names", async () => {
      const assets = [createMockAsset({ categoryName: "Desktop Computer" })];

      render(
        <AssetsTable
          data={assets}
          onEdit={mockOnEdit}
          onRefresh={mockOnRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Desktop Computer")).toBeInTheDocument();
      });
    });
  });

  describe("delete button visibility", () => {
    it("should show delete option in dropdown when user has delete permission", async () => {
      const user = userEvent.setup();
      const assets = [createMockAsset()];

      render(
        <AssetsTable
          data={assets}
          onEdit={mockOnEdit}
          onRefresh={mockOnRefresh}
        />,
      );

      // Find and click the actions menu button
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);

      // Check that Delete option is visible
      await waitFor(() => {
        expect(screen.getByText("Delete")).toBeInTheDocument();
      });
    });

    it("should NOT show delete option when user lacks delete permission", async () => {
      const user = userEvent.setup();
      mockHasPermission.mockImplementation((permission: string) => {
        return permission === PERMISSIONS.ASSETS_UPDATE; // Only update, not delete
      });

      const assets = [createMockAsset()];

      render(
        <AssetsTable
          data={assets}
          onEdit={mockOnEdit}
          onRefresh={mockOnRefresh}
        />,
      );

      // Find and click the actions menu button
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);

      // Check that Delete option is NOT visible
      await waitFor(() => {
        expect(screen.queryByText("Delete")).not.toBeInTheDocument();
      });
    });

    it("should not render actions menu when user has no permissions", async () => {
      mockHasPermission.mockReturnValue(false);

      const assets = [createMockAsset()];

      render(
        <AssetsTable
          data={assets}
          onEdit={mockOnEdit}
          onRefresh={mockOnRefresh}
        />,
      );

      // Actions menu button should not be present
      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: /open menu/i }),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("delete confirmation dialog", () => {
    it("should open confirmation dialog when delete is clicked", async () => {
      const user = userEvent.setup();
      const assets = [createMockAsset({ assetTag: "LAPTOP-TEST" })];

      render(
        <AssetsTable
          data={assets}
          onEdit={mockOnEdit}
          onRefresh={mockOnRefresh}
        />,
      );

      // Open menu and click delete
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);

      const deleteButton = screen.getByText("Delete");
      await user.click(deleteButton);

      // Confirmation dialog should be visible
      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
        expect(screen.getByText("Delete Asset?")).toBeInTheDocument();
        expect(
          screen.getByText(/hide the asset from active lists/),
        ).toBeInTheDocument();
      });
    });

    it("should close dialog when cancel is clicked", async () => {
      const user = userEvent.setup();
      const assets = [createMockAsset()];

      render(
        <AssetsTable
          data={assets}
          onEdit={mockOnEdit}
          onRefresh={mockOnRefresh}
        />,
      );

      // Open menu and click delete
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);
      await user.click(screen.getByText("Delete"));

      // Click cancel
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      // Dialog should be closed
      await waitFor(() => {
        expect(screen.queryByText("Delete Asset?")).not.toBeInTheDocument();
      });
    });
  });

  describe("delete action execution", () => {
    it("should call deleteAssetAction when delete is confirmed", async () => {
      const user = userEvent.setup();
      (deleteAssetAction as Mock).mockResolvedValue({ success: true });

      const assets = [createMockAsset({ assetTag: "LAPTOP-DELETE-ME" })];

      render(
        <AssetsTable
          data={assets}
          onEdit={mockOnEdit}
          onRefresh={mockOnRefresh}
        />,
      );

      // Open menu and click delete
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);
      await user.click(screen.getByText("Delete"));

      // Confirm deletion
      const confirmButton = screen.getByRole("button", { name: /^delete$/i });
      await user.click(confirmButton);

      // Verify deleteAssetAction was called with correct asset tag
      await waitFor(() => {
        expect(deleteAssetAction).toHaveBeenCalledWith("LAPTOP-DELETE-ME");
      });
    });

    it("should call onRefresh after successful deletion", async () => {
      const user = userEvent.setup();
      (deleteAssetAction as Mock).mockResolvedValue({ success: true });

      const assets = [createMockAsset()];

      render(
        <AssetsTable
          data={assets}
          onEdit={mockOnEdit}
          onRefresh={mockOnRefresh}
        />,
      );

      // Open menu, click delete, confirm
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);
      await user.click(screen.getByText("Delete"));
      await user.click(screen.getByRole("button", { name: /^delete$/i }));

      // Verify onRefresh was called
      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalled();
      });
    });

    it("should show success toast after successful deletion", async () => {
      const user = userEvent.setup();
      (deleteAssetAction as Mock).mockResolvedValue({ success: true });

      const assets = [createMockAsset()];

      render(
        <AssetsTable
          data={assets}
          onEdit={mockOnEdit}
          onRefresh={mockOnRefresh}
        />,
      );

      // Open menu, click delete, confirm
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);
      await user.click(screen.getByText("Delete"));
      await user.click(screen.getByRole("button", { name: /^delete$/i }));

      // Verify success toast
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Asset deleted successfully",
        );
      });
    });
  });

  describe("error handling", () => {
    it("should show error toast when deletion fails", async () => {
      const user = userEvent.setup();
      (deleteAssetAction as Mock).mockResolvedValue({
        success: false,
        error: "Deletion failed",
      });

      const assets = [createMockAsset()];

      render(
        <AssetsTable
          data={assets}
          onEdit={mockOnEdit}
          onRefresh={mockOnRefresh}
        />,
      );

      // Open menu, click delete, confirm
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);
      await user.click(screen.getByText("Delete"));
      await user.click(screen.getByRole("button", { name: /^delete$/i }));

      // Verify error toast with specific message
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Deletion failed");
      });
    });

    it("should show a 'View Asset' action and navigate there when blocked by an active assignment", async () => {
      const user = userEvent.setup();
      (deleteAssetAction as Mock).mockResolvedValue({
        success: false,
        error: 'Cannot delete asset "LAPTOP-001". 1 active assignment(s).',
      });

      const assets = [createMockAsset()];

      render(
        <AssetsTable
          data={assets}
          onEdit={mockOnEdit}
          onRefresh={mockOnRefresh}
        />,
      );

      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);
      await user.click(screen.getByText("Delete"));
      await user.click(screen.getByRole("button", { name: /^delete$/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Cannot delete asset "LAPTOP-001". 1 active assignment(s).',
          expect.objectContaining({
            action: expect.objectContaining({ label: "View Asset" }),
          }),
        );
      });

      const [, options] = (toast.error as Mock).mock.calls[0];
      options.action.onClick();

      expect(mockPush).toHaveBeenCalledWith("/assets/LAPTOP-001");
    });

    it("should NOT call onRefresh when deletion fails", async () => {
      const user = userEvent.setup();
      (deleteAssetAction as Mock).mockResolvedValue({
        success: false,
        error: "Deletion failed",
      });

      const assets = [createMockAsset()];

      render(
        <AssetsTable
          data={assets}
          onEdit={mockOnEdit}
          onRefresh={mockOnRefresh}
        />,
      );

      // Open menu, click delete, confirm
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);
      await user.click(screen.getByText("Delete"));
      await user.click(screen.getByRole("button", { name: /^delete$/i }));

      // Wait for the action to complete
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      // onRefresh should NOT have been called
      expect(mockOnRefresh).not.toHaveBeenCalled();
    });

    it("should show generic error toast when exception is thrown", async () => {
      const user = userEvent.setup();
      (deleteAssetAction as Mock).mockRejectedValue(new Error("Network error"));

      const assets = [createMockAsset()];

      render(
        <AssetsTable
          data={assets}
          onEdit={mockOnEdit}
          onRefresh={mockOnRefresh}
        />,
      );

      // Open menu, click delete, confirm
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);
      await user.click(screen.getByText("Delete"));
      await user.click(screen.getByRole("button", { name: /^delete$/i }));

      // Verify generic error toast
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to delete asset");
      });
    });
  });

  // Note: Tests for "Deleting..." loading state and disabled cancel button
  // are not applicable because AlertDialogAction from Radix UI closes the
  // dialog immediately on click, before the async deletion completes.
  // The isDeleting state and loading UI are not visible to users.

  describe("edit button", () => {
    it("should call onEdit when edit button is clicked", async () => {
      const user = userEvent.setup();
      const asset = createMockAsset({ assetTag: "EDIT-TEST" });

      render(
        <AssetsTable
          data={[asset]}
          onEdit={mockOnEdit}
          onRefresh={mockOnRefresh}
        />,
      );

      // Open menu and click edit
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);

      const editButton = screen.getByText("Edit");
      await user.click(editButton);

      // Verify onEdit was called with the asset
      expect(mockOnEdit).toHaveBeenCalledWith(asset);
    });

    it("should NOT show edit option when user lacks update permission", async () => {
      const user = userEvent.setup();
      mockHasPermission.mockImplementation((permission: string) => {
        return permission === PERMISSIONS.ASSETS_DELETE; // Only delete, not update
      });

      const assets = [createMockAsset()];

      render(
        <AssetsTable
          data={assets}
          onEdit={mockOnEdit}
          onRefresh={mockOnRefresh}
        />,
      );

      // Open actions menu
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);

      // Edit should not be present
      await waitFor(() => {
        expect(screen.queryByText("Edit")).not.toBeInTheDocument();
      });
    });
  });
});
