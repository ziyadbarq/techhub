/**
 * Hydrate restart-required DB settings into process.env before DI startup.
 *
 * This runs after cloud config loads but before the DI container imports
 * env-sensitive modules such as the logger, Prisma client, and Better Auth.
 */

import { Client } from "pg";
import { decrypt } from "@/lib/auth/encryption";
import { getEditableSettings } from "@/core/domain/value-objects/settings-registry";

interface RawSystemSettingRow {
  key: string;
  value: string | null;
  isEncrypted: boolean;
}

const RESTART_REQUIRED_SETTINGS = getEditableSettings().filter(
  (definition) => definition.requiresRestart,
);

const RESTART_REQUIRED_ENV_VARS = new Map(
  RESTART_REQUIRED_SETTINGS.map((definition) => [
    definition.key,
    definition.envVarName,
  ]),
);

/**
 * Timestamp of the last successful hydration. Settings with `updatedAt`
 * before this time have already been applied to process.env and do not
 * need another restart.
 */
let lastHydrationTimestamp: Date | null = null;

export function getLastHydrationTimestamp(): Date | null {
  return lastHydrationTimestamp;
}

export async function hydrateSettingsIntoEnv(): Promise<number> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn(
      "[hydrate-settings] DATABASE_URL is not set, skipping DB setting hydration",
    );
    return 0;
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    const result = await client.query<RawSystemSettingRow>(
      'SELECT "key", "value", "isEncrypted" FROM "system_settings" WHERE "key" = ANY($1::text[])',
      [Array.from(RESTART_REQUIRED_ENV_VARS.keys())],
    );

    let hydrated = 0;

    for (const setting of result.rows) {
      const envVarName = RESTART_REQUIRED_ENV_VARS.get(setting.key);
      if (!envVarName || !setting.value) {
        continue;
      }

      let resolvedValue = setting.value;

      if (setting.isEncrypted) {
        try {
          resolvedValue = decrypt(setting.value);
        } catch (error) {
          console.warn(
            `[hydrate-settings] Failed to decrypt ${setting.key}, skipping`,
            error instanceof Error ? error.message : error,
          );
          continue;
        }
      }

      process.env[envVarName] = resolvedValue;
      hydrated++;
    }

    lastHydrationTimestamp = new Date();

    if (hydrated > 0) {
      console.log(
        `[hydrate-settings] ${hydrated} restart-required DB setting(s) written to process.env`,
      );
    }

    return hydrated;
  } catch (error) {
    console.warn(
      "[hydrate-settings] Failed to hydrate settings from DB (non-fatal):",
      error instanceof Error ? error.message : error,
    );
    return 0;
  } finally {
    await client.end().catch(() => undefined);
  }
}
