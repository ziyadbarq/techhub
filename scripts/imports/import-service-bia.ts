/**
 * Import Service BIA metadata from:
 * - apps.csv
 * - BIA_Managed_Internal.csv
 * - Business_RTO_RPO.csv
 *
 * Enhances existing Service records:
 * - Sets dataConfidentiality, businessImpactLevel, criticality (best-effort)
 * - Stores raw BIA/RTO/RPO fields in metadata.bia
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/import-service-bia.ts
 *   npx dotenv -e .env.local -- npx tsx scripts/import-service-bia.ts --dry-run
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import Papa from "papaparse";
import { prisma } from "../../src/infrastructure/database/prisma/client.js";
import { mergePrismaJson } from "./utils/prisma-json.js";

const DRY_RUN = process.argv.includes("--dry-run");
const DATA_DIR = join(process.cwd(), "local/barq-data");

type EnvCrit = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type Impact = "LOW" | "MEDIUM" | "HIGH";
type Conf = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";

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

function stripCommonWords(name: string): string {
  let n = name.toLowerCase();
  const words = ["service", "portal", "app", "application"];
  for (const w of words) {
    n = n.replace(new RegExp(`\\b${w}\\b`, "g"), "");
  }
  return n;
}

function makeServiceKeys(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const base = raw.trim();
  const parts = base.split("/");
  const last = parts[parts.length - 1];

  const candidates = [
    base,
    last,
    stripCommonWords(base),
    stripCommonWords(last),
  ];

  return Array.from(
    new Set(
      candidates
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, "")),
    ),
  );
}

function mapSensitivityToConf(raw: string | null | undefined): Conf | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === "sensitive") return "CONFIDENTIAL";
  if (v === "medium") return "INTERNAL";
  if (v === "low") return "PUBLIC";
  return "INTERNAL";
}

function mapBiaToCriticality(raw: string | null | undefined): EnvCrit | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === "critical") return "CRITICAL";
  if (v === "important") return "HIGH";
  if (v.includes("non") || v === "not critical") return "LOW";
  return "MEDIUM";
}

function mapServiceValueToImpact(
  raw: string | null | undefined,
): Impact | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === "critical") return "HIGH";
  if (v === "important") return "MEDIUM";
  if (v.includes("non") || v === "not critical") return "LOW";
  return "MEDIUM";
}

async function loadServiceKeyMap() {
  const services = await prisma.service.findMany({
    select: { id: true, name: true, metadata: true },
  });

  const map = new Map<string, { id: string; name: string }>();

  for (const s of services) {
    const keys = makeServiceKeys(s.name);
    for (const k of keys) {
      if (!map.has(k)) {
        map.set(k, { id: s.id, name: s.name });
      }
    }
  }

  return map;
}

async function updateServiceBia(
  serviceId: string,
  patch: {
    conf?: Conf | null;
    impact?: Impact | null;
    crit?: EnvCrit | null;
    biaFragment: Record<string, unknown>;
  },
) {
  if (DRY_RUN) return;

  const svc = await prisma.service.findUnique({
    where: { id: serviceId },
    select: {
      metadata: true,
      dataConfidentiality: true,
      businessImpactLevel: true,
      criticality: true,
    },
  });
  if (!svc) return;

  const metadata = (svc.metadata as Record<string, unknown> | null) || {};
  const bia = (metadata.bia as Record<string, unknown> | null) || {};

  const mergedBia = { ...bia, ...patch.biaFragment };
  const mergedMetadata = mergePrismaJson(svc.metadata, {
    ...metadata,
    bia: mergedBia,
  });

  await prisma.service.update({
    where: { id: serviceId },
    data: {
      dataConfidentiality: patch.conf ?? svc.dataConfidentiality ?? undefined,
      businessImpactLevel: patch.impact ?? svc.businessImpactLevel ?? undefined,
      criticality: patch.crit ?? svc.criticality ?? undefined,
      metadata: mergedMetadata,
    },
  });
}

async function importAppsBia(
  serviceKeyMap: Map<string, { id: string; name: string }>,
) {
  type Row = {
    Service: string;
    "Service Description": string;
    "Service Owner": string;
    "Service Value": string;
    Process: string;
    "Process Description": string;
    Department: string;
    "Process Value": string;
    "Information Asset": string;
    "Asset Type": string;
    "Asset Value": string;
    "Asset Location": string;
    "Asset Owner": string;
    "Sensitivity Value": string;
    BIA: string;
  };

  const rows = parseCsv<Row>("apps.csv");

  let matched = 0;
  let unmatched = 0;

  for (const row of rows) {
    const candidates = [
      ...makeServiceKeys(row.Service),
      ...makeServiceKeys(row["Information Asset"]),
    ];
    let found: { id: string; name: string } | null = null;
    for (const key of candidates) {
      const svc = serviceKeyMap.get(key);
      if (svc) {
        found = svc;
        break;
      }
    }
    if (!found) {
      unmatched++;
      continue;
    }

    const conf = mapSensitivityToConf(row["Sensitivity Value"]);
    const crit = mapBiaToCriticality(row.BIA || row["Service Value"]);
    const impact = mapServiceValueToImpact(row["Service Value"]);

    const biaFragment: Record<string, unknown> = {
      serviceDescription: row["Service Description"] || null,
      serviceOwnerRaw: row["Service Owner"] || null,
      serviceValue: row["Service Value"] || null,
      process: row.Process || null,
      processDescription: row["Process Description"] || null,
      department: row.Department || null,
      processValue: row["Process Value"] || null,
      informationAsset: row["Information Asset"] || null,
      assetType: row["Asset Type"] || null,
      assetValue: row["Asset Value"] || null,
      assetLocation: row["Asset Location"] || null,
      assetOwnerRaw: row["Asset Owner"] || null,
      sensitivityValue: row["Sensitivity Value"] || null,
      biaCategory: row.BIA || null,
    };

    await updateServiceBia(found.id, {
      conf,
      impact,
      crit,
      biaFragment,
    });
    matched++;
  }

  return { matched, unmatched };
}

async function importInternalBia(
  serviceKeyMap: Map<string, { id: string; name: string }>,
) {
  type Row = {
    Service: string;
    "Service Description": string;
    "Service Owner": string;
    "Service Value": string;
    Process: string;
    "Process Description": string;
    Department: string;
    "Process Value": string;
    "Information Asset": string;
    "Asset Type": string;
    "Asset Value": string;
    "Asset Location": string;
    "Asset Owner": string;
    "Sensitivity Value": string;
    BIA: string;
    Managed: string;
  };

  const rows = parseCsv<Row>("BIA_Managed_Internal.csv");

  let matched = 0;
  let unmatched = 0;

  for (const row of rows) {
    const candidates = [
      ...makeServiceKeys(row.Service),
      ...makeServiceKeys(row["Information Asset"]),
    ];
    let found: { id: string; name: string } | null = null;
    for (const key of candidates) {
      const svc = serviceKeyMap.get(key);
      if (svc) {
        found = svc;
        break;
      }
    }
    if (!found) {
      unmatched++;
      continue;
    }

    const conf = mapSensitivityToConf(row["Sensitivity Value"]);
    const crit = mapBiaToCriticality(row.BIA || row["Service Value"]);
    const impact = mapServiceValueToImpact(row["Service Value"]);

    const biaFragment: Record<string, unknown> = {
      internalService: true,
      serviceDescriptionInternal: row["Service Description"] || null,
      managedType: row.Managed || null,
      serviceOwnerInternalRaw: row["Service Owner"] || null,
      serviceValueInternal: row["Service Value"] || null,
      processInternal: row.Process || null,
      processDescriptionInternal: row["Process Description"] || null,
      departmentInternal: row.Department || null,
      processValueInternal: row["Process Value"] || null,
      informationAssetInternal: row["Information Asset"] || null,
      assetTypeInternal: row["Asset Type"] || null,
      assetValueInternal: row["Asset Value"] || null,
      assetLocationInternal: row["Asset Location"] || null,
      assetOwnerInternalRaw: row["Asset Owner"] || null,
      sensitivityValueInternal: row["Sensitivity Value"] || null,
      biaCategoryInternal: row.BIA || null,
    };

    await updateServiceBia(found.id, {
      conf,
      impact,
      crit,
      biaFragment,
    });
    matched++;
  }

  return { matched, unmatched };
}

async function importRtoRpo(
  serviceKeyMap: Map<string, { id: string; name: string }>,
) {
  type Row = {
    No: string;
    "Information Asset": string;
    Department: string;
    "Asset Type": string;
    "Maximum Acceptable Outage": string;
    "RPO ": string;
    "RTO  ": string;
    BIA: string;
  };

  const rows = parseCsv<Row>("Business_RTO_RPO.csv");

  let matched = 0;
  let unmatched = 0;

  for (const row of rows) {
    const candidates = makeServiceKeys(row["Information Asset"]);
    let found: { id: string; name: string } | null = null;
    for (const key of candidates) {
      const svc = serviceKeyMap.get(key);
      if (svc) {
        found = svc;
        break;
      }
    }
    if (!found) {
      unmatched++;
      continue;
    }

    const crit = mapBiaToCriticality(row.BIA);

    const biaFragment: Record<string, unknown> = {
      maxAcceptableOutage: row["Maximum Acceptable Outage"] || null,
      rpo: row["RPO "] || null,
      rto: row["RTO  "] || null,
      rtoDepartment: row.Department || null,
      rtoAssetType: row["Asset Type"] || null,
      biaCategoryRto: row.BIA || null,
    };

    await updateServiceBia(found.id, {
      crit,
      biaFragment,
    });
    matched++;
  }

  return { matched, unmatched };
}

async function main() {
  console.log("📈 Importing Service BIA metadata");
  if (DRY_RUN) {
    console.log("⚠️  DRY RUN - no changes will be persisted\n");
  }

  const serviceKeyMap = await loadServiceKeyMap();

  const apps = await importAppsBia(serviceKeyMap);
  const internal = await importInternalBia(serviceKeyMap);
  const rto = await importRtoRpo(serviceKeyMap);

  console.log("\nSummary");
  console.log("-------");
  console.log(
    `apps.csv:             matched ${apps.matched}, unmatched ${apps.unmatched}`,
  );
  console.log(
    `BIA_Managed_Internal:  matched ${internal.matched}, unmatched ${internal.unmatched}`,
  );
  console.log(
    `Business_RTO_RPO.csv:  matched ${rto.matched}, unmatched ${rto.unmatched}`,
  );

  if (DRY_RUN) {
    console.log("\n⚠️  DRY RUN - no database changes were made");
  }
}

main()
  .then(() => {
    console.log("\n✅ Service BIA import completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Service BIA import failed:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
