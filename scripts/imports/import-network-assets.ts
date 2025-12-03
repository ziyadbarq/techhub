/**
 * Import OCI Network Assets
 *
 * Reads local/barq-data/Nework_Assets.json and creates assets in the
 * NETWORK category. Each asset uses a stable assetTag derived from the
 * name, stores OCI id/timeCreated as attributes, and is idempotent.
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/import-network-assets.ts
 *   npx dotenv -e .env.local -- npx tsx scripts/import-network-assets.ts --dry-run
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../../src/infrastructure/database/prisma/client.js";
import { mergePrismaJson, toPrismaJson } from "./utils/prisma-json.js";

const DRY_RUN = process.argv.includes("--dry-run");
const DATA_FILE = join(process.cwd(), "local/barq-data/Nework_Assets.json");

const TYPE_MAPPINGS: Record<
  string,
  { code: string; name: string; prefix: string }
> = {
  networkFirewalls: {
    code: "NET_FIREWALL",
    name: "Network Firewalls",
    prefix: "FW-",
  },
  networkLoadBalancers: {
    code: "NET_LB",
    name: "Network Load Balancers",
    prefix: "NLB-",
  },
  applicationLoadBalancers: {
    code: "APP_LB",
    name: "Application Load Balancers",
    prefix: "ALB-",
  },
  vcns: {
    code: "VCN",
    name: "Virtual Cloud Networks",
    prefix: "VCN-",
  },
  siteToSiteVpn: {
    code: "VPN",
    name: "Site-to-Site VPN",
    prefix: "VPN-",
  },
  mplsFastconnect: {
    code: "MPLS_FC",
    name: "MPLS / FastConnect",
    prefix: "MPLS-",
  },
  dynamicRoutingGateways: {
    code: "DRG",
    name: "Dynamic Routing Gateways",
    prefix: "DRG-",
  },
};

const ONPREM_MAPPINGS: Record<
  string,
  { code: string; name: string; prefix: string }
> = {
  routers: {
    code: "ONPREM_ROUTER",
    name: "On-Prem Routers",
    prefix: "ONP-RTR-",
  },
  switches: {
    code: "ONPREM_SWITCH",
    name: "On-Prem Switches",
    prefix: "ONP-SW-",
  },
  firewalls: {
    code: "ONPREM_FIREWALL",
    name: "On-Prem Firewalls",
    prefix: "ONP-FW-",
  },
  wifi: { code: "WIFI_AP", name: "Wi-Fi Access Points", prefix: "WIFI-" },
};

const OFFSITE_MAPPINGS: Record<
  string,
  { code: string; name: string; prefix: string }
> = {
  routers: {
    code: "OFFSITE_ROUTER",
    name: "Offsite Routers",
    prefix: "OFF-RTR-",
  },
};

type NetworkAsset = {
  name: string | null;
  id: string | null;
  timeCreated?: string | null;
};

type AssetInput = {
  name?: string | null;
  desc?: string | null;
  productDescription?: string | null;
  model?: string | null;
  ip?: string | null;
  serial?: string | null;
  timeCreated?: string | null;
  sku?: string | null;
  quantity?: number | null;
  id?: string | null;
};

type ParsedAsset = NetworkAsset & AssetInput;

type NetworkAssetsFile = {
  ociCloud?: Record<string, ParsedAsset[]>;
  onPrem?: Record<string, ParsedAsset[]>;
  offsite?: Record<string, ParsedAsset[]>;
};

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "unnamed"
  );
}

function loadData(): { type: string; item: ParsedAsset }[] {
  const raw = readFileSync(DATA_FILE, "utf-8");
  const parsed = JSON.parse(raw) as NetworkAssetsFile;
  const entries: { type: string; item: ParsedAsset }[] = [];

  if (parsed.ociCloud) {
    for (const [type, list] of Object.entries(parsed.ociCloud)) {
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        entries.push({ type, item });
      }
    }
  }

  if (parsed.onPrem) {
    for (const [type, list] of Object.entries(parsed.onPrem)) {
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        entries.push({ type: `onPrem.${type}`, item });
      }
    }
  }

  if (parsed.offsite) {
    for (const [type, list] of Object.entries(parsed.offsite)) {
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        entries.push({ type: `offsite.${type}`, item });
      }
    }
  }

  return entries;
}

async function ensureCategories(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const [type, cfg] of Object.entries(TYPE_MAPPINGS)) {
    const cat = await prisma.assetCategory.upsert({
      where: { code: cfg.code },
      create: { code: cfg.code, name: cfg.name, description: cfg.name },
      update: {},
    });
    map.set(type, cat.id);
  }
  for (const [type, cfg] of Object.entries(ONPREM_MAPPINGS)) {
    const cat = await prisma.assetCategory.upsert({
      where: { code: cfg.code },
      create: { code: cfg.code, name: cfg.name, description: cfg.name },
      update: {},
    });
    map.set(`onPrem.${type}`, cat.id);
  }
  for (const [type, cfg] of Object.entries(OFFSITE_MAPPINGS)) {
    const cat = await prisma.assetCategory.upsert({
      where: { code: cfg.code },
      create: { code: cfg.code, name: cfg.name, description: cfg.name },
      update: {},
    });
    map.set(`offsite.${type}`, cat.id);
  }
  return map;
}

function buildAssetTag(
  name: string | null,
  id: string | null,
  type: string,
  index: number,
): string {
  const prefix =
    TYPE_MAPPINGS[type]?.prefix ||
    ONPREM_MAPPINGS[type.replace("onPrem.", "")]?.prefix ||
    OFFSITE_MAPPINGS[type.replace("offsite.", "")]?.prefix ||
    "NET-";
  if (name) return `${prefix}${slugify(name)}`;
  if (id) return `${prefix}${slugify(id)}`;
  return `${prefix}AUTO-${type.toUpperCase()}-${index}`;
}

async function importNetworkAssets() {
  console.log("🌐 Importing OCI network assets");
  if (DRY_RUN) {
    console.log("⚠️  DRY RUN - no changes will be persisted\n");
  }

  const categoryMap = await ensureCategories();
  // Resolve lifecycle state "Deployed"
  const deployedState = await prisma.lifecycleState.findFirst({
    where: { code: "DEPLOYED" },
    select: { id: true },
  });
  if (!deployedState) {
    throw new Error("Lifecycle state 'DEPLOYED' not found");
  }

  const entries = loadData();

  let created = 0;
  let updated = 0;

  for (let i = 0; i < entries.length; i++) {
    const { type, item } = entries[i];
    const name =
      item.name?.trim() ||
      item.desc?.trim() ||
      item.productDescription?.trim() ||
      item.model?.trim() ||
      item.ip?.trim() ||
      null;
    const ociId = item.id?.trim?.() || null;
    const serial = item.serial?.trim?.() || null;
    const createdAt = item.timeCreated || null;

    const categoryId =
      categoryMap.get(type) ??
      (
        await prisma.assetCategory.findFirst({
          where: { code: "NETWORK" },
          select: { id: true },
        })
      )?.id;

    if (!categoryId) {
      throw new Error(`No category found for type ${type}`);
    }

    const tagSource = type === "onPrem.wifi" ? serial || item.ip || name : name;
    const assetTag = buildAssetTag(
      tagSource,
      ociId || serial,
      type,
      i + 1,
    ).toUpperCase();
    const attributes: Record<string, unknown> = {};
    if (createdAt) attributes.CREATED_AT = createdAt;

    if (type.startsWith("onPrem.")) {
      if (item.ip) attributes.IP_ADDR = item.ip;
      if (item.desc) attributes.DESC = item.desc;
      if (item.productDescription)
        attributes.PRODUCT_DESC = item.productDescription;
      if (item.model) attributes.MODEL = item.model;
      if (serial) attributes.SERIAL = serial;
    } else if (type.startsWith("offsite.")) {
      if (item.productDescription)
        attributes.PRODUCT_DESC = item.productDescription;
      if (item.sku) attributes.SKU = item.sku;
      if (item.model) attributes.MODEL = item.model;
      if (item.quantity !== undefined) attributes.QUANTITY = item.quantity;
    } else {
      // OCI
      attributes.OCI_ID = ociId;
      attributes.OCI_TYPE = type;
      attributes.OCI_CREATED_AT = createdAt;
    }

    const existing = await prisma.asset.findFirst({
      where: {
        OR: [
          { assetTag },
          ...(ociId ? [{ serialNumber: ociId }] : []),
          ...(serial ? [{ serialNumber: serial }] : []),
        ],
      },
      select: { id: true, attributes: true, assetTag: true },
    });

    if (existing) {
      if (!DRY_RUN) {
        const mergedAttributes = mergePrismaJson(
          existing.attributes,
          attributes,
        );
        await prisma.asset.update({
          where: { id: existing.id },
          data: {
            attributes: mergedAttributes,
          },
        });
      }
      updated++;
      continue;
    }

    if (!DRY_RUN) {
      await prisma.asset.create({
        data: {
          assetTag,
          assetCategoryId: categoryId,
          lifecycleStateId: deployedState.id,
          serialNumber: ociId || serial || null,
          note: name || undefined,
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
  if (DRY_RUN) {
    console.log("⚠️  DRY RUN - no database changes were made");
  }
}

importNetworkAssets()
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
