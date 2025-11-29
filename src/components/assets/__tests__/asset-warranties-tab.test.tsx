/**
 * AssetWarrantiesTab Component - Unit Tests
 *
 * Tests for the AssetWarrantiesTab wrapper component.
 * Since this is a simple wrapper around AssetWarrantyPanel,
 * we mainly test that props are passed correctly.
 *
 * @vitest-environment jsdom
 */

import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock server-only module to prevent import errors
vi.mock("server-only", () => ({}));

// Mock the AssetWarrantyPanel component
vi.mock("@/components/warranties/asset-warranty-panel", () => ({
  AssetWarrantyPanel: ({
    assetId,
    compact,
  }: {
    assetId: string;
    compact: boolean;
  }) => (
    <div data-testid="asset-warranty-panel">
      <span data-testid="asset-id">{assetId}</span>
      <span data-testid="compact">{String(compact)}</span>
    </div>
  ),
}));

// Import after mocks
import { AssetWarrantiesTab } from "../asset-warranties-tab";

describe("AssetWarrantiesTab", () => {
  it("should render the AssetWarrantyPanel", () => {
    render(<AssetWarrantiesTab assetId="asset-123" />);

    expect(screen.getByTestId("asset-warranty-panel")).toBeInTheDocument();
  });

  it("should pass the correct assetId to AssetWarrantyPanel", () => {
    render(<AssetWarrantiesTab assetId="test-asset-id" />);

    expect(screen.getByTestId("asset-id")).toHaveTextContent("test-asset-id");
  });

  it("should pass compact=false to AssetWarrantyPanel", () => {
    render(<AssetWarrantiesTab assetId="asset-123" />);

    expect(screen.getByTestId("compact")).toHaveTextContent("false");
  });

  it("should render within a container div", () => {
    const { container } = render(<AssetWarrantiesTab assetId="asset-123" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("space-y-6");
  });
});
