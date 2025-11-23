/**
 * Relationship Type Scope API Routes (by ID)
 * GET - Get a single relationship type scope
 * PUT - Update a relationship type scope
 * DELETE - Delete a relationship type scope
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getRelationshipTypeScopeAction,
  updateRelationshipTypeScopeAction,
  deleteRelationshipTypeScopeAction,
} from "@/interface-adapters/controllers/relationship-type-scope.controller";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const result = await getRelationshipTypeScopeAction(params.id);

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
    const result = await updateRelationshipTypeScopeAction(params.id, body);

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
  const result = await deleteRelationshipTypeScopeAction(params.id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
