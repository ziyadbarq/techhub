/**
 * License Product Fields API Routes
 * GET - List license product fields (with optional licenseProductId filter)
 * POST - Create a new license product field
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createLicenseProductField,
  listLicenseProductFields,
} from "@/interface-adapters/controllers/license-product-field.controller";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const licenseProductId = searchParams.get("licenseProductId");

  if (!licenseProductId) {
    return NextResponse.json(
      { error: "licenseProductId query parameter is required" },
      { status: 400 },
    );
  }

  const result = await listLicenseProductFields(licenseProductId);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createLicenseProductField(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
