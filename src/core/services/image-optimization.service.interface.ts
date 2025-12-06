/**
 * Image Optimization Service Interface
 * Provides avatar image processing capabilities
 */

export interface AvatarOptimizationResult {
  /**
   * Map of variant sizes to public file paths
   */
  variants: {
    original: string; // /uploads/avatars/{userId}/original.{ext}
    32: string; // /uploads/avatars/{userId}/32.webp
    64: string; // /uploads/avatars/{userId}/64.webp
    128: string; // /uploads/avatars/{userId}/128.webp
    256: string; // /uploads/avatars/{userId}/256.webp
  };

  /**
   * Metadata about the uploaded image
   */
  metadata: {
    uploadedAt: string; // ISO 8601 timestamp
    originalFileName: string;
    originalMimeType: string;
    originalSizeBytes: number;
  };
}

export interface IImageOptimizationService {
  /**
   * Optimize avatar image and generate multiple size variants
   *
   * @param buffer - Image file buffer
   * @param userId - User ID for storage organization
   * @param originalFileName - Original file name (for metadata)
   * @returns Optimization result with variant paths and metadata
   *
   * @throws Error if image processing fails
   *
   * @example
   * const result = await optimizationService.optimizeAvatar(
   *   buffer,
   *   'clq123456',
   *   'profile.jpg'
   * );
   * console.log(result.variants[128]); // '/uploads/avatars/clq123456/128.webp'
   */
  optimizeAvatar(
    buffer: Buffer,
    userId: string,
    originalFileName: string,
  ): Promise<AvatarOptimizationResult>;

  /**
   * Delete all avatar variants for a user
   *
   * @param userId - User ID whose avatars should be deleted
   * @returns Promise that resolves when deletion is complete
   *
   * @example
   * await optimizationService.deleteAvatarVariants('clq123456');
   */
  deleteAvatarVariants(userId: string): Promise<void>;
}
