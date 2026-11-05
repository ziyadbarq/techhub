/**
 * One-time reference-data seed for GCP Dev.
 *
 * Updates the three requested areas without re-running RBAC role assignments:
 *  - Organization Unit companies BARQ/AOUN
 *  - DEVICE_NAME custom field + LAPTOP category mapping
 *  - The four published TechHub starter workflow forms
 *  - WORKFLOW_ENGINE feature definition (disabled by default)
 *  - Workflow permission definitions (no role-permission changes)
 *
 * Migrations must already be applied. Never run dev/demo seed here.
 */
import { prisma } from "./client.js";
import { seedFoundation } from "./seed-foundation.js";
import { seedAssetConfig } from "./seed-assets.js";
import { seedWorkflowsStarter } from "./seed-workflows-starter.js";
import { FEATURE_FLAGS } from "./seed-features.js";
import { SYSTEM_PERMISSIONS } from "./seed-rbac-permissions.js";

const requiredRoles = [
  "system-administrator",
  "service-owner",
  "security-officer",
  "inventory-manager",
  "finance-manager",
  "it-help-desk",
] as const;

const starterForms = [
  "Asset Request",
  "Access Request",
  "Vendor Onboarding",
  "CI Change Request",
] as const;

// Share the same canonical definitions as the standard seed, but avoid its
// role-permission reset and feature activation side effects.
const workflowFeature = FEATURE_FLAGS.find(
  (feature) => feature.name === "WORKFLOW_ENGINE",
);
const workflowPermissions = SYSTEM_PERMISSIONS.filter((permission) =>
  permission.name.startsWith("workflows-"),
);

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing; refusing to seed");
  }

  // The workflow seeder silently skips if roles are missing. Fail explicitly
  // before any mutation; do not run seedRBAC, which rewrites role permissions.
  const roles = await prisma.role.findMany({
    where: { name: { in: [...requiredRoles] } },
    select: { name: true },
  });
  const existingRoles = new Set(roles.map((role) => role.name));
  const missingRoles = requiredRoles.filter((role) => !existingRoles.has(role));
  if (missingRoles.length) {
    throw new Error(`Missing workflow roles: ${missingRoles.join(", ")}. Run an approved RBAC remediation separately.`);
  }

  if (!workflowFeature || workflowPermissions.length === 0) {
    throw new Error("WORKFLOW_ENGINE flag or workflow permission definitions missing from source");
  }

  console.log("[seed-config-only] Registering WORKFLOW_ENGINE feature flag...");
  await prisma.featureFlag.upsert({
    where: { name: workflowFeature.name },
    // Preserve any admin-selected state and metadata of an existing flag.
    update: {},
    create: {
      name: workflowFeature.name,
      displayName: workflowFeature.displayName,
      description: workflowFeature.description,
      category: workflowFeature.category,
      isEnabled: false,
      isSystem: workflowFeature.isSystem,
      dependsOn: workflowFeature.dependsOn,
    },
  });

  console.log(
    `[seed-config-only] Registering ${workflowPermissions.length} workflow permissions...`,
  );
  for (const permission of workflowPermissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      // Never replace permission metadata, role assignments, or active status.
      update: {},
      create: {
        name: permission.name,
        displayName: permission.displayName,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        isSystem: true,
        isActive: true,
      },
    });
  }

  console.log("[seed-config-only] Seeding foundation reference data...");
  await seedFoundation(prisma);

  console.log("[seed-config-only] Seeding asset category and custom field mappings...");
  await seedAssetConfig(prisma);

  console.log("[seed-config-only] Seeding published workflow starters...");
  await seedWorkflowsStarter(prisma);

  // Fail the Kubernetes Job if any required data is still missing.
  const [companies, field, laptop, forms, featureFlag, storedPermissions] = await Promise.all([
    prisma.organizationUnit.findMany({
      where: { code: { in: ["BARQ", "AOUN"] }, unitType: "COMPANY" },
      select: { code: true },
    }),
    prisma.fieldDefinition.findFirst({
      where: { name: "DEVICE_NAME" },
      select: { id: true },
    }),
    prisma.assetCategory.findUnique({
      where: { code: "LAPTOP" },
      select: { id: true },
    }),
    prisma.form.findMany({
      where: { name: { in: [...starterForms] }, publishedVersionId: { not: null } },
      select: { name: true },
    }),
    prisma.featureFlag.findUnique({
      where: { name: "WORKFLOW_ENGINE" },
      select: { name: true },
    }),
    prisma.permission.findMany({
      where: { name: { in: workflowPermissions.map((permission) => permission.name) } },
      select: { name: true, isActive: true },
    }),
  ]);

  if (!featureFlag) {
    throw new Error("WORKFLOW_ENGINE feature flag missing after seed");
  }
  const storedPermissionNames = new Set(storedPermissions.map((permission) => permission.name));
  const missingPermissions = workflowPermissions
    .map((permission) => permission.name)
    .filter((name) => !storedPermissionNames.has(name));
  if (missingPermissions.length) {
    throw new Error(`Workflow permission definitions missing after seed: ${missingPermissions.join(", ")}`);
  }
  const inactivePermissions = storedPermissions
    .filter((permission) => !permission.isActive)
    .map((permission) => permission.name);
  if (inactivePermissions.length) {
    throw new Error(
      `Inactive workflow permissions require admin review: ${inactivePermissions.join(", ")}`,
    );
  }

  const companyCodes = new Set(companies.map((company) => company.code));
  if (!companyCodes.has("BARQ") || !companyCodes.has("AOUN")) {
    throw new Error("BARQ/AOUN companies missing after seed");
  }
  if (!field || !laptop) {
    throw new Error("DEVICE_NAME definition or LAPTOP category missing after seed");
  }

  const deviceNameMapping = await prisma.assetCategoryField.findFirst({
    where: {
      assetCategoryId: laptop.id,
      fieldDefinitionId: field.id,
    },
    select: { id: true },
  });
  if (!deviceNameMapping) {
    throw new Error("DEVICE_NAME was not linked to LAPTOP");
  }

  const published = new Set(forms.map((form) => form.name));
  const missingForms = starterForms.filter((name) => !published.has(name));
  if (missingForms.length) {
    throw new Error(`Published workflow starters missing: ${missingForms.join(", ")}`);
  }

  console.log(
    `[seed-config-only] VERIFIED: WORKFLOW_ENGINE flag, ${workflowPermissions.length} workflow permissions, BARQ/AOUN, LAPTOP DEVICE_NAME, four starter workflows`,
  );
  console.log("[seed-config-only] WORKFLOW_ENGINE remains admin-controlled; no role permissions were assigned or reset.");
}

main()
  .catch((error) => {
    console.error("[seed-config-only] FAILED:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
