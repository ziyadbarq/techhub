import { NextResponse } from "next/server";
import { checkSystemHealthAction } from "@/interface-adapters/controllers/setup.controller";

export async function GET() {
  try {
    const result = await checkSystemHealthAction();
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error ?? "Failed to check system health",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
