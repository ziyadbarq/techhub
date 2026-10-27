/**
 * Google Cloud Storage implementation of IFileStorageService.
 *
 * Objects live under a single prefix in a private bucket, so nothing is
 * reachable without going through the application. Downloads are streamed by
 * a permission-checked route rather than handed out as signed URLs — a
 * signed URL is a bearer token for whoever holds it, and a signed asset
 * handover form carries an employee's name, number, email and signature.
 *
 * Credentials come from Application Default Credentials: Workload Identity
 * on GKE (the pod's service account), or `gcloud auth application-default
 * login` when running locally. No key file is stored anywhere.
 */

import { Storage, type Bucket } from "@google-cloud/storage";
import { inject, injectable } from "inversify";
import path from "path";

import { Attachment } from "@/core/domain/entities/attachment.entity";
import type { IFileStorageService } from "@/core/services/file-storage.service.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { DI_TOKENS } from "@/di/types";

/** Reads the bucket name; absent means GCS is not configured for this env. */
export function getGcsBucketName(): string | undefined {
  return process.env.GCS_BUCKET_NAME || undefined;
}

/**
 * Everything this app writes lives under one prefix inside the bucket.
 *
 * No default on purpose: dev uses "techhub-it-asset-attachments-dev" and
 * prod "techhub-it-asset-attachments", and a silent fallback would put one
 * environment's signed forms in the other's folder.
 */
function getPrefix(): string {
  const raw = (process.env.GCS_ATTACHMENTS_PREFIX ?? "").replace(
    /^\/+|\/+$/g,
    "",
  );
  if (!raw) {
    throw new Error(
      "GCS_ATTACHMENTS_PREFIX is required when GCS_BUCKET_NAME is set",
    );
  }
  return raw;
}

@injectable()
export class GcsFileStorageService implements IFileStorageService {
  private storage: Storage | null = null;

  constructor(
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  private bucket(): Bucket {
    const bucketName = getGcsBucketName();
    if (!bucketName) {
      throw new Error("GCS_BUCKET_NAME is not set");
    }

    this.storage ??= new Storage();
    return this.storage.bucket(bucketName);
  }

  /**
   * Keep every object under the configured prefix, and reject anything that
   * tries to climb out of it with "..".
   */
  private resolveObjectKey(storagePath: string): string {
    const prefix = getPrefix();
    const normalised = path.posix
      .normalize(storagePath.replace(/^\/+/, ""))
      .replace(/^(\.\.(\/|$))+/, "");

    if (normalised.includes("..")) {
      throw new Error(`Invalid storage path: ${storagePath}`);
    }

    return normalised.startsWith(`${prefix}/`)
      ? normalised
      : `${prefix}/${normalised}`;
  }

  async uploadFile(
    file: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<string> {
    const ext = path.extname(fileName).toLowerCase();
    if (!ext) {
      throw new Error(`File name must have an extension: ${fileName}`);
    }

    // Same magic-number check as the local backend: a renamed executable is
    // rejected before it ever reaches the bucket.
    await Attachment.validateFileContent(file, mimeType);

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const objectKey = this.resolveObjectKey(
      `${year}/${month}/${this.idGenerator.generateId()}${ext}`,
    );

    await this.bucket()
      .file(objectKey)
      .save(file, {
        contentType: mimeType,
        // Object-level ACLs are off on uniform-access buckets; IAM governs
        // reads, and nothing here grants public access.
        metadata: { cacheControl: "private, max-age=0, no-store" },
      });

    this.logger.info("File uploaded to GCS", {
      objectKey,
      sizeBytes: file.length,
      mimeType,
    });

    return objectKey;
  }

  async deleteFile(storagePath: string): Promise<void> {
    const objectKey = this.resolveObjectKey(storagePath);

    // ignoreNotFound keeps delete idempotent: a retry after a partial
    // failure should not blow up on an object that is already gone.
    await this.bucket().file(objectKey).delete({ ignoreNotFound: true });

    this.logger.info("File deleted from GCS", { objectKey });
  }

  /**
   * The bucket is private, so there is no public URL. Downloads go through
   * the application's own permission-checked route.
   */
  getFileUrl(storagePath: string): string {
    return `/api/attachments/download?path=${encodeURIComponent(
      this.resolveObjectKey(storagePath),
    )}`;
  }

  async fileExists(storagePath: string): Promise<boolean> {
    const [exists] = await this.bucket()
      .file(this.resolveObjectKey(storagePath))
      .exists();
    return exists;
  }

  async writeFile(filePath: string, content: string | Buffer): Promise<void> {
    await this.bucket()
      .file(this.resolveObjectKey(filePath))
      .save(content, { metadata: { cacheControl: "private, no-store" } });
  }

  async readFile(filePath: string, encoding?: "utf-8"): Promise<string>;
  async readFile(filePath: string, encoding: "binary"): Promise<Buffer>;
  async readFile(
    filePath: string,
    encoding: "utf-8" | "binary" = "utf-8",
  ): Promise<string | Buffer> {
    const objectKey = this.resolveObjectKey(filePath);
    const [contents] = await this.bucket().file(objectKey).download();

    return encoding === "binary" ? contents : contents.toString("utf-8");
  }
}
