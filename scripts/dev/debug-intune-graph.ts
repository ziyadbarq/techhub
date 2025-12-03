/**
 * Debug script to analyze Microsoft Graph Intune API response
 *
 * Run with: npx dotenv -e .env.local -- npx tsx scripts/debug-intune-graph.ts
 */

import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";

const INTUNE_SELECT_FIELDS = [
  "id",
  "azureADDeviceId",
  "deviceName",
  "serialNumber",
  "manufacturer",
  "model",
  "operatingSystem",
  "osVersion",
  "imei",
  "wiFiMacAddress",
  "ethernetMacAddress",
  "userId",
  "userPrincipalName",
  "userDisplayName",
  "managedDeviceOwnerType",
  "complianceState",
  "managementState",
  "isEncrypted",
  "isSupervised",
  "jailBroken",
  "enrolledDateTime",
  "lastSyncDateTime",
].join(",");

async function main() {
  console.log("🔍 Microsoft Graph Intune Device Analysis\n");
  console.log("=".repeat(60));

  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    console.error("❌ Missing Azure credentials in environment variables");
    process.exit(1);
  }

  const credential = new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret,
  );
  const authProvider = {
    getAccessToken: async (): Promise<string> => {
      const token = await credential.getToken(
        "https://graph.microsoft.com/.default",
      );
      return token.token;
    },
  };

  const client = Client.initWithMiddleware({
    authProvider: authProvider as unknown as Parameters<
      typeof Client.initWithMiddleware
    >[0]["authProvider"],
  });

  console.log("\n📡 Fetching devices from Microsoft Graph...\n");

  // Collect all devices with pagination
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allDevices: any[] = [];
  let nextLink: string | undefined;

  const request = client
    .api("/deviceManagement/managedDevices")
    .select(INTUNE_SELECT_FIELDS)
    .top(999);

  const response = await request.get();
  allDevices.push(...response.value);
  nextLink = response["@odata.nextLink"];

  while (nextLink) {
    const pageResponse = await client.api(nextLink).get();
    allDevices.push(...pageResponse.value);
    nextLink = pageResponse["@odata.nextLink"];
  }

  console.log(`✅ Fetched ${allDevices.length} devices\n`);
  console.log("=".repeat(60));

  // Analyze each field
  const fieldAnalysis: Record<string, Record<string, number>> = {};
  const nullCounts: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sampleValues: Record<string, any[]> = {};

  for (const device of allDevices) {
    for (const [key, value] of Object.entries(device)) {
      if (!fieldAnalysis[key]) {
        fieldAnalysis[key] = {};
        nullCounts[key] = 0;
        sampleValues[key] = [];
      }

      if (value === null || value === undefined || value === "") {
        nullCounts[key]++;
      } else {
        const strValue = String(value);
        fieldAnalysis[key][strValue] = (fieldAnalysis[key][strValue] || 0) + 1;

        // Collect sample values (max 5 unique)
        if (
          sampleValues[key].length < 5 &&
          !sampleValues[key].includes(value)
        ) {
          sampleValues[key].push(value);
        }
      }
    }
  }

  // Print analysis for key enum fields
  const keyFields = [
    "managedDeviceOwnerType",
    "complianceState",
    "managementState",
    "jailBroken",
    "operatingSystem",
  ];

  console.log("\n📊 KEY FIELD ANALYSIS\n");

  for (const field of keyFields) {
    console.log(`\n🔹 ${field}`);
    console.log("-".repeat(40));

    const values = fieldAnalysis[field] || {};
    const sortedValues = Object.entries(values).sort((a, b) => b[1] - a[1]);

    for (const [value, count] of sortedValues) {
      const percentage = ((count / allDevices.length) * 100).toFixed(1);
      console.log(`  "${value}": ${count} (${percentage}%)`);
    }

    if (nullCounts[field] > 0) {
      const percentage = (
        (nullCounts[field] / allDevices.length) *
        100
      ).toFixed(1);
      console.log(`  [null/empty]: ${nullCounts[field]} (${percentage}%)`);
    }
  }

  // Print summary stats
  console.log("\n" + "=".repeat(60));
  console.log("\n📈 SUMMARY STATISTICS\n");

  const ownershipTypes = fieldAnalysis["managedDeviceOwnerType"] || {};
  const complianceStates = fieldAnalysis["complianceState"] || {};

  console.log("Ownership Breakdown:");
  console.log(`  Corporate (company): ${ownershipTypes["company"] || 0}`);
  console.log(`  Personal: ${ownershipTypes["personal"] || 0}`);
  console.log(`  Unknown: ${ownershipTypes["unknown"] || 0}`);
  console.log(
    `  Other values: ${
      Object.keys(ownershipTypes)
        .filter((k) => !["company", "personal", "unknown"].includes(k))
        .map((k) => `"${k}": ${ownershipTypes[k]}`)
        .join(", ") || "none"
    }`,
  );

  console.log("\nCompliance Breakdown:");
  console.log(`  Compliant: ${complianceStates["compliant"] || 0}`);
  console.log(`  Non-Compliant: ${complianceStates["noncompliant"] || 0}`);
  console.log(`  Unknown: ${complianceStates["unknown"] || 0}`);
  console.log(
    `  Other states: ${
      Object.keys(complianceStates)
        .filter((k) => !["compliant", "noncompliant", "unknown"].includes(k))
        .map((k) => `"${k}": ${complianceStates[k]}`)
        .join(", ") || "none"
    }`,
  );

  // Check for unexpected values
  console.log("\n" + "=".repeat(60));
  console.log("\n⚠️  UNEXPECTED/UNUSUAL VALUES\n");

  const expectedOwnership = ["company", "personal", "unknown"];
  const expectedCompliance = [
    "compliant",
    "noncompliant",
    "conflict",
    "error",
    "inGracePeriod",
    "configManager",
    "unknown",
  ];
  const expectedManagement = [
    "managed",
    "retirePending",
    "retireIssued",
    "wipePending",
    "wipeIssued",
    "unhealthy",
    "deletePending",
    "discovered",
  ];
  const expectedJailBroken = ["Unknown", "True", "False"];

  const unexpectedOwnership = Object.keys(ownershipTypes).filter(
    (k) => !expectedOwnership.includes(k),
  );
  const unexpectedCompliance = Object.keys(complianceStates).filter(
    (k) => !expectedCompliance.includes(k),
  );
  const unexpectedManagement = Object.keys(
    fieldAnalysis["managementState"] || {},
  ).filter((k) => !expectedManagement.includes(k));
  const unexpectedJailBroken = Object.keys(
    fieldAnalysis["jailBroken"] || {},
  ).filter((k) => !expectedJailBroken.includes(k));

  if (unexpectedOwnership.length > 0) {
    console.log(
      `managedDeviceOwnerType: ${unexpectedOwnership.map((k) => `"${k}" (${ownershipTypes[k]})`).join(", ")}`,
    );
  }
  if (unexpectedCompliance.length > 0) {
    console.log(
      `complianceState: ${unexpectedCompliance.map((k) => `"${k}" (${complianceStates[k]})`).join(", ")}`,
    );
  }
  if (unexpectedManagement.length > 0) {
    console.log(
      `managementState: ${unexpectedManagement.map((k) => `"${k}" (${(fieldAnalysis["managementState"] || {})[k]})`).join(", ")}`,
    );
  }
  if (unexpectedJailBroken.length > 0) {
    console.log(
      `jailBroken: ${unexpectedJailBroken.map((k) => `"${k}" (${(fieldAnalysis["jailBroken"] || {})[k]})`).join(", ")}`,
    );
  }

  if (
    unexpectedOwnership.length === 0 &&
    unexpectedCompliance.length === 0 &&
    unexpectedManagement.length === 0 &&
    unexpectedJailBroken.length === 0
  ) {
    console.log("✅ No unexpected values found in enum fields");
  }

  // Sample raw device data
  console.log("\n" + "=".repeat(60));
  console.log("\n📝 SAMPLE RAW DEVICE DATA (first 3 devices)\n");

  for (let i = 0; i < Math.min(3, allDevices.length); i++) {
    console.log(`\nDevice ${i + 1}:`);
    console.log(JSON.stringify(allDevices[i], null, 2));
  }

  // Device name analysis
  console.log("\n" + "=".repeat(60));
  console.log("\n📛 DEVICE NAME ANALYSIS\n");

  const emptyNames = allDevices.filter(
    (d) => !d.deviceName || d.deviceName.trim() === "",
  );
  console.log(`Devices with empty/null names: ${emptyNames.length}`);

  if (emptyNames.length > 0 && emptyNames.length <= 10) {
    console.log("\nDevices with empty names:");
    for (const device of emptyNames) {
      console.log(
        `  ID: ${device.id}, Model: ${device.model || "N/A"}, Serial: ${device.serialNumber || "N/A"}`,
      );
    }
  }

  console.log("\n✅ Analysis complete!");
}

main().catch(console.error);
