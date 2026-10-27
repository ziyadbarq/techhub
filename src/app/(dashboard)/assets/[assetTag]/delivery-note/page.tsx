/**
 * Asset Delivery Note Page
 *
 * Printable handover form for a single asset, pre-filled with the current
 * holder. Printed, signed by hand, scanned, then uploaded back onto the
 * asset from its Attachments tab. Lives in the dashboard group (chrome is
 * hidden by the layout) so returning to the asset does not rebuild the shell.
 */

import { notFound } from "next/navigation";

import { DeliveryNotePrint } from "@/components/assets/delivery-note-print";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { getActiveAssignmentAction } from "@/interface-adapters/controllers/asset-assignment.controller";
import { getAssetAction } from "@/interface-adapters/controllers/asset.controller";
import { getOrganizationUnitAction } from "@/interface-adapters/controllers/organization-unit.controller";
import { getPersonAction } from "@/interface-adapters/controllers/person.controller";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import { requireFeatureAndPermission } from "@/lib/features/feature-permission-guard";

/** Forms are dated in Riyadh time regardless of the server's zone. */
const TIME_ZONE = "Asia/Riyadh";

export const dynamic = "force-dynamic";

interface DeliveryNotePageProps {
  params: Promise<{
    assetTag: string;
  }>;
}

export default async function DeliveryNotePage({
  params,
}: DeliveryNotePageProps) {
  const { assetTag } = await params;

  await requireFeatureAndPermission(
    "ASSETS",
    PERMISSIONS.ASSETS_VIEW,
    `/assets/${assetTag}/delivery-note`,
  );

  const assetResult = await getAssetAction(assetTag);

  if (!assetResult.success || !assetResult.data) {
    notFound();
  }

  const asset = assetResult.data;

  // Employee details are a convenience, not a requirement: an unassigned
  // asset still prints a valid blank form for the help desk to fill in.
  // Each lookup is permission-gated on its own, so a user who may view
  // assets but not people simply gets the blank form.
  let person: PersonDTO | null = null;

  const assignmentResult = await getActiveAssignmentAction(asset.id);
  if (
    assignmentResult.success &&
    assignmentResult.data?.assigneeType === "PERSON"
  ) {
    const personResult = await getPersonAction(
      assignmentResult.data.assigneeId,
    );
    if (personResult.success) {
      person = personResult.data;
    }
  }

  // Department as the Persons page shows it: the Microsoft "department"
  // when synced, otherwise the person's organization unit. getPersonAction
  // does not join the unit, so look its name up here.
  if (person && !person.department && !person.orgUnitName) {
    const unitResult = await getOrganizationUnitAction(
      person.organizationUnitId,
    );
    if (unitResult.success) {
      person = { ...person, orgUnitName: unitResult.data.name };
    }
  }

  const now = new Date();
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE })
    .format(now)
    .replaceAll("-", "");
  const issuedOn = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(now);

  return (
    <DeliveryNotePrint
      asset={asset}
      person={person}
      reference={`DN-${asset.assetTag}-${ymd}`}
      issuedOn={issuedOn}
    />
  );
}
