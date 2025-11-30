import { NextResponse, type NextRequest } from "next/server";
import Redis from "ioredis";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IDatabaseBackupRepository } from "@/core/repositories/database-backup.repository.interface";
import type { BackupProgressDto } from "@/interface-adapters/dtos/database-backup.dto";
import { requirePermission } from "@/lib/permissions/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { InsufficientPermissionsError } from "@/core/domain/errors/rbac-errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    try {
      await requirePermission(PERMISSIONS.DATABASE_BACKUP);
    } catch (error) {
      if (error instanceof InsufficientPermissionsError) {
        await requirePermission(PERMISSIONS.DATABASE_RESTORE);
      } else {
        throw error;
      }
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Backup id is required" },
        { status: 400 },
      );
    }

    const redisUrl = process.env.REDIS_URL;
    const container = getContainer();
    const repository = container.get<IDatabaseBackupRepository>(
      DI_TOKENS.IDatabaseBackupRepository,
    );

    const backup = await repository.findById(id);
    if (!backup) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const initial: BackupProgressDto = {
          backupId: id,
          status: backup.toJSON().status,
          stage: backup.toJSON().stage,
          percentage: backup.toJSON().percentage,
          currentStep: backup.toJSON().currentStep,
          errorMessage: backup.toJSON().errorMessage ?? undefined,
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(initial)}\n\n`),
        );

        if (!redisUrl) {
          controller.close();
          return;
        }

        const subscriber = new Redis(redisUrl);
        await subscriber.subscribe(`backup:progress:${id}`);

        const heartbeat = setInterval(() => {
          controller.enqueue(encoder.encode(": ping\n\n"));
        }, 15000);

        subscriber.on("message", (_channel, message) => {
          controller.enqueue(encoder.encode(`data: ${message}\n\n`));
          try {
            const data = JSON.parse(message) as BackupProgressDto;
            const status = String(data.status).toUpperCase();
            if (status === "COMPLETED" || status === "FAILED") {
              clearInterval(heartbeat);
              subscriber.quit();
              controller.close();
            }
          } catch (_error) {
            // ignore malformed data
          }
        });

        request.signal.addEventListener("abort", () => {
          clearInterval(heartbeat);
          subscriber.quit();
          controller.close();
        });
      },
      cancel() {
        // handled by abort
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const status =
      error instanceof InsufficientPermissionsError
        ? 403
        : error instanceof Error && error.message === "Not authenticated"
          ? 401
          : 500;

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to stream backup progress",
      },
      { status },
    );
  }
}
