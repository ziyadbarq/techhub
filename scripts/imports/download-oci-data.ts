/**
 * Download OCI Inventory Data
 *
 * Downloads Oracle Cloud Infrastructure inventory data from n8n webhook
 * endpoint for multiple service types (compute, load balancers, databases, etc.)
 *
 * Output:
 * - local/oci-data/*.json (8 service-specific files)
 *
 * Environment Variables:
 * - OCI_WEBHOOK_TOKEN (required): Authentication token for n8n webhook
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/imports/download-oci-data.ts
 *   npx dotenv -e .env.local -- npx tsx scripts/imports/download-oci-data.ts --dry-run
 *   npx dotenv -e .env.local -- npx tsx scripts/imports/download-oci-data.ts --help
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { Agent } from "undici";

// Constants
const WEBHOOK_URL = "https://n8n.prod.barq.com/webhook/oci-invent";
const OUTPUT_DIR = join(process.cwd(), "local", "oci-data");
const DRY_RUN = process.argv.includes("--dry-run");
const ALLOW_INSECURE = process.env.OCI_WEBHOOK_INSECURE === "true";

const INSECURE_DISPATCHER = ALLOW_INSECURE
  ? new Agent({ connect: { rejectUnauthorized: false } })
  : undefined;

// Service definitions with metadata
const SERVICES = [
  { key: "compute", description: "Compute instances (VM/BM)" },
  { key: "lb", description: "Load Balancers" },
  { key: "nlb", description: "Network Load Balancers" },
  { key: "oke", description: "Container Engine (OKE) clusters" },
  { key: "buckets", description: "Object Storage buckets" },
  { key: "postgresql", description: "PostgreSQL databases" },
  { key: "mysql", description: "MySQL databases" },
  { key: "dbsystems", description: "Oracle Database DB Systems" },
];

// Type for download result
type DownloadResult = {
  success: boolean;
  data?: unknown;
  error?: string;
  size?: number;
  details?: string;
};

// Type for failed service tracking
type FailedService = {
  key: string;
  error: string;
};

type FailureHint = {
  hint?: string;
  details?: string;
};
type FailureFingerprint = {
  key: string;
  hint?: string;
  details?: string;
};

/**
 * Format bytes for human-readable output
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Provide more actionable hints for fetch/network failures
 */
function getFailureHint(message: string): FailureHint {
  const lower = message.toLowerCase();

  if (
    lower.includes("self signed certificate") ||
    lower.includes("unable to verify") ||
    lower.includes("certificate") ||
    lower.includes("tls") ||
    lower.includes("ssl") ||
    lower.includes("fetch failed")
  ) {
    return {
      hint: "TLS/SSL handshake issue. Try setting OCI_WEBHOOK_INSECURE=true (like curl -k) or check corporate proxy certificates.",
    };
  }

  if (lower.includes("getaddrinfo") || lower.includes("enotfound")) {
    return {
      hint: "DNS resolution failed. Check network/VPN and the webhook hostname.",
    };
  }

  if (lower.includes("timeout") || lower.includes("timed out")) {
    return {
      hint: "Request timed out. Check VPN, proxy, or n8n availability.",
    };
  }

  if (lower.includes("econnrefused") || lower.includes("connection refused")) {
    return {
      hint: "Connection refused. Check VPN access or webhook availability.",
    };
  }

  if (lower.includes("econnreset") || lower.includes("connection reset")) {
    return { hint: "Connection reset. Check VPN, proxy, or server stability." };
  }

  return {};
}

function buildFailureFingerprint(result: DownloadResult): FailureFingerprint {
  return {
    key: `${result.error || "error"}|${result.details || ""}|${result.hint || ""}`,
    hint: result.hint,
    details: result.details,
  };
}

/**
 * Download data for a specific OCI service
 */
async function downloadService(
  serviceKey: string,
  description: string,
  token: string,
): Promise<DownloadResult> {
  try {
    const url = `${WEBHOOK_URL}?oci-service=${serviceKey}`;

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        token: token,
        Accept: "application/json",
      },
      ...(INSECURE_DISPATCHER ? { dispatcher: INSECURE_DISPATCHER } : {}),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || "unknown";
      let bodyText = "";
      try {
        bodyText = await response.text();
      } catch {
        bodyText = "<failed to read response body>";
      }

      const snippet = bodyText.trim().slice(0, 500);
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: `content-type=${contentType}; body=${snippet || "<empty>"}`,
      };
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch (error) {
      return {
        success: false,
        error: "Invalid JSON response",
        details: error instanceof Error ? error.message : String(error),
      };
    }
    const size = JSON.stringify(data).length;

    return { success: true, data, size };
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    const { hint } = getFailureHint(details);
    return {
      success: false,
      error: "Request failed",
      details,
      hint,
    };
  }
}

/**
 * Save data to a JSON file
 */
function saveToFile(serviceKey: string, data: unknown): void {
  const filename = `oci-${serviceKey}.json`;
  const filepath = join(OUTPUT_DIR, filename);

  if (!DRY_RUN) {
    const json = JSON.stringify(data, null, 2);
    writeFileSync(filepath, json, "utf-8");
  }
}

/**
 * Display help message
 */
function showHelp(): void {
  console.log(`
OCI Inventory Data Download

Downloads OCI infrastructure data from n8n webhook endpoint.

Usage:
  npx dotenv -e .env.local -- npx tsx scripts/imports/download-oci-data.ts [options]

Options:
  --dry-run    Preview downloads without saving files
  --help       Show this help message

Environment Variables:
  OCI_WEBHOOK_TOKEN (required)    Authentication token for n8n webhook
  OCI_WEBHOOK_INSECURE=true       Allow invalid TLS certificates (use with caution)

Services Downloaded:
  - compute: All Compute instances (VM/BM)
  - lb: OCI Load Balancers
  - nlb: OCI Network Load Balancers
  - oke: OCI Container Engine (OKE) clusters
  - buckets: Object Storage buckets
  - postgresql: OCI PostgreSQL databases
  - mysql: OCI MySQL databases
  - dbsystems: Oracle Database DB Systems

Output: local/oci-data/*.json
  `);
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  // Handle help flag
  if (process.argv.includes("--help")) {
    showHelp();
    process.exit(0);
  }

  // Validate environment variable
  const token = process.env.OCI_WEBHOOK_TOKEN;
  if (!token) {
    throw new Error(
      "Missing OCI_WEBHOOK_TOKEN environment variable.\n" +
        "Add to .env.local: OCI_WEBHOOK_TOKEN=your_token_here",
    );
  }

  // Print header
  console.log("🌩️  OCI Inventory Data Download");
  console.log("=".repeat(80));
  console.log(`📂 Output directory: ${OUTPUT_DIR}`);
  console.log(`🔐 Token: ${token.substring(0, 10)}...${token.slice(-5)}`);
  if (ALLOW_INSECURE) {
    console.log("⚠️  TLS verification disabled (OCI_WEBHOOK_INSECURE=true)");
  }
  if (DRY_RUN) {
    console.log("⚠️  DRY RUN MODE - Files will not be saved");
  }
  console.log("=".repeat(80));
  console.log();

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    if (!DRY_RUN) {
      mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`📁 Created directory: ${OUTPUT_DIR}`);
    } else {
      console.log(`📁 Would create directory: ${OUTPUT_DIR}`);
    }
    console.log();
  }

  // Download each service
  let successCount = 0;
  let failedCount = 0;
  let totalSize = 0;
  const failedServices: FailedService[] = [];
  const failureCounts = new Map<
    string,
    { count: number; hint?: string; details?: string }
  >();
  const printedFailureKeys = new Set<string>();

  for (const service of SERVICES) {
    console.log(`⏳ Downloading ${service.description} (${service.key})...`);

    const result = await downloadService(
      service.key,
      service.description,
      token,
    );

    if (result.success && result.data && result.size !== undefined) {
      console.log(`   ✅ Success - ${formatBytes(result.size)}`);
      saveToFile(service.key, result.data);
      successCount++;
      totalSize += result.size;
    } else {
      const fingerprint = buildFailureFingerprint(result);
      const currentFailure = failureCounts.get(fingerprint.key);
      if (currentFailure) {
        currentFailure.count += 1;
      } else {
        failureCounts.set(fingerprint.key, {
          count: 1,
          hint: fingerprint.hint,
          details: fingerprint.details,
        });
      }

      console.log(`   ❌ Failed - ${result.error}`);
      if (result.details) {
        console.log(`      ↳ ${result.details}`);
      }
      if (result.hint) {
        const keyForPrint = `${result.error || "error"}|${result.hint}`;
        if (!printedFailureKeys.has(keyForPrint)) {
          console.log(`      ↳ Hint: ${result.hint}`);
          printedFailureKeys.add(keyForPrint);
        } else {
          console.log("      ↳ Hint: same as previous failure");
        }
      }
      failedServices.push({
        key: service.key,
        error: result.error || "Unknown error",
      });
      failedCount++;
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(80));
  console.log("📊 Download Summary");
  console.log("=".repeat(80));
  console.log(`✅ Successful: ${successCount}/${SERVICES.length}`);
  console.log(`❌ Failed: ${failedCount}/${SERVICES.length}`);
  console.log(`📦 Total size: ${formatBytes(totalSize)}`);
  console.log(`📁 Files saved to: ${OUTPUT_DIR}/`);

  if (failedServices.length > 0) {
    console.log("\n⚠️  Failed services:");
    failedServices.forEach(({ key, error }) => {
      console.log(`   - ${key}: ${error}`);
    });
  }

  if (failureCounts.size > 0) {
    console.log("\n🧭 Failure patterns:");
    Array.from(failureCounts.values()).forEach(({ count, hint, details }) => {
      console.log(`   - ${count}x ${details || "Request failed"}`);
      if (hint) {
        console.log(`     Hint: ${hint}`);
      }
    });
  }

  if (DRY_RUN) {
    console.log("\n⚠️  DRY RUN - No files were actually saved");
  }
}

// Execute main function
main()
  .then(() => {
    console.log("\n✅ OCI data download completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ OCI data download failed:", error);
    process.exit(1);
  });
