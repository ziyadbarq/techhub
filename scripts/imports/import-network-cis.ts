/**
 * Import OCI/onPrem network data as Configuration Items (CIs)
 *
 * Maps Nework_Assets.json into CI classes with attributes:
 * - OCI sections: OCI_ID, OCI_TYPE, CREATED_AT, name->note
 * - OnPrem/Offsite: IP_ADDR, SERIAL, MODEL, SKU, QUANTITY, PRODUCT_DESC, DESC, CREATED_AT
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/import-network-cis.ts
 *   npx dotenv -e .env.local -- npx tsx scripts/import-network-cis.ts --dry-run
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../../src/infrastructure/database/prisma/client.js";
import { mergePrismaJson, toPrismaJson } from "./utils/prisma-json.js";

const DRY_RUN = process.argv.includes("--dry-run");
const DATA_FILE = join(process.cwd(), "local/barq-data/Nework_Assets.json");

type NetworkAssetInput = {
  name?: string | null;
  desc?: string | null;
  productDescription?: string | null;
  model?: string | null;
  ip?: string | null;
  id?: string | null;
  serial?: string | null;
  timeCreated?: string | null;
  sku?: string | null;
  quantity?: number | null;
};

type NetworkAssetsFile = {
  ociCloud?: Record<string, NetworkAssetInput[]>;
  onPrem?: Record<string, NetworkAssetInput[]>;
  offsite?: Record<string, NetworkAssetInput[]>;
};

const CI_CLASS_MAP: Record<string, string> = {
  networkFirewalls: "Firewall",
  networkLoadBalancers: "Load Balancer",
  applicationLoadBalancers: "Load Balancer",
  vcns: "Subnet",
  siteToSiteVpn: "VPN Gateway",
  mplsFastconnect: "VPN Gateway",
  dynamicRoutingGateways: "VPN Gateway",
  "onPrem.routers": "Network Device",
  "onPrem.switches": "Network Device",
  "onPrem.firewalls": "Firewall",
  "onPrem.wifi": "Network Device",
  "offsite.routers": "Network Device",
};

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "unnamed"
  );
}

function loadData(): Array<{ type: string; item: NetworkAssetInput }> {
  const raw = readFileSync(DATA_FILE, "utf-8");
  const parsed = JSON.parse(raw) as NetworkAssetsFile;
  const entries: Array<{ type: string; item: NetworkAssetInput }> = [];

  if (parsed.ociCloud) {
    for (const [type, list] of Object.entries(parsed.ociCloud)) {
      if (!Array.isArray(list)) continue;
      for (const item of list) entries.push({ type, item });
    }
  }
  if (parsed.onPrem) {
    for (const [type, list] of Object.entries(parsed.onPrem)) {
      if (!Array.isArray(list)) continue;
      for (const item of list) entries.push({ type: `onPrem.${type}`, item });
    }
  }
  if (parsed.offsite) {
    for (const [type, list] of Object.entries(parsed.offsite)) {
      if (!Array.isArray(list)) continue;
      for (const item of list) entries.push({ type: `offsite.${type}`, item });
    }
  }
  return entries;
}

async function ensureCiClasses(): Promise<Map<string, string>> {
  const classMap = new Map<string, string>();
  for (const [type, className] of Object.entries(CI_CLASS_MAP)) {
    const ciClass = await prisma.cIClass.upsert({
      where: { name: className },
      update: {},
      create: {
        name: className,
        code: slugify(className).toUpperCase(),
        description: `${className} imported from network assets`,
      },
    });
    classMap.set(type, ciClass.id);
  }
  return classMap;
}

function buildCiCode(
  name: string | null,
  id: string | null,
  type: string,
  index: number,
): string {
  const base = name || id || `${type}-${index}`;
  return slugify(base).toUpperCase();
}

async function importCIs() {
  console.log("📡 Importing network data as CIs");
  if (DRY_RUN) console.log("⚠️  DRY RUN - no changes will be persisted\n");

  const classIdMap = await ensureCiClasses();
  const entries = loadData();

  let created = 0;
  let updated = 0;

  for (let i = 0; i < entries.length; i++) {
    const { type, item } = entries[i];
    const ciClassId = classIdMap.get(type);
    if (!ciClassId) continue;

    const name =
      item.name?.trim?.() ||
      item.desc?.trim?.() ||
      item.productDescription?.trim?.() ||
      item.model?.trim?.() ||
      item.ip?.trim?.() ||
      null;
    const ociId = item.id?.trim?.() || null;
    const serial = item.serial?.trim?.() || null;
    const ip = item.ip?.trim?.() || null;
    const createdAt = item.timeCreated || null;
    const code = buildCiCode(name, ociId || serial || ip, type, i + 1);

    const attributes: Record<string, unknown> = {};
    if (createdAt) attributes.CREATED_AT = createdAt;
    if (ociId) attributes.OCI_ID = ociId;
    attributes.CI_TYPE = type;
    if (serial) attributes.SERIAL = serial;
    if (ip) attributes.IP_ADDR = ip;
    if (item.model) attributes.MODEL = item.model;
    if (item.productDescription)
      attributes.PRODUCT_DESC = item.productDescription;
    if (item.sku !== undefined) attributes.SKU = item.sku;
    if (item.quantity !== undefined) attributes.QUANTITY = item.quantity;

    const existing = await prisma.configurationItem.findUnique({
      where: { ciKey: code },
      select: { id: true, attributes: true },
    });

    if (existing) {
      if (!DRY_RUN) {
        const mergedAttributes = mergePrismaJson(
          existing.attributes,
          attributes,
        );
        await prisma.configurationItem.update({
          where: { id: existing.id },
          data: {
            name: name || code,
            attributes: mergedAttributes,
          },
        });
      }
      updated++;
      continue;
    }

    if (!DRY_RUN) {
      await prisma.configurationItem.create({
        data: {
          name: name || code,
          ciKey: code,
          ciClassId,
          attributes: toPrismaJson(attributes),
        },
      });
    }
    created++;
  }

  console.log("\nSummary");
  console.log("-------");
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  if (DRY_RUN) console.log("⚠️  DRY RUN - no database changes were made");
}

importCIs()
  .then(() => {
    console.log("\n✅ CI import completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ CI import failed:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
