import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { IFileStorageService } from "@/core/services/file-storage.service.interface";

/**
 * Storage for files that must never be publicly reachable (policies,
 * request attachments).
 *
 * - Private GCS bucket whenever it is configured (every deployed
 *   environment).
 * - On a developer machine running `next dev` without GCS: a git-ignored
 *   folder in the project that is never served.
 * - Anything else fails closed. The app's general local storage writes to
 *   public/uploads, which anyone can open, so these files never go there.
 */
export interface PrivateFileStorage {
  upload(
    buffer: Buffer,
    fileName: string,
    contentType: string,
  ): Promise<string>;
  read(storedPath: string): Promise<Buffer>;
  remove(storedPath: string): Promise<void>;
}

export class PrivateStorageUnavailableError extends Error {
  constructor() {
    super("PRIVATE_GCS_STORAGE_REQUIRED");
    this.name = "PrivateStorageUnavailableError";
  }
}

export class PrivateFileNotFoundError extends Error {
  constructor() {
    super("FILE_NOT_FOUND");
    this.name = "PrivateFileNotFoundError";
  }
}

export function hasPrivateGcs(): boolean {
  return !!process.env.GCS_BUCKET_NAME && !!process.env.GCS_ATTACHMENTS_PREFIX;
}

/** `kb-dev/<uuid>.pdf`-style paths: the only ones a dev store will open. */
export function devPathPattern(prefix: string): RegExp {
  return new RegExp(`^${prefix}/[0-9a-f-]{36}(\\.[a-z0-9]{1,5})?$`);
}

export function createPrivateFileStorage(options: {
  /** Folder in the project root, e.g. ".knowledge-base-dev". */
  devDir: string;
  /** Stored-path prefix, e.g. "kb-dev". */
  devPrefix: string;
}): PrivateFileStorage {
  if (hasPrivateGcs()) {
    const storage = getContainer().get<IFileStorageService>(
      DI_TOKENS.IFileStorageService,
    );
    return {
      upload: (buffer, fileName, contentType) =>
        storage.uploadFile(buffer, fileName, contentType),
      read: (storedPath) => storage.readFile(storedPath, "binary"),
      remove: (storedPath) => storage.deleteFile(storedPath),
    };
  }
  if (process.env.NODE_ENV !== "development") {
    throw new PrivateStorageUnavailableError();
  }

  const root = path.join(process.cwd(), options.devDir);
  const pattern = devPathPattern(options.devPrefix);
  const resolve = (storedPath: string) => {
    if (!pattern.test(storedPath)) throw new PrivateFileNotFoundError();
    return path.join(root, storedPath.slice(options.devPrefix.length + 1));
  };
  return {
    async upload(buffer, fileName) {
      await mkdir(root, { recursive: true, mode: 0o700 });
      const ext = path.extname(fileName).toLowerCase();
      const safeExt = /^\.[a-z0-9]{1,5}$/.test(ext) ? ext : "";
      const storedPath = `${options.devPrefix}/${randomUUID()}${safeExt}`;
      await writeFile(resolve(storedPath), buffer, { mode: 0o600 });
      return storedPath;
    },
    async read(storedPath) {
      try {
        return await readFile(resolve(storedPath));
      } catch {
        // Bad path, or uploaded on another developer's machine.
        throw new PrivateFileNotFoundError();
      }
    },
    async remove(storedPath) {
      await rm(resolve(storedPath), { force: true });
    },
  };
}
