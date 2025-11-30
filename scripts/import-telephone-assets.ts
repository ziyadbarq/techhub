/**
 * Import Telephone Assets
 *
 * Reads local/barq-data/Telephone.csv and creates assets in the TELEPHONE
 * category, storing MAC and extension as custom attributes, and assigns
 * each asset to a person by email when found.
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/import-telephone-assets.ts
 *   npx dotenv -e .env.local -- npx tsx scripts/import-telephone-assets.ts --dry-run
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import Papa from "papaparse";
import { prisma } from "../src/infrastructure/database/prisma/client.js";
import { mergePrismaJson, toPrismaJson } from "./utils/prisma-json.js";

const DRY_RUN = process.argv.includes("--dry-run");
const DATA_FILE = join(process.cwd(), "local/barq-data/Telephone.csv");

const TELEPHONE_CATEGORY = {
  code: "TELEPHONE",
  name: "Telephones",
  description: "Desk/VoIP telephones imported from Telephone.csv",
};

const FIELD_CODES = {
  MAC: "MAC_ADDR",
  EXT: "EXT_NUMBER",
};

type CsvRow = {
  "Mac Address IP Phone": string;
  "Ext no": string;
  Name: string;
  Email: string;
};

async function ensureTelephoneCategory() {
  const category = await prisma.assetCategory.upsert({
    where: { code: TELEPHONE_CATEGORY.code },
    create: {
      code: TELEPHONE_CATEGORY.code,
      name: TELEPHONE_CATEGORY.name,
      description: TELEPHONE_CATEGORY.description,
    },
    update: {},
  });

  // MAC field already exists from seed; ensure it is linked
  const [macField, extField] = await Promise.all([
    prisma.fieldDefinition.findFirst({
      where: { name: FIELD_CODES.MAC },
    }),
    prisma.fieldDefinition.upsert({
      where: { name: FIELD_CODES.EXT },
      create: {
        name: FIELD_CODES.EXT,
        label: "Extension Number",
        dataType: "STRING",
        entityType: "Asset",
        isGlobal: true,
        isSearchable: true,
        isFilterable: true,
        description: "Telephone extension",
      },
      update: {
        isActive: true,
      },
    }),
  ]);

  const fieldMap = new Map<string, string>();
  if (macField) fieldMap.set(FIELD_CODES.MAC, macField.id);
  fieldMap.set(FIELD_CODES.EXT, extField.id);

  for (const [idx, fieldCode] of Object.keys(FIELD_CODES).entries()) {
    const fieldId = fieldMap.get(
      FIELD_CODES[fieldCode as keyof typeof FIELD_CODES],
    );
    if (!fieldId) continue;

    const existing = await prisma.assetCategoryField.findFirst({
      where: {
        assetCategoryId: category.id,
        fieldDefinitionId: fieldId,
      },
    });

    if (!existing && !DRY_RUN) {
      await prisma.assetCategoryField.create({
        data: {
          assetCategoryId: category.id,
          fieldDefinitionId: fieldId,
          uiOrder: idx + 1,
        },
      });
    }
  }

  return category;
}

function parseCsv(): CsvRow[] {
  const raw = readFileSync(DATA_FILE, "utf-8");
  const result = Papa.parse<CsvRow>(raw, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    throw new Error(
      `CSV parse errors: ${result.errors
        .map((e) => `${e.row}:${e.message}`)
        .join(", ")}`,
    );
  }

  return result.data;
}

function buildAssetTag(ext: string, mac: string, index: number): string {
  if (ext) return `TEL-${ext}`;
  if (mac) return `TEL-${mac.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}`;
  return `TEL-AUTO-${index}`;
}

async function importTelephones() {
  console.log("☎️  Telephone Asset Import");
  console.log("=".repeat(80));
  if (DRY_RUN) {
    console.log("⚠️  DRY RUN - no changes will be persisted\n");
  }

  const category = await ensureTelephoneCategory();
  const rows = parseCsv();

  let created = 0;
  let updated = 0;
  let assignments = 0;
  const missingPersons: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const mac = (row["Mac Address IP Phone"] || "").trim();
    const ext = (row["Ext no"] || "").trim();
    const name = (row.Name || "").trim();
    const email = (row.Email || "").trim();

    if (!mac && !ext) {
      console.warn(`Skipping row ${i + 1} (${name}) - missing MAC and Ext`);
      continue;
    }

    const assetTag = buildAssetTag(ext, mac, i + 1);

    const attributes: Record<string, unknown> = {};
    if (mac) attributes[FIELD_CODES.MAC] = mac;
    if (ext) attributes[FIELD_CODES.EXT] = ext;

    const existing = await prisma.asset.findUnique({
      where: { assetTag },
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
            assetCategoryId: category.id,
            serialNumber: mac || null,
            attributes: toPrismaJson(attributes),
          },
        });
        assetId = createdAsset.id;
      } else {
        assetId = `dry-${assetTag}`;
      }
      created++;
    }

    if (email) {
      const person = await prisma.person.findFirst({
        where: {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
      });

      if (person) {
        const alreadyAssigned = existing?.assetAssignments?.some(
          (a) =>
            a.assigneeType === "PERSON" &&
            a.assigneeId === person.id &&
            a.endDate === null,
        );

        if (!alreadyAssigned && !DRY_RUN) {
          await prisma.assetAssignment.create({
            data: {
              assetId,
              assigneeType: "PERSON",
              assigneeId: person.id,
              startDate: new Date(),
              isPrimary: true,
            },
          });
        }
        assignments++;
      } else {
        missingPersons.push(`${name} <${email}>`);
      }
    }
  }

  console.log("\nSummary");
  console.log("-------");
  console.log(`Assets created: ${created}`);
  console.log(`Assets updated: ${updated}`);
  console.log(`Assignments created: ${assignments}`);
  if (missingPersons.length) {
    console.log(`Missing persons (${missingPersons.length}):`);
    missingPersons.forEach((m) => console.log(` - ${m}`));
  }

  if (DRY_RUN) {
    console.log("\n⚠️  DRY RUN - no database changes were made");
  }
}

importTelephones()
  .then(() => {
    console.log("\n✅ Import completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Import failed:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
