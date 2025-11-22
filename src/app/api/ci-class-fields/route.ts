/**
 * CI Class Fields API Routes
 * GET - List CI class fields (with optional filters)
 * POST - Create a new CI class field
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createCIClassFieldAction,
  listCIClassFieldsAction,
} from "@/interface-adapters/controllers/ci-class-field.controller";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ciClassId = searchParams.get("ciClassId");
  const fieldDefinitionId = searchParams.get("fieldDefinitionId");

  const params: { ciClassId?: string; fieldDefinitionId?: string } = {};
  if (ciClassId) params.ciClassId = ciClassId;
  if (fieldDefinitionId) params.fieldDefinitionId = fieldDefinitionId;

  const result = await listCIClassFieldsAction(
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
    const result = await createCIClassFieldAction(body);

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
