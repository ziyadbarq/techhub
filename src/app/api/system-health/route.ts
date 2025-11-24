import { NextResponse } from "next/server";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { CheckSystemHealthUseCase } from "@/core/use-cases/system-setup/check-system-health.use-case";

export async function GET() {
  try {
    const container = getContainer();
    const checkSystemHealth = container.get<CheckSystemHealthUseCase>(
      DI_TOKENS.CheckSystemHealthUseCase,
    );

    const result = await checkSystemHealth.execute();

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
