/**
 * AssignAssetWizard Component - Unit Tests
 *
 * Tests for the AssignAssetWizard component including:
 * - Wizard step navigation
 * - Form field rendering and validation
 * - Employee selection
 * - Assignment submission
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
  assignAssetToEmployeeAction: vi.fn(),
}));

vi.mock("@/interface-adapters/controllers/person.controller", () => ({
  listPersonsAction: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: [
        {
          id: "person-1",
          firstName: "John",
          lastName: "Doe",
          employeeId: "EMP001",
        },
        {
          id: "person-2",
          firstName: "Jane",
          lastName: "Smith",
          employeeId: "EMP002",
        },
      ],
    }),
  ),
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
import { AssignAssetWizard } from "../assign-asset-wizard";
import { assignAssetToEmployeeAction } from "@/interface-adapters/controllers/asset-workflow.controller";

describe("AssignAssetWizard", () => {
  const defaultProps = {
    assetId: "asset-1",
    assetTag: "LAPTOP-001",
    currentStockLocationId: "loc-1",
    open: true,
    onOpenChange: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render dialog when open is true", async () => {
      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("should not render dialog when open is false", () => {
      render(<AssignAssetWizard {...defaultProps} open={false} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should display the asset tag in the dialog", async () => {
      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("LAPTOP-001")).toBeInTheDocument();
      });
    });

    it("should show step 1 initially", async () => {
      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Step 1: Select Employee")).toBeInTheDocument();
        expect(screen.getByText(/Step 1 of 2/)).toBeInTheDocument();
      });
    });

    it("should show Next button on step 1", async () => {
      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /next/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("step 1 - employee selection", () => {
    it("should display employee dropdown", async () => {
      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Employee")).toBeInTheDocument();
      });
    });

    it("should display stock location dropdown", async () => {
      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("From Stock Location")).toBeInTheDocument();
      });
    });

    it("should load employees from server", async () => {
      const user = userEvent.setup();
      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Open the employee dropdown
      const employeeCombobox = screen.getAllByRole("combobox")[0];
      await user.click(employeeCombobox);

      await waitFor(() => {
        expect(screen.getByText("John Doe (EMP001)")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith (EMP002)")).toBeInTheDocument();
      });
    });

    it("should not proceed to step 2 without selecting an employee", async () => {
      const user = userEvent.setup();
      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Try to go to next step without selecting employee
      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      // Should still be on step 1
      await waitFor(() => {
        expect(screen.getByText("Step 1: Select Employee")).toBeInTheDocument();
      });
    });

    it("should proceed to step 2 after selecting an employee", async () => {
      const user = userEvent.setup();
      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Select an employee
      const employeeCombobox = screen.getAllByRole("combobox")[0];
      await user.click(employeeCombobox);

      await waitFor(() => {
        expect(screen.getByText("John Doe (EMP001)")).toBeInTheDocument();
      });

      await user.click(screen.getByText("John Doe (EMP001)"));

      // Click next
      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      // Should be on step 2
      await waitFor(() => {
        expect(
          screen.getByText("Step 2: Confirm Assignment"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("step 2 - confirmation", () => {
    it("should show assignment summary", async () => {
      const user = userEvent.setup();
      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Select an employee and go to step 2
      const employeeCombobox = screen.getAllByRole("combobox")[0];
      await user.click(employeeCombobox);

      await waitFor(() => {
        expect(screen.getByText("John Doe (EMP001)")).toBeInTheDocument();
      });
      await user.click(screen.getByText("John Doe (EMP001)"));

      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      // Check that we're on step 2 and summary content is shown
      await waitFor(() => {
        expect(
          screen.getByText("Step 2: Confirm Assignment"),
        ).toBeInTheDocument();
        // The asset tag is shown in the summary section
        expect(screen.getByText(/Asset:/)).toBeInTheDocument();
        // The assignee is shown
        expect(screen.getByText(/Assign to:/)).toBeInTheDocument();
      });
    });

    it("should show Back button on step 2", async () => {
      const user = userEvent.setup();
      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Go to step 2
      const employeeCombobox = screen.getAllByRole("combobox")[0];
      await user.click(employeeCombobox);

      await waitFor(() => {
        expect(screen.getByText("John Doe (EMP001)")).toBeInTheDocument();
      });
      await user.click(screen.getByText("John Doe (EMP001)"));

      await user.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /back/i }),
        ).toBeInTheDocument();
      });
    });

    it("should go back to step 1 when Back is clicked", async () => {
      const user = userEvent.setup();
      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Go to step 2
      const employeeCombobox = screen.getAllByRole("combobox")[0];
      await user.click(employeeCombobox);

      await waitFor(() => {
        expect(screen.getByText("John Doe (EMP001)")).toBeInTheDocument();
      });
      await user.click(screen.getByText("John Doe (EMP001)"));

      await user.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Step 2: Confirm Assignment"),
        ).toBeInTheDocument();
      });

      // Click back
      await user.click(screen.getByRole("button", { name: /back/i }));

      await waitFor(() => {
        expect(screen.getByText("Step 1: Select Employee")).toBeInTheDocument();
      });
    });

    it("should show notes textarea on step 2", async () => {
      const user = userEvent.setup();
      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Go to step 2
      const employeeCombobox = screen.getAllByRole("combobox")[0];
      await user.click(employeeCombobox);

      await waitFor(() => {
        expect(screen.getByText("John Doe (EMP001)")).toBeInTheDocument();
      });
      await user.click(screen.getByText("John Doe (EMP001)"));

      await user.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText("Notes (Optional)")).toBeInTheDocument();
        expect(
          screen.getByPlaceholderText(/Add any notes about this assignment/),
        ).toBeInTheDocument();
      });
    });
  });

  describe("form submission", () => {
    it("should call assignAssetToEmployeeAction on submit", async () => {
      const user = userEvent.setup();
      (assignAssetToEmployeeAction as Mock).mockResolvedValue({
        success: true,
      });

      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Go through wizard
      const employeeCombobox = screen.getAllByRole("combobox")[0];
      await user.click(employeeCombobox);

      await waitFor(() => {
        expect(screen.getByText("John Doe (EMP001)")).toBeInTheDocument();
      });
      await user.click(screen.getByText("John Doe (EMP001)"));

      await user.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Step 2: Confirm Assignment"),
        ).toBeInTheDocument();
      });

      // Submit
      await user.click(screen.getByRole("button", { name: /assign asset/i }));

      await waitFor(() => {
        expect(assignAssetToEmployeeAction).toHaveBeenCalledWith({
          assetId: "asset-1",
          personId: "person-1",
          stockLocationFromId: "loc-1",
          note: "",
        });
      });
    });

    it("should show success toast and call callbacks on success", async () => {
      const user = userEvent.setup();
      (assignAssetToEmployeeAction as Mock).mockResolvedValue({
        success: true,
      });

      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Go through wizard
      const employeeCombobox = screen.getAllByRole("combobox")[0];
      await user.click(employeeCombobox);

      await waitFor(() => {
        expect(screen.getByText("John Doe (EMP001)")).toBeInTheDocument();
      });
      await user.click(screen.getByText("John Doe (EMP001)"));

      await user.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Step 2: Confirm Assignment"),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /assign asset/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Asset assigned successfully!",
        );
        expect(defaultProps.onSuccess).toHaveBeenCalled();
        expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("should show error toast when assignment fails", async () => {
      const user = userEvent.setup();
      (assignAssetToEmployeeAction as Mock).mockResolvedValue({
        success: false,
        error: "Employee has too many assets",
      });

      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Go through wizard
      const employeeCombobox = screen.getAllByRole("combobox")[0];
      await user.click(employeeCombobox);

      await waitFor(() => {
        expect(screen.getByText("John Doe (EMP001)")).toBeInTheDocument();
      });
      await user.click(screen.getByText("John Doe (EMP001)"));

      await user.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Step 2: Confirm Assignment"),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /assign asset/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Employee has too many assets",
        );
        expect(defaultProps.onSuccess).not.toHaveBeenCalled();
      });
    });

    it("should show error toast when exception is thrown", async () => {
      const user = userEvent.setup();
      (assignAssetToEmployeeAction as Mock).mockRejectedValue(
        new Error("Network error"),
      );

      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Go through wizard
      const employeeCombobox = screen.getAllByRole("combobox")[0];
      await user.click(employeeCombobox);

      await waitFor(() => {
        expect(screen.getByText("John Doe (EMP001)")).toBeInTheDocument();
      });
      await user.click(screen.getByText("John Doe (EMP001)"));

      await user.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Step 2: Confirm Assignment"),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /assign asset/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to assign asset");
      });
    });
  });

  describe("cancel button", () => {
    it("should call onOpenChange(false) when cancel is clicked on step 1", async () => {
      const user = userEvent.setup();
      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should call onOpenChange(false) when cancel is clicked on step 2", async () => {
      const user = userEvent.setup();
      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Go to step 2
      const employeeCombobox = screen.getAllByRole("combobox")[0];
      await user.click(employeeCombobox);

      await waitFor(() => {
        expect(screen.getByText("John Doe (EMP001)")).toBeInTheDocument();
      });
      await user.click(screen.getByText("John Doe (EMP001)"));

      await user.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Step 2: Confirm Assignment"),
        ).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("loading state", () => {
    it("should show 'Assigning...' while submitting", async () => {
      const user = userEvent.setup();
      let resolveAssign: (value: { success: boolean }) => void;
      const assignPromise = new Promise<{ success: boolean }>((resolve) => {
        resolveAssign = resolve;
      });
      (assignAssetToEmployeeAction as Mock).mockReturnValue(assignPromise);

      render(<AssignAssetWizard {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Go through wizard
      const employeeCombobox = screen.getAllByRole("combobox")[0];
      await user.click(employeeCombobox);

      await waitFor(() => {
        expect(screen.getByText("John Doe (EMP001)")).toBeInTheDocument();
      });
      await user.click(screen.getByText("John Doe (EMP001)"));

      await user.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Step 2: Confirm Assignment"),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /assign asset/i }));

      await waitFor(() => {
        expect(screen.getByText("Assigning...")).toBeInTheDocument();
      });

      // Cleanup
      resolveAssign!({ success: true });
    });
  });
});
