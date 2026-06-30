/**
 * Docker entry point — runs BEFORE Next.js server.js
 *
 * Fetches config from Spring Cloud Config Server and sets process.env,
 * then starts the Next.js standalone server.
 *
 * This replaces the broken instrumentation.ts approach (not loaded in standalone mode).
 */

const CONFIG_SERVER_URL = process.env.CONFIG_SERVER_URL;
const APP_NAME = process.env.APPLICATION_NAME || "techhub";
const PROFILE = process.env.ENVIRONMENT_NAME || process.env.SPRING_PROFILE || "dev";

async function loadConfig() {
  if (!CONFIG_SERVER_URL) {
    console.log("[config] CONFIG_SERVER_URL not set, using env vars only");
    return;
  }

  const url = `${CONFIG_SERVER_URL.replace(/\/+$/, "")}/${APP_NAME}/${PROFILE}`;
  console.log(`[config] Fetching: GET ${url}`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[config] Attempt ${attempt}/3...`);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timer);

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const data = await res.json();
      let count = 0;

      // Spring Cloud Config response: propertySources[].source has key-value pairs
      // Reverse so first source (highest priority) wins
      const sources = [...(data.propertySources || [])].reverse();
      for (const ps of sources) {
        for (const [key, value] of Object.entries(ps.source || {})) {
          if (value !== null && value !== undefined) {
            process.env[key] = String(value);
            count++;
          }
        }
      }

      console.log(`[config] Loaded ${count} keys from ${sources.length} source(s)`);
      console.log(`[config] Profile: ${PROFILE}`);

      // Show which critical vars are set (no values, just presence)
      const critical = ["DATABASE_URL", "REDIS_URL", "ENCRYPTION_KEY", "NEXT_PUBLIC_APP_URL", "BETTER_AUTH_URL", "BETTER_AUTH_SECRET"];
      for (const k of critical) {
        console.log(`[config]   ${k}: ${process.env[k] ? "SET" : "MISSING"}`);
      }
      return;
    } catch (err) {
      console.warn(`[config] Attempt ${attempt}/3 failed: ${err.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 100 * Math.pow(2, attempt - 1)));
    }
  }

  console.error("[config] All attempts failed. Using env vars from deployment.");
}

async function runMigrations() {
  console.log("[migrate] Running database migrations...");
  const { default: pg } = await import("pg");
  const { promises: fs } = await import("node:fs");
  const { join } = await import("node:path");
  const { randomUUID } = await import("node:crypto");

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Ensure the Prisma migrations tracking table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id"                  VARCHAR(36)  NOT NULL PRIMARY KEY,
        "checksum"            VARCHAR(64)  NOT NULL,
        "finished_at"         TIMESTAMPTZ,
        "migration_name"      VARCHAR(255) NOT NULL,
        "logs"                TEXT,
        "rolled_back_at"      TIMESTAMPTZ,
        "started_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "applied_steps_count" INTEGER     NOT NULL DEFAULT 0
      )
    `);

    // Which migrations are already applied?
    const { rows } = await pool.query(
      `SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`
    );
    const applied = new Set(rows.map((r) => r.migration_name));

    // Read all migration directories, sorted lexicographically (timestamp-prefixed → chronological)
    const migrationsDir = join(
      process.cwd(),
      "src/infrastructure/database/prisma/schema/migrations"
    );
    let dirs;
    try {
      dirs = (await fs.readdir(migrationsDir)).sort();
    } catch {
      console.log("[migrate] No migrations directory found — skipping.");
      return;
    }

    let count = 0;
    for (const dir of dirs) {
      if (applied.has(dir)) continue;

      const sqlPath = join(migrationsDir, dir, "migration.sql");
      let sql;
      try {
        sql = await fs.readFile(sqlPath, "utf-8");
      } catch {
        continue; // skip dirs without migration.sql (e.g. .keep files)
      }

      console.log(`[migrate] Applying: ${dir}`);
      const client = await pool.connect();
      const startedAt = new Date();
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          `INSERT INTO "_prisma_migrations"
             (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [randomUUID(), "", dir, startedAt, new Date(), 1]
        );
        await client.query("COMMIT");
        count++;
        console.log(`[migrate] Applied:  ${dir}`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`[migrate] Failed to apply ${dir}: ${err.message}`);
        throw err;
      } finally {
        client.release();
      }
    }

    console.log(
      count === 0
        ? "[migrate] Database is up to date — no migrations to apply."
        : `[migrate] ${count} migration(s) applied successfully.`
    );
  } catch (err) {
    console.error("[migrate] Migration failed — aborting startup.");
    console.error(err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function runSeedIfEmpty() {
  // Use a lightweight DB check via pg directly — no DI container needed at this point
  const { default: pg } = await import("pg");
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM \"FeatureFlag\"");
    const count = rows[0]?.count ?? 0;
    if (count > 0) {
      console.log(`[seed] Database already seeded (${count} feature flags found). Skipping.`);
      return;
    }
  } catch {
    // Table may not exist yet (first boot before migrations) — skip seeding
    console.log("[seed] Could not check seed status — skipping.");
    return;
  } finally {
    await pool.end();
  }

  console.log("[seed] Empty database detected — running production seed...");
  const { execSync } = await import("node:child_process");
  try {
    execSync("node node_modules/tsx/dist/cli.mjs src/infrastructure/database/prisma/seed.ts production", {
      stdio: "inherit",
      env: process.env,
    });
    console.log("[seed] Production seed completed.");
  } catch {
    console.error("[seed] Seed failed — app will start but database may be missing reference data.");
    // Non-fatal: app can still start, admin can retry from /setup page
  }
}

// --- Main ---
console.log(`[TechHub] NODE_ENV=${process.env.NODE_ENV} | LOG_LEVEL=${process.env.LOG_LEVEL ?? "default"} | config=${CONFIG_SERVER_URL ? "config-server" : "local"}`);

await loadConfig();
await runMigrations();
await runSeedIfEmpty();

console.log("[TechHub] Starting Next.js server...");
await import("./server.js");
