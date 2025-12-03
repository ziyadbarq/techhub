/**
 * Import Cloud Infrastructure as Configuration Items (CIs)
 *
 * Sources:
 * - local/barq-data/Compartments.csv
 * - local/barq-data/VMs.csv
 * - local/barq-data/compute_VMs.csv
 * - local/barq-data/DB.csv
 * - local/barq-data/oke_clusters.csv
 * - local/barq-data/oci_cache_clusters.csv
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/import-cloud-cis.ts
 *   npx dotenv -e .env.local -- npx tsx scripts/import-cloud-cis.ts --dry-run
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import Papa from "papaparse";
import { prisma } from "../../src/infrastructure/database/prisma/client.js";
import { mergePrismaJson, toPrismaJson } from "../utils/prisma-json.js";

const DRY_RUN = process.argv.includes("--dry-run");

const DATA_DIR = join(process.cwd(), "local/barq-data");

type Env = "PROD" | "UAT" | "DEV" | "DR" | "TEST" | "OTHER";
type Crit = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

function mapEnv(raw: string | null | undefined): Env | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v.includes("prod")) return "PROD";
  if (v.includes("uat")) return "UAT";
  if (v.includes("dev")) return "DEV";
  if (v.includes("dr")) return "DR";
  if (v.includes("test")) return "TEST";
  return "OTHER";
}

function mapCriticality(raw: string | null | undefined): Crit | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === "critical") return "CRITICAL";
  if (v === "high" || v === "important") return "HIGH";
  if (v === "non critical" || v === "low") return "LOW";
  return "MEDIUM";
}

function parseCsv<T extends Record<string, unknown>>(fileName: string): T[] {
  const full = join(DATA_DIR, fileName);
  const raw = readFileSync(full, "utf-8");
  const result = Papa.parse<T>(raw, {
    header: true,
    skipEmptyLines: true,
  });
  if (result.errors.length > 0) {
    throw new Error(
      `${fileName} parse errors: ${result.errors
        .map((e) => `${e.row}:${e.message}`)
        .join(", ")}`,
    );
  }
  return result.data;
}

async function getCiClassId(name: string): Promise<string> {
  const ciClass = await prisma.cIClass.findUnique({
    where: { name },
    select: { id: true },
  });
  if (!ciClass) {
    throw new Error(`CIClass '${name}' not found. Ensure seeds ran.`);
  }
  return ciClass.id;
}

async function upsertCI(opts: {
  ciClassId: string;
  ciKey: string;
  name: string;
  environment?: Env | null;
  criticality?: Crit | null;
  attributes: Record<string, unknown>;
}) {
  const { ciClassId, ciKey, name, environment, criticality, attributes } = opts;

  const existing = await prisma.configurationItem.findUnique({
    where: { ciKey },
    select: { id: true, attributes: true },
  });

  if (existing) {
    if (DRY_RUN) return { created: false, updated: false };
    const mergedAttributes = mergePrismaJson(existing.attributes, attributes);
    await prisma.configurationItem.update({
      where: { id: existing.id },
      data: {
        name,
        environment: environment ?? undefined,
        criticality: criticality ?? undefined,
        attributes: mergedAttributes,
      },
    });
    return { created: false, updated: true };
  }

  if (DRY_RUN) return { created: false, updated: false };

  await prisma.configurationItem.create({
    data: {
      ciClassId,
      ciKey,
      name,
      environment: environment ?? undefined,
      criticality: criticality ?? undefined,
      attributes: toPrismaJson(attributes),
    },
  });

  return { created: true, updated: false };
}

async function importCompartments(): Promise<{
  created: number;
  updated: number;
}> {
  const rows = parseCsv<{
    "Display name": string;
    OCID: string;
    Compartment: string;
    Status: string;
    "Time created": string;
    Level: string;
    CostCenter: string;
    Dep: string;
    env: string;
  }>("Compartments.csv");

  const ciClassId = await getCiClassId("Cloud Compartment");
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const name = row["Display name"]?.trim() || row.OCID;
    const ocid = row.OCID?.trim();
    if (!ocid) continue;

    const ciKey = ocid;
    const environment = mapEnv(row.env);
    const attributes: Record<string, unknown> = {
      OCI_ID: ocid,
      PARENT_COMPARTMENT_ID: row.Compartment || null,
      STATUS: row.Status || null,
      RAW_TIME_CREATED: row["Time created"] || null,
      LEVEL: row.Level || null,
      COST_CENTER: row.CostCenter || null,
      DEPARTMENT: row.Dep || null,
      ENV_RAW: row.env || null,
    };

    const res = await upsertCI({
      ciClassId,
      ciKey,
      name,
      environment,
      attributes,
    });
    if (res.created) created++;
    if (res.updated) updated++;
  }

  return { created, updated };
}

async function importVMs(): Promise<{ created: number; updated: number }> {
  type VMsRow = {
    display_name: string;
    status: string;
    private_ip: string;
    compartment_name: string;
    vm_ocid: string;
    time_created: string;
    Criticality: string;
  };

  type ComputeRow = {
    display_name: string;
    Running: string;
    IP: string;
    Type: string;
    compartment_name: string;
    Reginos: string;
    Asset_ocid: string;
    compartment_ocid: string;
    time_created: string;
    BIA: string;
  };

  const vms = parseCsv<VMsRow>("VMs.csv");
  const compute = parseCsv<ComputeRow>("compute_VMs.csv");

  const vmClassId = await getCiClassId("Virtual Machine");

  type VMInfo = {
    displayName?: string;
    status?: string;
    privateIp?: string;
    compartmentName?: string;
    compartmentOcid?: string;
    region?: string;
    createdAt?: string;
    criticalityRaw?: string;
    envHint?: string;
  };

  const byOcid = new Map<string, VMInfo>();

  for (const row of vms) {
    const ocid = row.vm_ocid?.trim();
    if (!ocid) continue;
    const existing: VMInfo = byOcid.get(ocid) ?? {};
    byOcid.set(ocid, {
      ...existing,
      displayName: row.display_name || existing.displayName || ocid,
      status: row.status || existing.status,
      privateIp: row.private_ip || existing.privateIp,
      compartmentName: row.compartment_name || existing.compartmentName,
      createdAt: row.time_created || existing.createdAt,
      criticalityRaw: row.Criticality || existing.criticalityRaw,
      envHint: row.compartment_name || existing.envHint,
    });
  }

  for (const row of compute) {
    const ocid = row.Asset_ocid?.trim();
    if (!ocid) continue;
    const existing: VMInfo = byOcid.get(ocid) ?? {};
    byOcid.set(ocid, {
      ...existing,
      displayName: row.display_name || existing.displayName || ocid,
      privateIp: row.IP || existing.privateIp,
      compartmentName: row.compartment_name || existing.compartmentName,
      compartmentOcid: row.compartment_ocid || existing.compartmentOcid,
      region: row.Reginos || existing.region,
      createdAt: row.time_created || existing.createdAt,
      criticalityRaw: row.BIA || existing.criticalityRaw,
      envHint: row.compartment_name || existing.envHint,
    });
  }

  let created = 0;
  let updated = 0;

  for (const [ocid, vm] of byOcid.entries()) {
    const ciKey = ocid;
    const name = vm.displayName || ocid;
    const environment = mapEnv(vm.envHint);
    const crit = mapCriticality(vm.criticalityRaw);

    const attributes: Record<string, unknown> = {
      OCI_ID: ocid,
      STATUS: vm.status || null,
      PRIVATE_IP: vm.privateIp || null,
      COMPARTMENT_NAME: vm.compartmentName || null,
      COMPARTMENT_ID: vm.compartmentOcid || null,
      REGION: vm.region || null,
      CREATED_AT: vm.createdAt || null,
      CRITICALITY_RAW: vm.criticalityRaw || null,
    };

    const res = await upsertCI({
      ciClassId: vmClassId,
      ciKey,
      name,
      environment,
      criticality: crit,
      attributes,
    });
    if (res.created) created++;
    if (res.updated) updated++;
  }

  return { created, updated };
}

async function importDatabases(): Promise<{
  created: number;
  updated: number;
}> {
  const rows = parseCsv<{
    Name: string;
    Status: string;
    IP: string;
    Type: string;
    Compartment: string;
    Reginos: string;
    Asset_id: string;
    Criticality: string;
  }>("DB.csv");

  const dbClassId = await getCiClassId("Database");

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const ocid = row.Asset_id?.trim();
    if (!ocid) continue;
    const ciKey = ocid;
    const name = row.Name?.trim() || ocid;
    const environment = mapEnv(row.Compartment);
    const crit = mapCriticality(row.Criticality);

    const attributes: Record<string, unknown> = {
      OCI_ID: ocid,
      STATUS: row.Status || null,
      IP_ADDR: row.IP || null,
      TYPE_RAW: row.Type || null,
      COMPARTMENT_NAME: row.Compartment || null,
      REGION: row.Reginos || null,
      CRITICALITY_RAW: row.Criticality || null,
    };

    const res = await upsertCI({
      ciClassId: dbClassId,
      ciKey,
      name,
      environment,
      criticality: crit,
      attributes,
    });
    if (res.created) created++;
    if (res.updated) updated++;
  }

  return { created, updated };
}

async function importOkeClusters(): Promise<{
  created: number;
  updated: number;
}> {
  const rows = parseCsv<{
    region: string;
    compartment_name: string;
    compartment_ocid: string;
    cluster_name: string;
    cluster_ocid: string;
    lifecycle_state: string;
    kubernetes_version: string;
    vcn_id: string;
    cni_type: string;
    is_public_api: string;
  }>("oke_clusters.csv");

  const classId = await getCiClassId("Container Platform");
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const ocid = row.cluster_ocid?.trim();
    if (!ocid) continue;
    const ciKey = ocid;
    const name = row.cluster_name?.trim() || ocid;
    const environment = mapEnv(row.compartment_name);

    const attributes: Record<string, unknown> = {
      OCI_ID: ocid,
      REGION: row.region || null,
      COMPARTMENT_NAME: row.compartment_name || null,
      COMPARTMENT_ID: row.compartment_ocid || null,
      LIFECYCLE_STATE: row.lifecycle_state || null,
      KUBERNETES_VERSION: row.kubernetes_version || null,
      VCN_ID: row.vcn_id || null,
      CNI_TYPE: row.cni_type || null,
      IS_PUBLIC_API: row.is_public_api || null,
    };

    const res = await upsertCI({
      ciClassId: classId,
      ciKey,
      name,
      environment,
      attributes,
    });
    if (res.created) created++;
    if (res.updated) updated++;
  }

  return { created, updated };
}

async function importCacheClusters(): Promise<{
  created: number;
  updated: number;
}> {
  const rows = parseCsv<{
    name: string;
    state: string;
    ocid: string;
    Reginos: string;
  }>("oci_cache_clusters.csv");

  const classId = await getCiClassId("Cache");
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const ocid = row.ocid?.trim();
    if (!ocid) continue;
    const ciKey = ocid;
    const name = row.name?.trim() || ocid;
    const environment = mapEnv(row.name);

    const attributes: Record<string, unknown> = {
      OCI_ID: ocid,
      STATUS: row.state || null,
      REGION: row.Reginos || null,
    };

    const res = await upsertCI({
      ciClassId: classId,
      ciKey,
      name,
      environment,
      attributes,
    });
    if (res.created) created++;
    if (res.updated) updated++;
  }

  return { created, updated };
}

async function main() {
  console.log("☁️  Importing cloud infrastructure CIs");
  if (DRY_RUN) {
    console.log("⚠️  DRY RUN - no changes will be persisted\n");
  }

  const [comp, vms, dbs, oke, cache] = await Promise.all([
    importCompartments(),
    importVMs(),
    importDatabases(),
    importOkeClusters(),
    importCacheClusters(),
  ]);

  console.log("\nSummary");
  console.log("-------");
  console.log(`Compartments: created ${comp.created}, updated ${comp.updated}`);
  console.log(`VMs:          created ${vms.created}, updated ${vms.updated}`);
  console.log(`DBs:          created ${dbs.created}, updated ${dbs.updated}`);
  console.log(`OKE:          created ${oke.created}, updated ${oke.updated}`);
  console.log(
    `Cache:        created ${cache.created}, updated ${cache.updated}`,
  );

  if (DRY_RUN) {
    console.log("\n⚠️  DRY RUN - no database changes were made");
  }
}

main()
  .then(() => {
    console.log("\n✅ Cloud CI import completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Cloud CI import failed:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
