/**
 * Compare local OCI snapshot files against OCI-backed Configuration Items in the app DB.
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/imports/compare-oci-data.ts
 *   npx dotenv -e .env.local -- npx tsx scripts/imports/compare-oci-data.ts --dir local/oci-data
 *   npx dotenv -e .env.local -- npx tsx scripts/imports/compare-oci-data.ts --show-missing
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { prisma } from "../../src/infrastructure/database/prisma/client";
import {
  OCI_SERVICE_KEYS,
  type OciServiceKey,
  type OciWebhookResponse,
} from "../../src/core/domain/value-objects/oci-resource.types";
import {
  extractResourceId,
  extractResourceName,
} from "../../src/core/domain/value-objects/oci-service-mapping";
import {
  countOciResponseResources,
  loadValidatedLocalOciServicePayload,
  OCI_LOCAL_DATA_MANIFEST_FILENAME,
  resolveOciLocalDataDir,
} from "../../src/infrastructure/services/oci/oci-local-data";

type SnapshotEntry = {
  ciKey: string;
  name: string;
  serviceKey: OciServiceKey | "compartment";
};

function getCliOption(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }

  return value;
}

function loadManifest(dataDir: string): unknown | null {
  try {
    return JSON.parse(
      readFileSync(resolve(dataDir, OCI_LOCAL_DATA_MANIFEST_FILENAME), "utf8"),
    ) as unknown;
  } catch {
    return null;
  }
}

function flattenSnapshotEntries(
  serviceKey: OciServiceKey,
  response: OciWebhookResponse,
): SnapshotEntry[] {
  const entries: SnapshotEntry[] = [];

  for (const tenancy of response["object Object"]) {
    const compartments = tenancy.services[serviceKey] ?? [];
    for (const compartment of compartments) {
      entries.push({
        ciKey: compartment.id,
        name: compartment.name,
        serviceKey: "compartment",
      });

      for (const region of compartment.regions) {
        for (const item of region.items) {
          entries.push({
            ciKey: extractResourceId(serviceKey, item, compartment.id),
            name: extractResourceName(item),
            serviceKey,
          });
        }
      }
    }
  }

  return entries;
}

function printSample(
  title: string,
  entries: Array<{ ciKey: string; name: string; serviceKey: string }>,
): void {
  if (entries.length === 0) {
    return;
  }

  console.log(`\n${title}`);
  for (const entry of entries.slice(0, 15)) {
    console.log(`- [${entry.serviceKey}] ${entry.name} (${entry.ciKey})`);
  }
  if (entries.length > 15) {
    console.log(`- ... ${entries.length - 15} more`);
  }
}

async function main(): Promise<void> {
  const dataDir = resolve(
    process.cwd(),
    getCliOption("--dir") || resolveOciLocalDataDir(),
  );
  const showMissing = process.argv.includes("--show-missing");
  const manifest = loadManifest(dataDir);

  const localEntries = new Map<string, SnapshotEntry>();
  const localCounts = new Map<string, number>();

  for (const serviceKey of OCI_SERVICE_KEYS) {
    const response = loadValidatedLocalOciServicePayload(serviceKey, dataDir);
    localCounts.set(
      serviceKey,
      countOciResponseResources(response, serviceKey),
    );

    for (const entry of flattenSnapshotEntries(serviceKey, response)) {
      localEntries.set(entry.ciKey, entry);
    }
  }

  const appItems = await prisma.configurationItem.findMany({
    where: {
      deletedAt: null,
      ciKey: {
        not: null,
      },
    },
    select: {
      ciKey: true,
      name: true,
      attributes: true,
      ciClass: {
        select: {
          code: true,
        },
      },
      lifecycleState: {
        select: {
          name: true,
        },
      },
    },
  });

  const appOciItems = appItems
    .map((item) => {
      const attributes = (item.attributes ?? {}) as Record<string, unknown>;
      const serviceKey = attributes.OCI_SERVICE_TYPE;
      const isCloudCompartment =
        item.ciClass.code === "CLOUD_COMPARTMENT" &&
        (item.ciKey?.startsWith("ocid1.compartment") ?? false);

      if (
        !isCloudCompartment &&
        serviceKey !== "compartment" &&
        !OCI_SERVICE_KEYS.includes(serviceKey as OciServiceKey)
      ) {
        return null;
      }

      return {
        ciKey: item.ciKey ?? "",
        name: item.name,
        lifecycleState: item.lifecycleState?.name ?? null,
        serviceKey: isCloudCompartment ? "compartment" : String(serviceKey),
        sourceStatus: String(attributes.OCI_SOURCE_STATUS ?? "unknown"),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const appEntries = new Map(appOciItems.map((item) => [item.ciKey, item]));
  const missingInApp = [...localEntries.values()].filter(
    (entry) => !appEntries.has(entry.ciKey),
  );
  const extraInApp = appOciItems.filter(
    (entry) => !localEntries.has(entry.ciKey),
  );
  const retiredInApp = extraInApp.filter(
    (entry) =>
      entry.sourceStatus === "missing" || entry.lifecycleState === "Retired",
  );

  const rows = [
    ...OCI_SERVICE_KEYS.map((serviceKey) => {
      const localCount = localCounts.get(serviceKey) ?? 0;
      const appCount = appOciItems.filter(
        (entry) => entry.serviceKey === serviceKey,
      ).length;

      return {
        service: serviceKey,
        local: localCount,
        app: appCount,
        delta: appCount - localCount,
      };
    }),
    {
      service: "compartment",
      local: [...localEntries.values()].filter(
        (entry) => entry.serviceKey === "compartment",
      ).length,
      app: appOciItems.filter((entry) => entry.serviceKey === "compartment")
        .length,
      delta:
        appOciItems.filter((entry) => entry.serviceKey === "compartment")
          .length -
        [...localEntries.values()].filter(
          (entry) => entry.serviceKey === "compartment",
        ).length,
    },
  ];

  console.log("OCI Snapshot vs App DB Comparison");
  console.log("=".repeat(80));
  console.log(`Snapshot directory: ${dataDir}`);
  if (manifest) {
    console.log(`Manifest: ${OCI_LOCAL_DATA_MANIFEST_FILENAME} found`);
  }
  console.log(`Local snapshot entries: ${localEntries.size}`);
  console.log(`App OCI-backed CIs: ${appOciItems.length}`);
  console.log(`Missing in app: ${missingInApp.length}`);
  console.log(`Extra in app: ${extraInApp.length}`);
  console.log(`Extra retired/historical in app: ${retiredInApp.length}`);
  console.log();
  console.table(rows);

  if (showMissing) {
    printSample(
      "Missing in app",
      missingInApp.map((entry) => ({
        ciKey: entry.ciKey,
        name: entry.name,
        serviceKey: entry.serviceKey,
      })),
    );
    printSample(
      "Extra in app",
      extraInApp.map((entry) => ({
        ciKey: entry.ciKey,
        name: entry.name,
        serviceKey: entry.serviceKey,
      })),
    );
  }
}

main()
  .catch((error) => {
    console.error("OCI snapshot comparison failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
