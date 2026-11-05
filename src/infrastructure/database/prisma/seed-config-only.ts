/**
 * One-time reference-data seed for GCP Dev.
 *
 * Updates the three requested areas without re-running RBAC role assignments:
 *  - Organization Unit companies BARQ/AOUN
 *  - DEVICE_NAME custom field + LAPTOP category mapping
 *  - The four published TechHub starter workflow forms
 *
 * Migrations must already be applied. Never run dev/demo seed here.
 */
import { prisma } from "./client.js";
import { seedFoundation } from "./seed-foundation.js";
import { seedAssetConfig } from "./seed-assets.js";
import { seedWorkflowsStarter } from "./seed-workflows-starter.js";

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

  console.log("[seed-config-only] Seeding foundation reference data...");
  await seedFoundation(prisma);

  console.log("[seed-config-only] Seeding asset category and custom field mappings...");
  await seedAssetConfig(prisma);

  console.log("[seed-config-only] Seeding published workflow starters...");
  await seedWorkflowsStarter(prisma);

  // Fail the Kubernetes Job if any required data is still missing.
  const [companies, field, laptop, forms] = await Promise.all([
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
  ]);

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

  console.log("[seed-config-only] VERIFIED: BARQ/AOUN, LAPTOP DEVICE_NAME, four starter workflows");
  console.log("[seed-config-only] WORKFLOW_ENGINE flag is not enabled by this job; enable it through the approved admin workflow.");
}

main()
  .catch((error) => {
    console.error("[seed-config-only] FAILED:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
