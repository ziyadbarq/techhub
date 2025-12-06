/**
 * Two-Factor Authentication Configuration Entity
 *
 * Domain model for user's 2FA configuration including TOTP secrets,
 * backup codes, and device trust settings.
 *
 * This entity encapsulates the business rules for 2FA management:
 * - TOTP secret validation
 * - Backup code format validation
 * - Business logic for enabling/disabling 2FA
 *
 * Layer: Domain (Core)
 * Dependencies: None (pure domain model)
 */

/**
 * Two-Factor Configuration
 *
 * Represents a user's 2FA setup with TOTP secret and backup codes.
 * Immutable value object - use factory methods to create/modify.
 */
export class TwoFactorConfig {
  private constructor(
    public readonly userId: string,
    public readonly secret: string,
    public readonly backupCodes: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly id?: string,
  ) {
    this.validate();
  }

  /**
   * Create a new 2FA configuration
   *
   * @param userId - User ID owning this configuration
   * @param secret - Base32-encoded TOTP secret
   * @param backupCodes - JSON string of backup codes
   * @returns New TwoFactorConfig instance
   * @throws Error if validation fails
   */
  static create(params: {
    userId: string;
    secret: string;
    backupCodes: string;
    id?: string;
  }): TwoFactorConfig {
    const now = new Date();
    return new TwoFactorConfig(
      params.userId,
      params.secret,
      params.backupCodes,
      now,
      now,
      params.id,
    );
  }

  /**
   * Reconstitute from database
   *
   * @param data - Database record
   * @returns TwoFactorConfig instance
   */
  static fromPersistence(data: {
    id: string;
    userId: string;
    secret: string;
    backupCodes: string;
    createdAt: Date;
    updatedAt: Date;
  }): TwoFactorConfig {
    return new TwoFactorConfig(
      data.userId,
      data.secret,
      data.backupCodes,
      data.createdAt,
      data.updatedAt,
      data.id,
    );
  }

  /**
   * Update backup codes
   *
   * @param newBackupCodes - New backup codes JSON string
   * @returns New TwoFactorConfig instance with updated codes
   */
  updateBackupCodes(newBackupCodes: string): TwoFactorConfig {
    return new TwoFactorConfig(
      this.userId,
      this.secret,
      newBackupCodes,
      this.createdAt,
      new Date(),
      this.id,
    );
  }

  /**
   * Validate entity invariants
   *
   * Business rules:
   * - userId must be non-empty
   * - secret must be base32 format (A-Z2-7)
   * - backupCodes must be valid JSON
   *
   * @throws Error if validation fails
   */
  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error("TwoFactorConfig: userId is required");
    }

    if (!this.secret || this.secret.trim().length === 0) {
      throw new Error("TwoFactorConfig: secret is required");
    }

    // Validate base32 format (TOTP standard)
    const base32Regex = /^[A-Z2-7]+=*$/;
    if (!base32Regex.test(this.secret)) {
      throw new Error(
        "TwoFactorConfig: secret must be valid base32 (A-Z, 2-7)",
      );
    }

    if (!this.backupCodes || this.backupCodes.trim().length === 0) {
      throw new Error("TwoFactorConfig: backupCodes is required");
    }

    // Validate JSON format
    try {
      const codes = JSON.parse(this.backupCodes);
      if (!Array.isArray(codes)) {
        throw new Error("Backup codes must be an array");
      }
    } catch (error) {
      throw new Error(
        `TwoFactorConfig: backupCodes must be valid JSON array: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  /**
   * Get backup codes as array
   *
   * @returns Array of backup code strings
   */
  getBackupCodesArray(): string[] {
    return JSON.parse(this.backupCodes) as string[];
  }

  /**
   * Check if backup codes are available
   *
   * @returns True if at least one backup code exists
   */
  hasBackupCodes(): boolean {
    const codes = this.getBackupCodesArray();
    return codes.length > 0;
  }

  /**
   * Count remaining backup codes
   *
   * @returns Number of available backup codes
   */
  remainingBackupCodesCount(): number {
    return this.getBackupCodesArray().length;
  }

  /**
   * Convert to plain object for persistence
   *
   * @returns Plain object suitable for database storage
   */
  toPersistence(): {
    id?: string;
    userId: string;
    secret: string;
    backupCodes: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      userId: this.userId,
      secret: this.secret,
      backupCodes: this.backupCodes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
