import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IFileStorageService } from "@/core/services/file-storage.service.interface";
import { KnowledgeError } from "./access";

/**
 * Where Knowledge Base PDFs live.
 *
 * - Private GCS bucket whenever it is configured (every deployed
 *   environment).
 * - On a developer machine running `next dev` without GCS: a private folder
 *   in the project (`.knowledge-base-dev/`, git-ignored, never served).
 * - Anything else fails closed. The app's general local storage writes to
 *   public/uploads, which anyone can open, so policies never go there.
 */
export interface KnowledgePdfStorage {
  upload(buffer: Buffer, fileName: string): Promise<string>;
  read(storedPath: string): Promise<Buffer>;
  remove(storedPath: string): Promise<void>;
}

export const DEV_PDF_DIR = ".knowledge-base-dev";
const DEV_PATH_PREFIX = "kb-dev/";
const DEV_PATH = /^kb-dev\/[0-9a-f-]{36}\.pdf$/;

export function hasPrivateGcs(): boolean {
  return !!process.env.GCS_BUCKET_NAME && !!process.env.GCS_ATTACHMENTS_PREFIX;
}

export function isDevPdfPath(storedPath: string): boolean {
  return DEV_PATH.test(storedPath);
}

export function getKnowledgePdfStorage(): KnowledgePdfStorage {
  if (hasPrivateGcs()) {
    const storage = getContainer().get<IFileStorageService>(DI_TOKENS.IFileStorageService);
    return {
      upload: (buffer, fileName) => storage.uploadFile(buffer, fileName, "application/pdf"),
      read: (storedPath) => storage.readFile(storedPath, "binary"),
      remove: (storedPath) => storage.deleteFile(storedPath),
    };
  }
  if (process.env.NODE_ENV === "development") return devStorage();
  throw new KnowledgeError(503, "PRIVATE_GCS_STORAGE_REQUIRED");
}

function devStorage(): KnowledgePdfStorage {
  const root = path.join(process.cwd(), DEV_PDF_DIR);
  const resolve = (storedPath: string) => {
    if (!isDevPdfPath(storedPath)) throw new KnowledgeError(404, "PDF_NOT_FOUND");
    return path.join(root, storedPath.slice(DEV_PATH_PREFIX.length));
  };
  return {
    async upload(buffer) {
      await mkdir(root, { recursive: true, mode: 0o700 });
      const storedPath = `${DEV_PATH_PREFIX}${randomUUID()}.pdf`;
      await writeFile(resolve(storedPath), buffer, { mode: 0o600 });
      return storedPath;
    },
    async read(storedPath) {
      try {
        return await readFile(resolve(storedPath));
      } catch (error) {
        if (error instanceof KnowledgeError) throw error;
        // e.g. uploaded on another developer's machine.
        throw new KnowledgeError(404, "PDF_NOT_FOUND");
      }
    },
    async remove(storedPath) {
      await rm(resolve(storedPath), { force: true });
    },
  };
}
