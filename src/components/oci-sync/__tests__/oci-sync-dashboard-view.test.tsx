/**
 * OCI Sync Dashboard View - Preview Semantics
 *
 * @vitest-environment jsdom
 */

import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OCI_SERVICE_KEYS } from "@/core/domain/value-objects/oci-resource.types";
import type { OciSyncLogDTO } from "@/interface-adapters/dtos/generated/oci-sync.dto";
import { OciSyncDashboardView } from "../oci-sync-dashboard-view";

const previewLog: OciSyncLogDTO = {
  id: "log-1",
  status: "PARTIAL",
  serviceTypes: [...OCI_SERVICE_KEYS],
  tenancyId: "ocid1.tenancy.oc1..example",
  regions: ["me-jeddah-1", "me-riyadh-1"],
  resourcesProcessed: 188,
  resourcesCreated: 157,
  resourcesUpdated: 31,
  resourcesRetired: 0,
  resourcesUnchanged: 0,
  compartmentsCreated: 2,
  relationshipsCreated: 0,
  errorsCount: 1,
  startedAt: "2026-03-26T16:36:26.000Z",
  completedAt: "2026-03-26T16:36:33.000Z",
  durationMs: 7683,
  triggeredBy: "abdullah@alzuwayed.net",
  isDryRun: true,
  latestIssue:
    "The CMDB relationship type 'CONTAINS' is missing, so OCI resources were synced without compartment-to-resource relationships. Create or restore the CONTAINS relationship type to enable relationship creation.",
};

describe("OciSyncDashboardView", () => {
  it("renders preview-specific labels and guidance for dry-run results", () => {
    render(
      <OciSyncDashboardView
        logs={[previewLog]}
        latest={previewLog}
        selectedLog={previewLog}
        isPending={false}
        selectedServices={[...OCI_SERVICE_KEYS]}
        dryRun
        canTrigger
        onToggleService={() => {}}
        onSelectAllServices={() => {}}
        onClearServices={() => {}}
        onDryRunChange={() => {}}
        onSync={() => {}}
        onSelectLog={() => {}}
      />,
    );

    expect(
      screen.getAllByText("Preview Needs Attention").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Would create").length).toBeGreaterThan(0);
    expect(screen.getByText("Would link")).toBeInTheDocument();
    expect(
      screen.getAllByText("Resolve before live sync").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText("Preview metrics are projections"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Counts marked as "would create", "would update", "would retire", or "would link"/,
      ),
    ).toBeInTheDocument();
  });
});
