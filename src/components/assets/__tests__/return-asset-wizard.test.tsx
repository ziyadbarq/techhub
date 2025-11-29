/**
 * ReturnAssetWizard Component - Unit Tests
 *
 * Tests for the ReturnAssetWizard component including:
 * - Dialog rendering
 * - Form field rendering and validation
 * - Stock location selection
 * - Return submission
 * - Success and error handling
 * - Dialog behavior
 *
 * @vitest-environment jsdom
 */

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

// Mock server-only module to prevent import errors
vi.mock("server-only", () => ({}));

// Mock server actions
vi.mock("@/interface-adapters/controllers/asset-workflow.controller", () => ({
  returnAssetAction: vi.fn(),
}));

vi.mock("@/interface-adapters/controllers/stock-location.controller", () => ({
  listStockLocationsAction: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: [
        {
          id: "loc-1",
          name: "HQ Warehouse",
          code: "HQ-WH",
          description: "Main warehouse",
        },
        {
          id: "loc-2",
          name: "Branch Office",
          code: "BR-01",
          description: "Branch storage",
        },
      ],
    }),
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
import { ReturnAssetWizard } from "../return-asset-wizard";
import { returnAssetAction } from "@/interface-adapters/controllers/asset-workflow.controller";

describe("ReturnAssetWizard", () => {
  const defaultProps = {
    assetId: "asset-1",
    assetTag: "LAPTOP-001",
    assignmentId: "assignment-1",
    assignedToName: "John Doe",
    open: true,
    onOpenChange: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render dialog when open is true", async () => {
      render(<ReturnAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("should not render dialog when open is false", () => {
      render(<ReturnAssetWizard {...defaultProps} open={false} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should display the dialog title", async () => {
      render(<ReturnAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText("Return Asset to Inventory"),
        ).toBeInTheDocument();
      });
    });

    it("should display the asset tag in the dialog", async () => {
      render(<ReturnAssetWizard {...defaultProps} />);

      await waitFor(() => {
        // Asset tag appears in both description and summary, check at least one exists
        const assetTags = screen.getAllByText("LAPTOP-001");
        expect(assetTags.length).toBeGreaterThan(0);
      });
    });

    it("should display current assignee name", async () => {
      render(<ReturnAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Currently Assigned To:")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });
    });

    it("should display stock location dropdown", async () => {
      render(<ReturnAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Return Location")).toBeInTheDocument();
      });
    });

    it("should display notes textarea", async () => {
      render(<ReturnAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Notes (Optional)")).toBeInTheDocument();
      });
    });

    it("should display warning message about ending assignment", async () => {
      render(<ReturnAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(/This will end the current assignment/),
        ).toBeInTheDocument();
      });
    });
  });

  describe("stock location selection", () => {
    it("should load stock locations from server", async () => {
      const user = userEvent.setup();
      render(<ReturnAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Open the stock location dropdown
      const locationCombobox = screen.getByRole("combobox");
      await user.click(locationCombobox);

      await waitFor(() => {
        expect(screen.getByText(/HQ Warehouse \(HQ-WH\)/)).toBeInTheDocument();
        expect(screen.getByText(/Branch Office \(BR-01\)/)).toBeInTheDocument();
      });
    });

    it("should update summary when location is selected", async () => {
      const user = userEvent.setup();
      render(<ReturnAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Select a location
      const locationCombobox = screen.getByRole("combobox");
      await user.click(locationCombobox);

      await waitFor(() => {
        expect(screen.getByText(/HQ Warehouse \(HQ-WH\)/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/HQ Warehouse \(HQ-WH\)/));

      // Check the summary displays the selected location
      await waitFor(() => {
        expect(screen.getByText("Return To:")).toBeInTheDocument();
      });
    });
  });

  describe("form submission", () => {
    it("should not submit without selecting a location", async () => {
      const user = userEvent.setup();
      (returnAssetAction as Mock).mockResolvedValue({ success: true });

      render(<ReturnAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Try to submit without selecting location
      const submitButton = screen.getByRole("button", {
        name: /return asset/i,
      });
      await user.click(submitButton);

      // Action should not have been called
      expect(returnAssetAction).not.toHaveBeenCalled();
    });

    it("should call returnAssetAction on successful submit", async () => {
      const user = userEvent.setup();
      (returnAssetAction as Mock).mockResolvedValue({ success: true });

      render(<ReturnAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Select a location
      const locationCombobox = screen.getByRole("combobox");
      await user.click(locationCombobox);

      await waitFor(() => {
        expect(screen.getByText(/HQ Warehouse \(HQ-WH\)/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/HQ Warehouse \(HQ-WH\)/));

      // Submit
      const submitButton = screen.getByRole("button", {
        name: /return asset/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(returnAssetAction).toHaveBeenCalledWith({
          assetId: "asset-1",
          assignmentId: "assignment-1",
          stockLocationToId: "loc-1",
          note: "",
        });
      });
    });

    it("should include notes in submission when provided", async () => {
      const user = userEvent.setup();
      (returnAssetAction as Mock).mockResolvedValue({ success: true });

      render(<ReturnAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Select a location
      const locationCombobox = screen.getByRole("combobox");
      await user.click(locationCombobox);

      await waitFor(() => {
        expect(screen.getByText(/HQ Warehouse \(HQ-WH\)/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/HQ Warehouse \(HQ-WH\)/));

      // Add notes
      const notesTextarea = screen.getByPlaceholderText(
        /Add any notes about this return/,
      );
      await user.type(notesTextarea, "Asset returned in good condition");

      // Submit
      const submitButton = screen.getByRole("button", {
        name: /return asset/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(returnAssetAction).toHaveBeenCalledWith({
          assetId: "asset-1",
          assignmentId: "assignment-1",
          stockLocationToId: "loc-1",
          note: "Asset returned in good condition",
        });
      });
    });

    it("should show success toast and call callbacks on success", async () => {
      const user = userEvent.setup();
      (returnAssetAction as Mock).mockResolvedValue({ success: true });

      render(<ReturnAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Select a location
      const locationCombobox = screen.getByRole("combobox");
      await user.click(locationCombobox);

      await waitFor(() => {
        expect(screen.getByText(/HQ Warehouse \(HQ-WH\)/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/HQ Warehouse \(HQ-WH\)/));

      // Submit
      const submitButton = screen.getByRole("button", {
        name: /return asset/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Asset returned successfully!",
        );
        expect(defaultProps.onSuccess).toHaveBeenCalled();
        expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("should show error toast when return fails", async () => {
      const user = userEvent.setup();
      (returnAssetAction as Mock).mockResolvedValue({
        success: false,
        error: "Asset is already in stock",
      });

      render(<ReturnAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Select a location
      const locationCombobox = screen.getByRole("combobox");
      await user.click(locationCombobox);

      await waitFor(() => {
        expect(screen.getByText(/HQ Warehouse \(HQ-WH\)/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/HQ Warehouse \(HQ-WH\)/));

      // Submit
      const submitButton = screen.getByRole("button", {
        name: /return asset/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Asset is already in stock");
        expect(defaultProps.onSuccess).not.toHaveBeenCalled();
      });
    });

    it("should show error toast when exception is thrown", async () => {
      const user = userEvent.setup();
      (returnAssetAction as Mock).mockRejectedValue(new Error("Network error"));

      render(<ReturnAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Select a location
      const locationCombobox = screen.getByRole("combobox");
      await user.click(locationCombobox);

      await waitFor(() => {
        expect(screen.getByText(/HQ Warehouse \(HQ-WH\)/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/HQ Warehouse \(HQ-WH\)/));

      // Submit
      const submitButton = screen.getByRole("button", {
        name: /return asset/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to return asset");
      });
    });
  });

  describe("cancel button", () => {
    it("should call onOpenChange(false) when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<ReturnAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("loading state", () => {
    it("should show 'Returning...' while submitting", async () => {
      const user = userEvent.setup();
      let resolveReturn: (value: { success: boolean }) => void;
      const returnPromise = new Promise<{ success: boolean }>((resolve) => {
        resolveReturn = resolve;
      });
      (returnAssetAction as Mock).mockReturnValue(returnPromise);

      render(<ReturnAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Select a location
      const locationCombobox = screen.getByRole("combobox");
      await user.click(locationCombobox);

      await waitFor(() => {
        expect(screen.getByText(/HQ Warehouse \(HQ-WH\)/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/HQ Warehouse \(HQ-WH\)/));

      // Submit
      const submitButton = screen.getByRole("button", {
        name: /return asset/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Returning...")).toBeInTheDocument();
      });

      // Cleanup
      resolveReturn!({ success: true });
    });

    it("should disable submit button while loading data", async () => {
      render(<ReturnAssetWizard {...defaultProps} />);

      // The submit button should be disabled while loading
      const submitButton = screen.getByRole("button", {
        name: /return asset/i,
      });
      expect(submitButton).toBeDisabled();

      // After loading, it should still be disabled until location is selected
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe("without assignee name", () => {
    it("should not show assigned to line when assignedToName is not provided", async () => {
      render(
        <ReturnAssetWizard {...defaultProps} assignedToName={undefined} />,
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      expect(
        screen.queryByText("Currently Assigned To:"),
      ).not.toBeInTheDocument();
    });
  });
});
