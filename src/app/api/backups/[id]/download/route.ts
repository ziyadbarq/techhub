import fs from "node:fs";
import { NextResponse, type NextRequest } from "next/server";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IDatabaseBackupRepository } from "@/core/repositories/database-backup.repository.interface";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { BackupStatus } from "@/core/domain/entities/database-backup.entity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission(PERMISSIONS.DATABASE_BACKUP);

    const { id } = await context.params;

    const container = getContainer();
    const repository = container.get<IDatabaseBackupRepository>(
      DI_TOKENS.IDatabaseBackupRepository,
    );

    const backup = await repository.findById(id);
    if (!backup || backup.toJSON().deletedAt) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    const backupData = backup.toJSON();
    if (backupData.status !== BackupStatus.COMPLETED) {
      return NextResponse.json(
        { error: "Backup is not completed yet" },
        { status: 409 },
      );
    }

    if (!fs.existsSync(backupData.filePath)) {
      return NextResponse.json(
        { error: "Backup file missing on disk" },
        { status: 404 },
      );
    }

    const stat = fs.statSync(backupData.filePath);
    const stream = fs.createReadStream(backupData.filePath);

    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/sql",
        "Content-Length": stat.size.toString(),
        "Content-Disposition": `attachment; filename="${backupData.filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Download failed" },
      { status: 500 },
    );
  }
}
