/**
 * Asset Category Field API Routes (by ID)
 * GET - Get a single asset category field
 * PUT - Update an asset category field
 * DELETE - Delete an asset category field
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getAssetCategoryFieldAction,
  updateAssetCategoryFieldAction,
  deleteAssetCategoryFieldAction,
} from "@/interface-adapters/controllers/asset-category-field.controller";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const result = await getAssetCategoryFieldAction(params.id);

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
    const result = await updateAssetCategoryFieldAction(params.id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (_error) {
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
  const result = await deleteAssetCategoryFieldAction(params.id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
