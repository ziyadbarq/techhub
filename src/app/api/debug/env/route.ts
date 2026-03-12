import { NextResponse } from "next/server";

/**
 * Safe env snapshot for ops: which config source and whether critical vars are set.
 * No secret values are returned. Enable with ALLOW_ENV_DEBUG=true or in non-prod.
 */
export async function GET() {
  const allow =
    process.env.ALLOW_ENV_DEBUG === "true" ||
    process.env.ENVIRONMENT_NAME === "gcpdev" ||
    process.env.ENVIRONMENT_NAME === "dev" ||
    process.env.NODE_ENV !== "production";

  if (!allow) {
    return NextResponse.json(
      { error: "Env debug disabled. Set ALLOW_ENV_DEBUG=true to enable." },
      { status: 403 },
    );
  }

  const payload = {
    NODE_ENV: process.env.NODE_ENV ?? null,
    LOG_LEVEL: process.env.LOG_LEVEL ?? null,
    configSource: process.env.CONFIG_SERVER_URL ? "config-server" : "local",
    APPLICATION_NAME: process.env.APPLICATION_NAME ?? null,
    ENVIRONMENT_NAME: process.env.ENVIRONMENT_NAME ?? null,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasRedisUrl: Boolean(process.env.REDIS_URL),
    hasBetterAuthUrl: Boolean(process.env.BETTER_AUTH_URL),
    hasBetterAuthSecret: Boolean(process.env.BETTER_AUTH_SECRET),
    hasEncryptionKey: Boolean(process.env.ENCRYPTION_KEY),
  };

  return NextResponse.json(payload, { status: 200 });
}
