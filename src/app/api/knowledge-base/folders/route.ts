import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/infrastructure/database/prisma/client";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { createKnowledgeFolderSchema } from "@/lib/knowledge-base/schema";
import { KnowledgeError, knowledgeErrorResponse, requireKnowledgeAccess } from "@/lib/knowledge-base/access";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireKnowledgeAccess(PERMISSIONS.KNOWLEDGE_BASE_VIEW);
    const folders = await prisma.knowledgeFolder.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true, name: true, parentId: true },
    });
    return NextResponse.json({ folders });
  } catch (error) {
    return knowledgeErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireKnowledgeAccess(PERMISSIONS.KNOWLEDGE_BASE_CREATE);
    if (Number(request.headers.get("content-length") ?? 0) > 4096) {
      throw new KnowledgeError(413, "FOLDER_REQUEST_TOO_LARGE");
    }
    const data = createKnowledgeFolderSchema.parse(await request.json());
    const created = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(88776111)`;
      if (data.parentId && !(await tx.knowledgeFolder.findUnique({ where: { id: data.parentId } }))) {
        throw new KnowledgeError(404, "PARENT_FOLDER_NOT_FOUND");
      }
      const existing = await tx.knowledgeFolder.findFirst({
        where: { parentId: data.parentId, name: data.name }, select: { id: true },
      });
      if (existing) throw new KnowledgeError(409, "FOLDER_NAME_EXISTS");
      const folder = await tx.knowledgeFolder.create({
        data: { name: data.name, parentId: data.parentId, createdById: userId, updatedById: userId },
      });
      await tx.auditLog.create({
        data: { userId, action: "knowledge:folder:create", entityType: "knowledge_folder", entityId: folder.id, changes: { name: folder.name, parentId: folder.parentId } },
      });
      return folder;
    });
    return NextResponse.json({ folder: created }, { status: 201 });
  } catch (error) {
    return knowledgeErrorResponse(error);
  }
}
