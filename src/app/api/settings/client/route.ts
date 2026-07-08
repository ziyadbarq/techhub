/**
 * Client Settings API Route
 * Returns NEXT_PUBLIC_* settings that may have DB overrides.
 * These are public by definition — no auth required.
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IConfigService } from "@/core/services/config.service.interface";

export const dynamic = "force-dynamic";

const CLIENT_SETTING_KEYS = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL",
  "NEXT_PUBLIC_ENABLE_EMAIL_REGISTRATION",
  "NEXT_PUBLIC_ENABLE_MS_AUTH",
] as const;

export async function GET() {
  try {
    const container = getContainer();
    const configService = container.get<IConfigService>(
      DI_TOKENS.IConfigService,
    );

    const settings: Record<string, string | undefined> = {};
    for (const key of CLIENT_SETTING_KEYS) {
      settings[key] = await configService.get(key);
    }

    return NextResponse.json(settings, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  } catch (error) {
    logger.scope("API").error("GET", "Error fetching client settings", error);
    return NextResponse.json(
      { error: "Failed to fetch client settings" },
      { status: 500 },
    );
  }
}
