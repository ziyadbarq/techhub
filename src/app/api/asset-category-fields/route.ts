/**
 * Asset Category Fields API Routes
 * GET - List asset category fields (with optional filters)
 * POST - Create a new asset category field
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createAssetCategoryFieldAction,
  listAssetCategoryFieldsAction,
} from "@/interface-adapters/controllers/asset-category-field.controller";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const assetCategoryId = searchParams.get("assetCategoryId");
  const fieldDefinitionId = searchParams.get("fieldDefinitionId");

  const params: { assetCategoryId?: string; fieldDefinitionId?: string } = {};
  if (assetCategoryId) params.assetCategoryId = assetCategoryId;
  if (fieldDefinitionId) params.fieldDefinitionId = fieldDefinitionId;

  const result = await listAssetCategoryFieldsAction(
    Object.keys(params).length > 0 ? params : undefined,
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createAssetCategoryFieldAction(body);

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
