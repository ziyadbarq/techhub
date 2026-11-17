import "server-only";
import {
  createPrivateFileStorage,
  devPathPattern,
  PrivateFileNotFoundError,
  PrivateStorageUnavailableError,
} from "@/lib/storage/private-file-storage";
import { KnowledgeError } from "./access";

export { hasPrivateGcs } from "@/lib/storage/private-file-storage";

/**
 * Knowledge Base PDFs: private GCS, or on `next dev` without GCS the
 * git-ignored `.knowledge-base-dev/` folder. See private-file-storage.ts.
 */
export interface KnowledgePdfStorage {
  upload(buffer: Buffer, fileName: string): Promise<string>;
  read(storedPath: string): Promise<Buffer>;
  remove(storedPath: string): Promise<void>;
}

export const DEV_PDF_DIR = ".knowledge-base-dev";
const DEV_PREFIX = "kb-dev";
const DEV_PATH = devPathPattern(DEV_PREFIX);

export function isDevPdfPath(storedPath: string): boolean {
  return DEV_PATH.test(storedPath);
}

export function getKnowledgePdfStorage(): KnowledgePdfStorage {
  let storage;
  try {
    storage = createPrivateFileStorage({
      devDir: DEV_PDF_DIR,
      devPrefix: DEV_PREFIX,
    });
  } catch (error) {
    if (error instanceof PrivateStorageUnavailableError) {
      throw new KnowledgeError(503, "PRIVATE_GCS_STORAGE_REQUIRED");
    }
    throw error;
  }
  return {
    upload: (buffer, fileName) =>
      storage.upload(buffer, fileName, "application/pdf"),
    async read(storedPath) {
      try {
        return await storage.read(storedPath);
      } catch (error) {
        if (error instanceof PrivateFileNotFoundError) {
          throw new KnowledgeError(404, "PDF_NOT_FOUND");
        }
        throw error;
      }
    },
    async remove(storedPath) {
      try {
        await storage.remove(storedPath);
      } catch (error) {
        if (error instanceof PrivateFileNotFoundError) return;
        throw error;
      }
    },
  };
}
