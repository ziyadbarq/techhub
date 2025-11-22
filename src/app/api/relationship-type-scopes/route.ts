/**
 * Relationship Type Scopes API Routes
 * GET - List relationship type scopes (with optional filters)
 * POST - Create a new relationship type scope
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createRelationshipTypeScopeAction,
  listRelationshipTypeScopesAction,
} from "@/interface-adapters/controllers/relationship-type-scope.controller";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const relationshipTypeId = searchParams.get("relationshipTypeId");
  const fromCiClassId = searchParams.get("fromCiClassId");
  const toCiClassId = searchParams.get("toCiClassId");

  const params: {
    relationshipTypeId?: string;
    fromCiClassId?: string;
    toCiClassId?: string;
  } = {};
  if (relationshipTypeId) params.relationshipTypeId = relationshipTypeId;
  if (fromCiClassId) params.fromCiClassId = fromCiClassId;
  if (toCiClassId) params.toCiClassId = toCiClassId;

  const result = await listRelationshipTypeScopesAction(
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
    const result = await createRelationshipTypeScopeAction(body);

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
