/**
 * Data Export Handler
 *
 * Exports entity data to CSV or JSON files.
 * Files are written to data/exports/ for download via admin UI.
 */

import type { Job } from "bullmq";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import type { DataExportJobData } from "@/core/domain/jobs/job-data.types";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { ITaskRepository } from "@/core/repositories/task.repository.interface";
import type { ILoggerService } from "@/core/services";

const EXPORTS_DIR = join(process.cwd(), "data", "exports");

/** Safety cap to prevent OOM on large tables */
const MAX_EXPORT_ROWS = 50_000;

/**
 * Handles data export by querying entities and writing to file.
 *
 * @param job - BullMQ job instance
 * @returns Export result with file path and row count
 */
export async function handleDataExport(
  job: Job<DataExportJobData>,
): Promise<{ filePath: string; rowCount: number }> {
  const { exportType, format, userId } = job.data;

  const container = getContainer();
  const logger = container.get<ILoggerService>(DI_TOKENS.ILoggerService);

  logger.info("Starting data export", {
    jobId: job.id,
    exportType,
    format,
    userId,
  });

  await job.updateProgress(10);

  try {
    // Ensure exports directory exists
    await mkdir(EXPORTS_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const extension = format === "csv" ? "csv" : "json";
    const filename = `export-${exportType}-${timestamp}.${extension}`;
    const filePath = join(EXPORTS_DIR, filename);

    await job.updateProgress(20);

    // Fetch data based on export type
    let rows: Record<string, unknown>[];
    let wasTruncated = false;
    let fetchedRowCount = 0;

    switch (exportType) {
      case "tasks": {
        const taskRepository = container.get<ITaskRepository>(
          DI_TOKENS.ITaskRepository,
        );
        const tasks = await taskRepository.findAll({
          limit: MAX_EXPORT_ROWS + 1,
        });
        fetchedRowCount = tasks.length;
        wasTruncated = tasks.length > MAX_EXPORT_ROWS;
        rows = tasks.slice(0, MAX_EXPORT_ROWS).map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          createdBy: t.createdBy,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        }));
        break;
      }

      default:
        throw new Error(
          `Export type "${exportType}" is not yet supported. Supported types: tasks`,
        );
    }

    if (wasTruncated) {
      logger.warn("Export row limit reached, output was truncated", {
        jobId: job.id,
        exportType,
        maxRows: MAX_EXPORT_ROWS,
        fetchedRows: fetchedRowCount,
        exportedRows: rows.length,
      });
    }

    await job.updateProgress(70);

    // Write file
    let content: string;
    if (format === "csv") {
      content = toCsv(rows);
    } else {
      content = JSON.stringify(rows, null, 2);
    }

    await writeFile(filePath, content, "utf-8");

    await job.updateProgress(100);

    logger.info("Data export completed", {
      jobId: job.id,
      filePath: filename,
      rowCount: rows.length,
      format,
      exportType,
    });

    return { filePath: filename, rowCount: rows.length };
  } catch (error) {
    logger.error(
      "Data export failed",
      error instanceof Error ? error : new Error(String(error)),
      { jobId: job.id },
    );
    throw error;
  }
}

/**
 * Convert an array of objects to CSV string.
 * Handles quoting of values containing commas or newlines.
 */
function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];

  for (const row of rows) {
    const values = headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      const str = String(val);
      // Quote if contains comma, newline, or double-quote
      if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    lines.push(values.join(","));
  }

  return lines.join("\n");
}
