/**
 * Spring Cloud Config Server verification for TechHub.
 *
 * Examples:
 *   dotenv -e .env.local -- tsx scripts/config/verify-cloud-config.ts
 *   dotenv -e .env.local -- tsx scripts/config/verify-cloud-config.ts --profiles=gcpdev,dev
 *   dotenv -e .env.local -- tsx scripts/config/verify-cloud-config.ts --profile=gcpdev --app-url=https://techhub.dev.barq.com
 */

import { loadCloudConfig } from "../../src/infrastructure/config/cloud-config-loader";

interface VerificationResult {
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}

const DEFAULT_DEV_APP_URL = "https://techhub.dev.barq.com";
const DEFAULT_CONFIG_REQUIRED_KEYS = [
  "NODE_ENV",
  "PORT",
  "ENCRYPTION_KEY",
  "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_ENABLE_EMAIL_REGISTRATION",
  "NEXT_PUBLIC_ENABLE_MS_AUTH",
  "NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL",
];
const JUNK_KEYS = ["ALLOW_ENV_DEBUG", "OPENAI_API_KEY"];
const PLACEHOLDER_PATTERN = /<from-k8s>|<[^>]+>|openai/i;

const getArg = (name: string): string | undefined =>
  process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split("=")[1];

const getListArg = (name: string): string[] | undefined => {
  const value = getArg(name);
  if (!value) return undefined;
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const getDetectedProfile = (): string => {
  if (process.env.ENVIRONMENT_NAME) return process.env.ENVIRONMENT_NAME;
  if (process.env.SPRING_PROFILE) return process.env.SPRING_PROFILE;

  switch (process.env.NODE_ENV) {
    case "production":
      return "prod";
    case "development":
    case "test":
    default:
      return "dev";
  }
};

const options = {
  configServerUrl: process.env.CONFIG_SERVER_URL,
  appName: getArg("app") ?? process.env.APPLICATION_NAME ?? "techhub",
  profiles: getListArg("profiles") ?? [
    getArg("profile") ?? getDetectedProfile(),
  ],
  appUrl: getArg("app-url") ?? DEFAULT_DEV_APP_URL,
  requiredKeys: getListArg("require") ?? DEFAULT_CONFIG_REQUIRED_KEYS,
};

async function verifyConfigServerUrl(): Promise<VerificationResult[]> {
  const url = options.configServerUrl;
  const results: VerificationResult[] = [
    {
      passed: Boolean(url),
      message: "CONFIG_SERVER_URL environment variable",
      details: { url: url || "NOT SET" },
    },
  ];

  if (!url) {
    results.push({
      passed: false,
      message: "CONFIG_SERVER_URL is not set",
    });
    return results;
  }

  try {
    new URL(url);
    results.push({
      passed: true,
      message: "CONFIG_SERVER_URL is valid URL",
      details: { url },
    });
  } catch {
    results.push({
      passed: false,
      message: "CONFIG_SERVER_URL is not a valid URL",
      details: { url },
    });
  }

  return results;
}

async function verifyHealth(): Promise<VerificationResult> {
  const url = options.configServerUrl;
  if (!url) {
    return { passed: false, message: "Skipped - CONFIG_SERVER_URL not set" };
  }

  const endpoint = `${url.replace(/\/+$/, "")}/actuator/health`;
  try {
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(5000),
    });

    return {
      passed: response.ok,
      message: "Config server health check",
      details: {
        status: response.status,
        statusText: response.statusText,
        endpoint,
      },
    };
  } catch (error) {
    return {
      passed: false,
      message: "Failed to connect to config server",
      details: {
        error: error instanceof Error ? error.message : String(error),
        endpoint,
      },
    };
  }
}

async function loadProfileConfig(profile: string): Promise<VerificationResult> {
  const url = options.configServerUrl;
  if (!url) {
    return { passed: false, message: "Skipped - CONFIG_SERVER_URL not set" };
  }

  const result = await loadCloudConfig({
    endpoint: url,
    name: options.appName,
    profiles: [profile],
    timeout: 5000,
    retries: 3,
  });

  if (!result.success) {
    return {
      passed: false,
      message: `Load configuration for profile '${profile}'`,
      details: {
        success: false,
        source: result.source,
        profile,
        retryAttempts: result.metadata.retryAttempts,
        error: result.metadata.error,
      },
    };
  }

  const missingRequired = options.requiredKeys.filter(
    (key) => !result.config[key],
  );
  const junkKeys = JUNK_KEYS.filter((key) => result.config[key]);
  const placeholderKeys = Object.entries(result.config)
    .filter(([, value]) => PLACEHOLDER_PATTERN.test(value))
    .map(([key]) => key);
  const urlMismatches = ["BETTER_AUTH_URL", "NEXT_PUBLIC_APP_URL"].filter(
    (key) => result.config[key] && result.config[key] !== options.appUrl,
  );
  const trustedOrigins = result.config.TRUSTED_ORIGINS;
  const trustedOriginsValid =
    !trustedOrigins ||
    trustedOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
      .includes(options.appUrl);

  const passed =
    missingRequired.length === 0 &&
    junkKeys.length === 0 &&
    placeholderKeys.length === 0 &&
    urlMismatches.length === 0 &&
    trustedOriginsValid;

  return {
    passed,
    message: `Validate cleaned configuration for profile '${profile}'`,
    details: {
      keysLoaded: Object.keys(result.config).length,
      profile,
      requiredKeys: options.requiredKeys,
      missingRequired,
      junkKeys,
      placeholderKeys,
      expectedAppUrl: options.appUrl,
      urlMismatches,
      trustedOrigins: trustedOrigins ?? null,
      trustedOriginsValid,
    },
  };
}

async function runVerification(): Promise<void> {
  console.log("\n=== Spring Cloud Config Server Verification ===\n");
  console.log(`Application: ${options.appName}`);
  console.log(`Profiles: ${options.profiles.join(", ")}`);
  console.log(`Expected app URL: ${options.appUrl}\n`);

  const results: VerificationResult[] = [
    ...(await verifyConfigServerUrl()),
    await verifyHealth(),
  ];

  for (const profile of options.profiles) {
    results.push(await loadProfileConfig(profile));
  }

  let passedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < results.length; i++) {
    const result = results[i]!;
    console.log(`[${i + 1}/${results.length}] ${result.message}`);

    if (result.passed) {
      console.log("PASS");
      passedCount++;
    } else {
      console.log("FAIL");
      failedCount++;
    }

    if (result.details) {
      console.log(
        `Details: ${JSON.stringify(result.details, null, 2).replace(/\n/g, "\n")}`,
      );
    }
    console.log("");
  }

  console.log("=== Verification Summary ===");
  console.log(`Passed: ${passedCount}/${results.length}`);
  console.log(`Failed: ${failedCount}/${results.length}`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runVerification().catch((error) => {
  console.error("\nVerification script failed:");
  console.error(error);
  process.exit(1);
});
