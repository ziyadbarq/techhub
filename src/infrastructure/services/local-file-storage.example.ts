/**
 * LocalFileStorageService Usage Examples
 *
 * This file demonstrates how to use the LocalFileStorageService
 * in your use cases, controllers, and server actions.
 *
 * DO NOT import this file in production code - it's for reference only.
 */

import type { IFileStorageService } from "@/core/services/file-storage.service.interface";
import { DI_TOKENS } from "@/di/types";
import { getContainer } from "@/di/container";

// ================================================
// Example 1: Using in a Server Action
// ================================================

/**
 * Example server action for uploading a file
 */
export async function uploadFileAction(formData: FormData) {
  "use server";

  try {
    // Get file from form data
    const file = formData.get("file") as File;
    if (!file) {
      return { error: "No file provided" };
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Resolve file storage service from DI container
    const container = getContainer();
    const fileStorage = container.get<IFileStorageService>(
      DI_TOKENS.IFileStorageService,
    );

    // Upload file
    const storagePath = await fileStorage.uploadFile(
      buffer,
      file.name,
      file.type,
    );

    // Get public URL
    const fileUrl = fileStorage.getFileUrl(storagePath);

    // Return result
    return {
      success: true,
      storagePath, // Save this in database
      fileUrl, // Use this for display/download
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: buffer.length,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

// ================================================
// Example 2: Using in a Use Case
// ================================================

import { injectable, inject } from "inversify";
import type { ILoggerService } from "@/core/services/logger.service.interface";

/**
 * Example use case that uploads a file
 */
@injectable()
export class UploadAttachmentUseCase {
  constructor(
    @inject(DI_TOKENS.IFileStorageService)
    private readonly fileStorage: IFileStorageService,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: {
    file: Buffer;
    fileName: string;
    mimeType: string;
    targetId: string;
    targetType: string;
  }): Promise<{ storagePath: string; fileUrl: string }> {
    this.logger.info("Uploading attachment", {
      fileName: input.fileName,
      mimeType: input.mimeType,
      targetType: input.targetType,
      targetId: input.targetId,
    });

    try {
      // Upload file to storage
      const storagePath = await this.fileStorage.uploadFile(
        input.file,
        input.fileName,
        input.mimeType,
      );

      // Get public URL
      const fileUrl = this.fileStorage.getFileUrl(storagePath);

      this.logger.info("Attachment uploaded successfully", {
        storagePath,
        fileUrl,
      });

      return { storagePath, fileUrl };
    } catch (error) {
      this.logger.error(
        "Failed to upload attachment",
        error instanceof Error ? error : new Error(String(error)),
        { fileName: input.fileName },
      );
      throw error;
    }
  }
}

// ================================================
// Example 3: Deleting a File
// ================================================

@injectable()
export class DeleteAttachmentUseCase {
  constructor(
    @inject(DI_TOKENS.IFileStorageService)
    private readonly fileStorage: IFileStorageService,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(storagePath: string): Promise<void> {
    this.logger.info("Deleting attachment", { storagePath });

    try {
      // Check if file exists before deleting
      const exists = await this.fileStorage.fileExists(storagePath);
      if (!exists) {
        this.logger.warn("File not found for deletion", { storagePath });
        throw new Error(`File not found: ${storagePath}`);
      }

      // Delete file
      await this.fileStorage.deleteFile(storagePath);

      this.logger.info("Attachment deleted successfully", { storagePath });
    } catch (error) {
      this.logger.error(
        "Failed to delete attachment",
        error instanceof Error ? error : new Error(String(error)),
        { storagePath },
      );
      throw error;
    }
  }
}

// ================================================
// Example 4: Client-Side File Upload
// ================================================

/**
 * Example React component for file upload
 *
 * This would be in a .tsx file in your components folder.
 */
/*
"use client";

import { useState } from "react";

export function FileUploadForm() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const response = await uploadFileAction(formData);
      setResult(response);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" name="file" required />
      <button type="submit" disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {result?.success && (
        <div>
          <p>File uploaded successfully!</p>
          <p>Storage path: {result.storagePath}</p>
          <a href={result.fileUrl} download>
            Download file
          </a>
        </div>
      )}

      {result?.error && <p>Error: {result.error}</p>}
    </form>
  );
}
*/

// ================================================
// Example 5: Checking File Existence
// ================================================

export async function checkFileExists(storagePath: string): Promise<boolean> {
  const container = getContainer();
  const fileStorage = container.get<IFileStorageService>(
    DI_TOKENS.IFileStorageService,
  );

  return await fileStorage.fileExists(storagePath);
}

// ================================================
// Example 6: Getting File URL for Display
// ================================================

export function getFileDownloadUrl(storagePath: string): string {
  const container = getContainer();
  const fileStorage = container.get<IFileStorageService>(
    DI_TOKENS.IFileStorageService,
  );

  return fileStorage.getFileUrl(storagePath);
}

/**
 * Storage Path Format Examples:
 *
 * ✅ Correct formats:
 * - "uploads/2025/11/clq1234567890abcdef.pdf"
 * - "public/uploads/2025/11/clq9876543210xyz.png"
 * - "uploads/2025/01/clqabcdef123456.jpg"
 *
 * ❌ Invalid formats:
 * - "/uploads/2025/11/file.pdf" (absolute path)
 * - "uploads/../../../etc/passwd" (path traversal)
 * - "downloads/file.pdf" (wrong directory)
 * - "" (empty path)
 *
 * Generated URLs:
 * - Input: "uploads/2025/11/clq1234567890abcdef.pdf"
 * - Output: "/uploads/2025/11/clq1234567890abcdef.pdf"
 * - Use in HTML: <a href="/uploads/2025/11/clq1234567890abcdef.pdf" download>Download</a>
 */
