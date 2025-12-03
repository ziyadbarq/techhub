/**
 * Import Physical Assets (Laptops + Monitors)
 *
 * Sources:
 * - local/barq-data/Apple_LAPTOPS.csv
 * - local/barq-data/Monitors.csv
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/import-physical-assets.ts
 *   npx dotenv -e .env.local -- npx tsx scripts/import-physical-assets.ts --dry-run
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import Papa from "papaparse";
import { prisma } from "../../src/infrastructure/database/prisma/client.js";
import { mergePrismaJson, toPrismaJson } from "../utils/prisma-json.js";

const DRY_RUN = process.argv.includes("--dry-run");
const DATA_DIR = join(process.cwd(), "local/barq-data");

function parseCsv<T extends Record<string, unknown>>(file: string): T[] {
  const raw = readFileSync(join(DATA_DIR, file), "utf-8");
  const res = Papa.parse<T>(raw, { header: true, skipEmptyLines: true });
  if (res.errors.length) {
    throw new Error(
      `${file} parse errors: ${res.errors
        .map((e) => `${e.row}:${e.message}`)
        .join(", ")}`,
    );
  }
  return res.data;
}

async function getCategoryId(code: string): Promise<string> {
  const cat = await prisma.assetCategory.findFirst({
    where: { code },
    select: { id: true },
  });
  if (!cat) throw new Error(`AssetCategory ${code} not found`);
  return cat.id;
}

async function findPersonIdByEmail(email: string | null | undefined) {
  if (!email) return null;
  return (
    await prisma.person.findFirst({
      where: {
        email: {
          equals: email.trim(),
          mode: "insensitive",
        },
      },
      select: { id: true },
    })
  )?.id;
}

async function importLaptops() {
  type Row = {
    "Computer Name": string;
    Username: string;
    "Last Enrollment": string;
    "Operating System Name": string;
    Model: string;
    "Serial Number": string;
    "Last Check-in": string;
    "JSS Computer ID": string;
    Email: string;
  };

  const rows = parseCsv<Row>("Apple_LAPTOPS.csv");
  const categoryId = await getCategoryId("LAPTOP");

  let created = 0;
  let updated = 0;
  let assignments = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const serial = row["Serial Number"]?.trim();
    if (!serial) continue;

    const assetTag = `MB-${serial}`.toUpperCase();
    const email = row.Email?.trim() || null;
    const personId = await findPersonIdByEmail(email);

    const attributes: Record<string, unknown> = {
      COMPUTER_NAME: row["Computer Name"] || null,
      USERNAME: row.Username || null,
      OS_NAME: row["Operating System Name"] || null,
      MODEL_RAW: row.Model || null,
      LAST_ENROLLMENT: row["Last Enrollment"] || null,
      LAST_CHECKIN: row["Last Check-in"] || null,
      JAMF_ID: row["JSS Computer ID"] || null,
      EMAIL_RAW: email,
    };

    const existing = await prisma.asset.findFirst({
      where: {
        OR: [{ serialNumber: serial }, { assetTag }],
      },
      include: { assetAssignments: true },
    });

    let assetId: string;

    if (existing) {
      assetId = existing.id;
      if (!DRY_RUN) {
        const mergedAttributes = mergePrismaJson(
          existing.attributes,
          attributes,
        );
        await prisma.asset.update({
          where: { id: assetId },
          data: {
            attributes: mergedAttributes,
          },
        });
      }
      updated++;
    } else {
      if (!DRY_RUN) {
        const createdAsset = await prisma.asset.create({
          data: {
            assetTag,
            assetCategoryId: categoryId,
            serialNumber: serial,
            note: row.Model || undefined,
            attributes: toPrismaJson(attributes),
          },
        });
        assetId = createdAsset.id;
      } else {
        assetId = `dry-${assetTag}`;
      }
      created++;
    }

    if (personId && !DRY_RUN) {
      const already = existing?.assetAssignments?.some(
        (a) =>
          a.assigneeType === "PERSON" &&
          a.assigneeId === personId &&
          a.endDate == null,
      );
      if (!already) {
        await prisma.assetAssignment.create({
          data: {
            assetId,
            assigneeType: "PERSON",
            assigneeId: personId,
            startDate: new Date(),
            isPrimary: true,
          },
        });
        assignments++;
      }
    }
  }

  return { created, updated, assignments };
}

async function importMonitors() {
  type Row = {
    User: string;
    SN: string;
    Model: string;
    Location: string;
    Category: string;
  };

  const rows = parseCsv<Row>("Monitors.csv");
  const categoryId = await getCategoryId("MONITOR");

  let created = 0;
  let updated = 0;
  let assignments = 0;

  for (const row of rows) {
    const serial = row.SN?.trim();
    if (!serial) continue;

    const assetTag = `MON-${serial}`.toUpperCase();
    const email = row.User?.trim() || null;
    const personId = await findPersonIdByEmail(email);

    const attributes: Record<string, unknown> = {
      MODEL_RAW: row.Model || null,
      LOCATION_RAW: row.Location || null,
      CATEGORY_RAW: row.Category || null,
      EMAIL_RAW: email,
    };

    const existing = await prisma.asset.findFirst({
      where: {
        OR: [{ serialNumber: serial }, { assetTag }],
      },
      include: { assetAssignments: true },
    });

    let assetId: string;

    if (existing) {
      assetId = existing.id;
      if (!DRY_RUN) {
        const mergedAttributes = mergePrismaJson(
          existing.attributes,
          attributes,
        );
        await prisma.asset.update({
          where: { id: assetId },
          data: {
            attributes: mergedAttributes,
          },
        });
      }
      updated++;
    } else {
      if (!DRY_RUN) {
        const createdAsset = await prisma.asset.create({
          data: {
            assetTag,
            assetCategoryId: categoryId,
            serialNumber: serial,
            note: row.Model || undefined,
            attributes: toPrismaJson(attributes),
          },
        });
        assetId = createdAsset.id;
      } else {
        assetId = `dry-${assetTag}`;
      }
      created++;
    }

    if (personId && !DRY_RUN) {
      const already = existing?.assetAssignments?.some(
        (a) =>
          a.assigneeType === "PERSON" &&
          a.assigneeId === personId &&
          a.endDate == null,
      );
      if (!already) {
        await prisma.assetAssignment.create({
          data: {
            assetId,
            assigneeType: "PERSON",
            assigneeId: personId,
            startDate: new Date(),
            isPrimary: true,
          },
        });
        assignments++;
      }
    }
  }

  return { created, updated, assignments };
}

async function main() {
  console.log("💻 Importing physical assets (laptops + monitors)");
  if (DRY_RUN) {
    console.log("⚠️  DRY RUN - no changes will be persisted\n");
  }

  const laptops = await importLaptops();
  const monitors = await importMonitors();

  console.log("\nSummary");
  console.log("-------");
  console.log(
    `Laptops:  created ${laptops.created}, updated ${laptops.updated}, assignments ${laptops.assignments}`,
  );
  console.log(
    `Monitors: created ${monitors.created}, updated ${monitors.updated}, assignments ${monitors.assignments}`,
  );

  if (DRY_RUN) {
    console.log("\n⚠️  DRY RUN - no database changes were made");
  }
}

main()
  .then(() => {
    console.log("\n✅ Physical asset import completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Physical asset import failed:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
