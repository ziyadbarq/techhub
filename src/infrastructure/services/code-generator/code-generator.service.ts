/**
 * Code Generator Service Implementation
 *
 * Production-ready code generator implementation with:
 * - Database-backed sequence management
 * - Concurrent-safe code generation
 * - Timestamp-based code fallback
 * - Customizable formatting
 * - Scoped sequences for composite keys
 *
 * Architecture:
 * - Implements ICodeGeneratorService interface from core layer
 * - Uses Prisma for sequence persistence
 * - Configured via dependency injection
 * - Registered in DI container as singleton
 */

import { inject, injectable } from "inversify";
import type { PrismaClient } from "@/generated/prisma/server";
import type {
  ICodeGeneratorService,
  CodeGenerationOptions,
} from "@/core/services/code-generator.service.interface";
import { DI_TOKENS } from "@/di/types";
import type { ILoggerService } from "@/core/services/logger.service.interface";

/**
 * Default formatting options
 */
const DEFAULT_OPTIONS: Required<CodeGenerationOptions> = {
  padding: 6,
  includeTimestamp: false,
  separator: "-",
  scopeId: "",
};

/**
 * Code format validation regex
 * Allows uppercase letters, numbers, hyphens, and underscores
 */
const CODE_FORMAT_REGEX = /^[A-Z0-9_-]+$/;

/**
 * Code Generator Service implementation
 *
 * Generates unique codes for entities using database-backed sequences.
 * Supports sequential numbering, timestamp-based codes, and scoped sequences.
 *
 * Features:
 * - Atomic sequence increments (concurrent-safe)
 * - Upsert-based sequence management (creates if missing)
 * - Configurable padding and separators
 * - Timestamp-based codes for temporal uniqueness
 * - Scoped sequences for composite unique constraints
 * - Code format validation
 */
@injectable()
export class CodeGeneratorService implements ICodeGeneratorService {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  /**
   * Generate a unique code for an entity
   *
   * Uses database-backed sequence with atomic increment to ensure uniqueness.
   * Creates sequence entry if it doesn't exist (first-time generation).
   *
   * @param entityType - Type of entity (e.g., "VENDOR", "ASSET_KIT")
   * @param prefix - Prefix for the code (e.g., "VENDOR", "KIT")
   * @param options - Optional generation options
   * @returns Promise resolving to unique code (e.g., "VENDOR-000001")
   */
  async generateCode(
    entityType: string,
    prefix: string,
    options?: CodeGenerationOptions,
  ): Promise<string> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const timer = this.logger.startTimer("code-generator.generateCode");

    try {
      // Build entity type key (includes scope if provided)
      const entityTypeKey = opts.scopeId
        ? `${entityType}_${opts.scopeId}`
        : entityType;

      // Atomically increment sequence using upsert
      // This is concurrent-safe: database ensures uniqueness
      const sequence = await this.prisma.codeSequence.upsert({
        where: { entityType: entityTypeKey },
        create: {
          entityType: entityTypeKey,
          prefix,
          lastNumber: 1,
        },
        update: {
          lastNumber: { increment: 1 },
        },
      });

      // Format code with padding
      const paddedNumber = String(sequence.lastNumber).padStart(
        opts.padding,
        "0",
      );

      // Build code with optional timestamp
      let code: string;
      if (opts.includeTimestamp) {
        const timestamp = this.getTimestamp();
        code = `${prefix}${opts.separator}${timestamp}${opts.separator}${paddedNumber}`;
      } else {
        code = `${prefix}${opts.separator}${paddedNumber}`;
      }

      this.logger.endTimer(timer, {
        entityType: entityTypeKey,
        code,
        sequenceNumber: sequence.lastNumber,
      });

      this.logger.debug("Generated code", {
        entityType: entityTypeKey,
        prefix,
        code,
        sequenceNumber: sequence.lastNumber,
        scoped: !!opts.scopeId,
      });

      return code;
    } catch (error) {
      this.logger.error("Failed to generate code", error as Error, {
        entityType,
        prefix,
        options: opts,
      });
      throw error;
    }
  }

  /**
   * Generate a timestamp-based code
   *
   * Creates a code with embedded timestamp (YYYYMMDD format).
   * Uses a simple counter based on current milliseconds for sequence.
   *
   * @param prefix - Prefix for the code (e.g., "VENDOR")
   * @param options - Optional generation options
   * @returns Timestamp-based code (e.g., "VENDOR-20250122-000001")
   */
  generateTimestampCode(
    prefix: string,
    options?: CodeGenerationOptions,
  ): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const timestamp = this.getTimestamp();

    // Use milliseconds modulo for sequence (0-999999)
    const sequence = Date.now() % 1000000;
    const paddedSequence = String(sequence).padStart(opts.padding, "0");

    const code = `${prefix}${opts.separator}${timestamp}${opts.separator}${paddedSequence}`;

    this.logger.debug("Generated timestamp-based code", {
      prefix,
      code,
      timestamp,
      sequence,
    });

    return code;
  }

  /**
   * Validate code format
   *
   * Checks if a code matches the expected format:
   * - Uppercase letters (A-Z)
   * - Numbers (0-9)
   * - Hyphens (-)
   * - Underscores (_)
   *
   * @param code - Code to validate
   * @returns True if code format is valid
   */
  validateFormat(code: string): boolean {
    const isValid = CODE_FORMAT_REGEX.test(code);

    if (!isValid) {
      this.logger.debug("Invalid code format", { code });
    }

    return isValid;
  }

  /**
   * Get next sequence number without incrementing
   *
   * Retrieves the current sequence value without modifying it.
   * Returns 1 if sequence doesn't exist yet.
   *
   * @param entityType - Type of entity
   * @param scopeId - Optional scope identifier
   * @returns Promise resolving to next sequence number
   */
  async peekNextSequence(
    entityType: string,
    scopeId?: string,
  ): Promise<number> {
    const entityTypeKey = scopeId ? `${entityType}_${scopeId}` : entityType;

    const sequence = await this.prisma.codeSequence.findUnique({
      where: { entityType: entityTypeKey },
    });

    // If sequence doesn't exist, next number is 1
    const nextNumber = sequence ? sequence.lastNumber + 1 : 1;

    this.logger.debug("Peeked next sequence", {
      entityType: entityTypeKey,
      nextNumber,
      exists: !!sequence,
    });

    return nextNumber;
  }

  /**
   * Reset sequence for an entity type
   *
   * Resets the sequence counter to a specific value.
   * Use with caution: can cause duplicate codes if not coordinated.
   *
   * @param entityType - Type of entity
   * @param value - New sequence value (default: 0)
   * @param scopeId - Optional scope identifier
   * @returns Promise resolving when reset is complete
   */
  async resetSequence(
    entityType: string,
    value = 0,
    scopeId?: string,
  ): Promise<void> {
    const entityTypeKey = scopeId ? `${entityType}_${scopeId}` : entityType;

    await this.prisma.codeSequence.upsert({
      where: { entityType: entityTypeKey },
      create: {
        entityType: entityTypeKey,
        prefix: entityType,
        lastNumber: value,
      },
      update: {
        lastNumber: value,
      },
    });

    this.logger.warn("Sequence reset", {
      entityType: entityTypeKey,
      value,
      scopeId,
    });
  }

  /**
   * Get current timestamp in YYYYMMDD format
   *
   * @returns Timestamp string (e.g., "20250122")
   */
  private getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }
}
