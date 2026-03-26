export const OCI_SYNC_SOURCE_MODES = ["webhook", "local"] as const;

export type OciSyncSourceMode = (typeof OCI_SYNC_SOURCE_MODES)[number];

export type OciSyncAttributeSource = "oci_webhook" | "oci_local_file";

export function parseOciSyncSourceMode(
  value: string | undefined,
): OciSyncSourceMode {
  const normalized = value?.trim().toLowerCase();

  if (!normalized || normalized === "webhook") {
    return "webhook";
  }

  if (normalized === "local") {
    return "local";
  }

  throw new Error(
    `Invalid OCI_SYNC_SOURCE value "${value}". Expected "webhook" or "local".`,
  );
}

export function getOciSyncAttributeSource(
  mode: OciSyncSourceMode,
): OciSyncAttributeSource {
  return mode === "local" ? "oci_local_file" : "oci_webhook";
}
