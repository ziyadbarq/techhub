import fs from "fs";
import path from "path";
import { parse } from "dotenv";

const DEFAULT_ENV_FILES = [".env", ".env.production", ".env.local"];

/**
 * Load env files with predictable precedence while preserving shell-provided vars.
 * Order: existing process.env > .env.local > .env.production > .env
 */
export function loadScriptEnv(files = DEFAULT_ENV_FILES) {
  const protectedKeys = new Set(Object.keys(process.env));

  for (const file of files) {
    const resolvedPath = path.resolve(process.cwd(), file);

    if (!fs.existsSync(resolvedPath)) {
      continue;
    }

    const parsed = parse(fs.readFileSync(resolvedPath));

    for (const [key, value] of Object.entries(parsed)) {
      if (protectedKeys.has(key)) {
        continue;
      }

      process.env[key] = value;
    }
  }
}
