/**
 * License Product Field API Routes (by ID)
 * GET - Get a single license product field
 * PUT - Update a license product field
 * DELETE - Delete a license product field
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getLicenseProductField,
  updateLicenseProductField,
  deleteLicenseProductField,
} from "@/interface-adapters/controllers/license-product-field.controller";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const result = await getLicenseProductField(params.id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result.data);
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const body = await request.json();
    const result = await updateLicenseProductField(params.id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const result = await deleteLicenseProductField(params.id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
