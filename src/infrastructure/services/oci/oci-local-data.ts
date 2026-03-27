import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  OciWebhookResponseSchema,
  type OciServiceKey,
  type OciWebhookResponse,
} from "@/core/domain/value-objects/oci-resource.types";

export const DEFAULT_OCI_LOCAL_DATA_DIR = "local/oci-data";
export const DEFAULT_OCI_LOCAL_DATA_ARCHIVE_DIR = "local/oci-data-archive";
export const OCI_LOCAL_DATA_MANIFEST_FILENAME = "manifest.json";

export function resolveOciLocalDataDir(
  customPath = process.env.OCI_LOCAL_DATA_DIR,
): string {
  return resolve(
    process.cwd(),
    customPath?.trim() || DEFAULT_OCI_LOCAL_DATA_DIR,
  );
}

export function resolveOciLocalDataArchiveDir(
  customPath = process.env.OCI_LOCAL_DATA_ARCHIVE_DIR,
): string {
  return resolve(
    process.cwd(),
    customPath?.trim() || DEFAULT_OCI_LOCAL_DATA_ARCHIVE_DIR,
  );
}

export function getOciLocalDataFilename(serviceKey: OciServiceKey): string {
  return `oci-${serviceKey}.json`;
}

export function getOciLocalDataFilePath(
  serviceKey: OciServiceKey,
  dataDir = resolveOciLocalDataDir(),
): string {
  return join(dataDir, getOciLocalDataFilename(serviceKey));
}

export function loadLocalOciServicePayload(
  serviceKey: OciServiceKey,
  dataDir = resolveOciLocalDataDir(),
): unknown {
  const filePath = getOciLocalDataFilePath(serviceKey, dataDir);

  if (!existsSync(filePath)) {
    throw new Error(`Local OCI snapshot file not found: ${filePath}`);
  }

  const raw = readFileSync(filePath, "utf8");

  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    throw new Error(`Local OCI snapshot file is not valid JSON: ${filePath}`, {
      cause: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export function loadValidatedLocalOciServicePayload(
  serviceKey: OciServiceKey,
  dataDir = resolveOciLocalDataDir(),
): OciWebhookResponse {
  const payload = loadLocalOciServicePayload(serviceKey, dataDir);
  const parseResult = OciWebhookResponseSchema.safeParse(payload);

  if (!parseResult.success) {
    throw new Error(
      `Local OCI snapshot file has an invalid structure for ${serviceKey}: ${parseResult.error.issues[0]?.message ?? "Unknown validation error"}`,
    );
  }

  return parseResult.data;
}

export function countOciResponseResources(
  response: OciWebhookResponse,
  serviceKey: OciServiceKey,
): number {
  let total = 0;

  for (const tenancy of response["object Object"]) {
    const compartments = tenancy.services[serviceKey] ?? [];
    for (const compartment of compartments) {
      for (const region of compartment.regions) {
        total += region.items.length;
      }
    }
  }

  return total;
}
