/**
 * Import Application CIs for existing Services and create basic dependencies.
 *
 * - Creates/updates ConfigurationItems of class "Application" for each Service.
 * - Copies BIA metadata from Service.metadata.bia into CI attributes.
 * - Best-effort: creates DEPENDS_ON relationships from Application CIs
 *   to other CIs whose names contain the service/information-asset names.
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/import-service-cis.ts
 *   npx dotenv -e .env.local -- npx tsx scripts/import-service-cis.ts --dry-run
 */

import { prisma } from "../../src/infrastructure/database/prisma/client.js";
import { mergePrismaJson, toPrismaJson } from "./utils/prisma-json.js";

const DRY_RUN = process.argv.includes("--dry-run");

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "unnamed"
  );
}

function makeKeysFromService(
  name: string,
  bia: Record<string, unknown> | null | undefined,
): string[] {
  const keys = new Set<string>();
  const norm = (s: string | null | undefined) =>
    s?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";

  const base = norm(name);
  if (base) keys.add(base);

  const infoAsset =
    (bia?.informationAsset as string | undefined) ||
    (bia?.informationAssetInternal as string | undefined) ||
    (bia?.informationAssetRto as string | undefined);
  const asset = norm(infoAsset || "");
  if (asset) keys.add(asset);

  // Also add slash-split pieces, e.g. "Corebackend/Auth"
  for (const k of Array.from(keys)) {
    k.split("/").forEach((part) => {
      const p = norm(part);
      if (p) keys.add(p);
    });
  }

  // strip generic words
  const stripWords = ["service", "portal", "app", "application"];
  for (const k of Array.from(keys)) {
    let v = k;
    for (const w of stripWords) {
      v = v.replace(new RegExp(`\\b${w}\\b`, "g"), "");
    }
    const trimmed = v.trim();
    if (trimmed) keys.add(trimmed);
  }

  return Array.from(keys).filter((k) => k.length >= 3);
}

async function getApplicationClassId(): Promise<string> {
  const cls = await prisma.cIClass.findUnique({
    where: { name: "Application" },
    select: { id: true },
  });
  if (!cls) {
    throw new Error(
      "CIClass 'Application' not found. Ensure layer3 seeds have run.",
    );
  }
  return cls.id;
}

async function getDependsOnRelationshipId(): Promise<string> {
  const rel = await prisma.relationshipType.findUnique({
    where: { code: "DEPENDS_ON" },
    select: { id: true },
  });
  if (!rel) {
    throw new Error(
      "RelationshipType 'DEPENDS_ON' not found. Ensure layer3 seeds have run.",
    );
  }
  return rel.id;
}

async function main() {
  console.log("🧩 Importing Application CIs for Services");
  if (DRY_RUN) {
    console.log("⚠️  DRY RUN - no changes will be persisted\n");
  }

  const appClassId = await getApplicationClassId();
  const dependsOnId = await getDependsOnRelationshipId();

  const services = await prisma.service.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      dataConfidentiality: true,
      businessImpactLevel: true,
      criticality: true,
      metadata: true,
    },
  });

  let cisCreated = 0;
  let cisUpdated = 0;
  let relsCreated = 0;

  for (const svc of services) {
    const bia = ((svc.metadata as Record<string, unknown> | null | undefined)
      ?.bia ?? null) as Record<string, unknown> | null;

    const ciKey = `APP-${slugify(svc.name)}`.toUpperCase();
    const name = svc.name;

    const existingCi = await prisma.configurationItem.findUnique({
      where: { ciKey },
      select: { id: true, attributes: true, ciClassId: true },
    });

    const baseAttributes: Record<string, unknown> = {
      SERVICE_ID: svc.id,
      SERVICE_NAME: svc.name,
      SERVICE_DESCRIPTION: svc.description || null,
      DATA_CONFIDENTIALITY: svc.dataConfidentiality || null,
      BUSINESS_IMPACT_LEVEL: svc.businessImpactLevel || null,
      CRITICALITY: svc.criticality || null,
      BIA: bia,
    };

    let appCiId: string;

    if (existingCi) {
      appCiId = existingCi.id;
      if (!DRY_RUN) {
        const mergedAttributes = mergePrismaJson(
          existingCi.attributes,
          baseAttributes,
        );
        await prisma.configurationItem.update({
          where: { id: existingCi.id },
          data: {
            name,
            ciClassId: appClassId,
            attributes: mergedAttributes,
          },
        });
      }
      cisUpdated++;
    } else {
      if (!DRY_RUN) {
        const created = await prisma.configurationItem.create({
          data: {
            ciClassId: appClassId,
            ciKey,
            name,
            attributes: toPrismaJson(baseAttributes),
          },
        });
        appCiId = created.id;
      } else {
        appCiId = `dry-${ciKey}`;
      }
      cisCreated++;
    }

    // Best-effort dependencies: find infra CIs whose names contain service keys
    const keys = makeKeysFromService(svc.name, bia);
    if (!keys.length || DRY_RUN) continue;

    const targets = await prisma.configurationItem.findMany({
      where: {
        ciClass: {
          // skip Application to avoid self
          name: { not: "Application" },
        },
        OR: keys.map((k) => ({
          name: {
            contains: k,
            mode: "insensitive",
          },
        })),
      },
      select: { id: true, name: true },
      take: 20,
    });

    for (const target of targets) {
      // avoid duplicates
      const existingRel = await prisma.cIRelationship.findFirst({
        where: {
          fromCiId: appCiId,
          toCiId: target.id,
          relationshipTypeId: dependsOnId,
        },
        select: { id: true },
      });
      if (existingRel) continue;

      if (!DRY_RUN) {
        await prisma.cIRelationship.create({
          data: {
            fromCiId: appCiId,
            toCiId: target.id,
            relationshipTypeId: dependsOnId,
          },
        });
      }
      relsCreated++;
    }
  }

  console.log("\nSummary");
  console.log("-------");
  console.log(`Application CIs: created ${cisCreated}, updated ${cisUpdated}`);
  console.log(`DEPENDS_ON relationships created: ${relsCreated}`);

  if (DRY_RUN) {
    console.log("\n⚠️  DRY RUN - no database changes were made");
  }
}

main()
  .then(() => {
    console.log("\n✅ Service CI import completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Service CI import failed:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
