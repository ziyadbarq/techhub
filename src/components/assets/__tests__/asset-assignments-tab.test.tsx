/**
 * AssetAssignmentsTab Component - Unit Tests
 *
 * Tests for the AssetAssignmentsTab component including:
 * - Loading state
 * - Empty state
 * - Assignment list rendering
 * - Active/inactive badge display
 * - Error handling
 *
 * @vitest-environment jsdom
 */

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import type { AssetAssignmentDTO } from "@/interface-adapters/presenters/asset-assignment.presenter";

// Mock server-only module to prevent import errors
vi.mock("server-only", () => ({}));

// Mock server actions
vi.mock("@/interface-adapters/controllers/asset-assignment.controller", () => ({
  listAssetAssignmentsAction: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks
import { AssetAssignmentsTab } from "../asset-assignments-tab";
import { listAssetAssignmentsAction } from "@/interface-adapters/controllers/asset-assignment.controller";

// Helper to create mock assignment data
const createMockAssignment = (
  overrides?: Partial<AssetAssignmentDTO>,
): AssetAssignmentDTO => ({
  id: "assignment-1",
  assetId: "asset-1",
  assigneeType: "PERSON",
  assigneeId: "person-1",
  startDate: "2024-01-15T00:00:00.000Z",
  endDate: null,
  isPrimary: true,
  conditionOnAssignment: null,
  conditionOnReturn: null,
  note: null,
  createdAt: "2024-01-15T00:00:00.000Z",
  updatedAt: "2024-01-15T00:00:00.000Z",
  // Computed fields
  isActive: true,
  durationInDays: 30,
  // Display fields
  assigneeName: "John Doe",
  // Source tracking
  source: "MANUAL",
  sourceReferenceType: null,
  sourceReferenceId: null,
  // Conflict tracking
  hasConflict: false,
  conflictNote: null,
  // Computed fields for source
  isIntuneManaged: false,
  isManual: true,
  ...overrides,
});

describe("AssetAssignmentsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("empty state", () => {
    it("should show 'No assignment history' when there are no assignments", async () => {
      (listAssetAssignmentsAction as Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      render(<AssetAssignmentsTab assetId="asset-1" />);

      await waitFor(() => {
        expect(screen.getByText("No assignment history")).toBeInTheDocument();
      });
    });
  });

  describe("assignment list", () => {
    it("should display assignment count in header", async () => {
      (listAssetAssignmentsAction as Mock).mockResolvedValue({
        success: true,
        data: [
          createMockAssignment({ id: "1" }),
          createMockAssignment({ id: "2" }),
        ],
      });

      render(<AssetAssignmentsTab assetId="asset-1" />);

      await waitFor(() => {
        expect(screen.getByText("Assignment History")).toBeInTheDocument();
        expect(screen.getByText("2 assignments")).toBeInTheDocument();
      });
    });

    it("should show singular 'assignment' for single assignment", async () => {
      (listAssetAssignmentsAction as Mock).mockResolvedValue({
        success: true,
        data: [createMockAssignment()],
      });

      render(<AssetAssignmentsTab assetId="asset-1" />);

      await waitFor(() => {
        expect(screen.getByText("1 assignment")).toBeInTheDocument();
      });
    });

    it("should display assignee type and name", async () => {
      (listAssetAssignmentsAction as Mock).mockResolvedValue({
        success: true,
        data: [
          createMockAssignment({
            assigneeType: "PERSON",
            assigneeName: "Jane Smith",
          }),
        ],
      });

      render(<AssetAssignmentsTab assetId="asset-1" />);

      await waitFor(() => {
        expect(screen.getByText("PERSON: Jane Smith")).toBeInTheDocument();
      });
    });

    it("should fall back to assigneeId when assigneeName is not provided", async () => {
      (listAssetAssignmentsAction as Mock).mockResolvedValue({
        success: true,
        data: [
          createMockAssignment({
            assigneeType: "DEPARTMENT",
            assigneeName: undefined,
            assigneeId: "dept-123",
          }),
        ],
      });

      render(<AssetAssignmentsTab assetId="asset-1" />);

      await waitFor(() => {
        expect(screen.getByText("DEPARTMENT: dept-123")).toBeInTheDocument();
      });
    });

    it("should display date range with start and end dates", async () => {
      (listAssetAssignmentsAction as Mock).mockResolvedValue({
        success: true,
        data: [
          createMockAssignment({
            startDate: "2024-01-15T00:00:00.000Z",
            endDate: "2024-06-15T00:00:00.000Z",
          }),
        ],
      });

      render(<AssetAssignmentsTab assetId="asset-1" />);

      await waitFor(() => {
        expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
        expect(screen.getByText(/Jun 15, 2024/)).toBeInTheDocument();
      });
    });

    it("should show 'Present' for active assignments without end date", async () => {
      (listAssetAssignmentsAction as Mock).mockResolvedValue({
        success: true,
        data: [
          createMockAssignment({
            endDate: null,
          }),
        ],
      });

      render(<AssetAssignmentsTab assetId="asset-1" />);

      await waitFor(() => {
        expect(screen.getByText(/Present/)).toBeInTheDocument();
      });
    });

    it("should display note when provided", async () => {
      (listAssetAssignmentsAction as Mock).mockResolvedValue({
        success: true,
        data: [
          createMockAssignment({
            note: "This is a test note for the assignment",
          }),
        ],
      });

      render(<AssetAssignmentsTab assetId="asset-1" />);

      await waitFor(() => {
        expect(
          screen.getByText("This is a test note for the assignment"),
        ).toBeInTheDocument();
      });
    });

    it("should not display note section when note is null", async () => {
      (listAssetAssignmentsAction as Mock).mockResolvedValue({
        success: true,
        data: [
          createMockAssignment({
            note: null,
          }),
        ],
      });

      render(<AssetAssignmentsTab assetId="asset-1" />);

      await waitFor(() => {
        expect(screen.getByText("PERSON: John Doe")).toBeInTheDocument();
      });

      // Note section should not be present
      const cardContents = document.querySelectorAll('[class*="card-content"]');
      expect(cardContents.length).toBe(0);
    });
  });

  describe("badges", () => {
    it("should show 'Active' badge for assignments without end date", async () => {
      (listAssetAssignmentsAction as Mock).mockResolvedValue({
        success: true,
        data: [
          createMockAssignment({
            endDate: null,
          }),
        ],
      });

      render(<AssetAssignmentsTab assetId="asset-1" />);

      await waitFor(() => {
        expect(screen.getByText("Active")).toBeInTheDocument();
      });
    });

    it("should show 'Active' badge for assignments with future end date", async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      (listAssetAssignmentsAction as Mock).mockResolvedValue({
        success: true,
        data: [
          createMockAssignment({
            endDate: futureDate.toISOString(),
          }),
        ],
      });

      render(<AssetAssignmentsTab assetId="asset-1" />);

      await waitFor(() => {
        expect(screen.getByText("Active")).toBeInTheDocument();
      });
    });

    it("should not show 'Active' badge for ended assignments", async () => {
      (listAssetAssignmentsAction as Mock).mockResolvedValue({
        success: true,
        data: [
          createMockAssignment({
            endDate: "2020-01-15T00:00:00.000Z",
          }),
        ],
      });

      render(<AssetAssignmentsTab assetId="asset-1" />);

      await waitFor(() => {
        expect(screen.getByText("PERSON: John Doe")).toBeInTheDocument();
      });

      expect(screen.queryByText("Active")).not.toBeInTheDocument();
    });

    it("should show 'Primary' badge when isPrimary is true", async () => {
      (listAssetAssignmentsAction as Mock).mockResolvedValue({
        success: true,
        data: [
          createMockAssignment({
            isPrimary: true,
          }),
        ],
      });

      render(<AssetAssignmentsTab assetId="asset-1" />);

      await waitFor(() => {
        expect(screen.getByText("Primary")).toBeInTheDocument();
      });
    });

    it("should not show 'Primary' badge when isPrimary is false", async () => {
      (listAssetAssignmentsAction as Mock).mockResolvedValue({
        success: true,
        data: [
          createMockAssignment({
            isPrimary: false,
          }),
        ],
      });

      render(<AssetAssignmentsTab assetId="asset-1" />);

      await waitFor(() => {
        expect(screen.getByText("PERSON: John Doe")).toBeInTheDocument();
      });

      expect(screen.queryByText("Primary")).not.toBeInTheDocument();
    });
  });

  describe("error handling", () => {
    it("should show error toast when API returns error", async () => {
      (listAssetAssignmentsAction as Mock).mockResolvedValue({
        success: false,
        error: "Failed to fetch assignments",
      });

      render(<AssetAssignmentsTab assetId="asset-1" />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to fetch assignments");
      });
    });

    it("should show error toast when exception is thrown", async () => {
      (listAssetAssignmentsAction as Mock).mockRejectedValue(
        new Error("Network error"),
      );

      render(<AssetAssignmentsTab assetId="asset-1" />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to load assignments");
      });
    });
  });

  describe("data fetching", () => {
    it("should call listAssetAssignmentsAction with correct assetId", async () => {
      (listAssetAssignmentsAction as Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      render(<AssetAssignmentsTab assetId="test-asset-id" />);

      await waitFor(() => {
        expect(listAssetAssignmentsAction).toHaveBeenCalledWith({
          assetId: "test-asset-id",
        });
      });
    });

    it("should refetch when assetId changes", async () => {
      (listAssetAssignmentsAction as Mock).mockResolvedValue({
        success: true,
        data: [],
      });

      const { rerender } = render(<AssetAssignmentsTab assetId="asset-1" />);

      await waitFor(() => {
        expect(listAssetAssignmentsAction).toHaveBeenCalledWith({
          assetId: "asset-1",
        });
      });

      rerender(<AssetAssignmentsTab assetId="asset-2" />);

      await waitFor(() => {
        expect(listAssetAssignmentsAction).toHaveBeenCalledWith({
          assetId: "asset-2",
        });
      });
    });
  });
});
