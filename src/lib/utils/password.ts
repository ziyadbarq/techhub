/**
 * Password Utilities
 *
 * Provides secure password generation and hashing utilities
 * for user provisioning and password reset features.
 *
 * IMPORTANT: Uses Better Auth's crypto functions to ensure compatibility
 * with the authentication system. Better Auth uses scrypt-based hashing
 * with salt (not bcrypt).
 */

import {
  hashPassword as betterAuthHashPassword,
  verifyPassword as betterAuthVerifyPassword,
} from "better-auth/crypto";
import { randomBytes } from "crypto";

/**
 * Character sets for password generation
 */
const CHAR_SETS = {
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ", // Removed I, O for clarity
  lowercase: "abcdefghijkmnopqrstuvwxyz", // Removed l for clarity
  numbers: "23456789", // Removed 0, 1 for clarity
  symbols: "!@#$%^&*",
} as const;

export interface GeneratePasswordOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
}

/**
 * Generate a cryptographically secure random password
 *
 * @param options - Password generation options
 * @returns Generated password string
 *
 * @example
 * ```typescript
 * // Generate default password (16 chars with all character types)
 * const password = generateSecurePassword();
 *
 * // Generate custom password (12 chars, no symbols)
 * const password = generateSecurePassword({
 *   length: 12,
 *   includeSymbols: false
 * });
 * ```
 */
export function generateSecurePassword(
  options: GeneratePasswordOptions = {},
): string {
  const {
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options;

  // Build character pool
  let chars = "";
  if (includeUppercase) chars += CHAR_SETS.uppercase;
  if (includeLowercase) chars += CHAR_SETS.lowercase;
  if (includeNumbers) chars += CHAR_SETS.numbers;
  if (includeSymbols) chars += CHAR_SETS.symbols;

  if (chars.length === 0) {
    throw new Error(
      "At least one character set must be enabled for password generation",
    );
  }

  if (length < 8) {
    throw new Error("Password length must be at least 8 characters");
  }

  // Generate password using crypto.randomBytes for security
  const randomValues = randomBytes(length);
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = randomValues[i]! % chars.length;
    password += chars[randomIndex];
  }

  // Ensure password contains at least one character from each enabled set
  const requirements: Array<{
    required: boolean;
    charSet: string;
    name: string;
  }> = [
    { required: includeUppercase, charSet: CHAR_SETS.uppercase, name: "upper" },
    { required: includeLowercase, charSet: CHAR_SETS.lowercase, name: "lower" },
    { required: includeNumbers, charSet: CHAR_SETS.numbers, name: "number" },
    { required: includeSymbols, charSet: CHAR_SETS.symbols, name: "symbol" },
  ];

  for (const req of requirements) {
    if (req.required && !new RegExp(`[${req.charSet}]`).test(password)) {
      // Replace a random character with one from the missing set
      const randomIndex = randomBytes(1)[0]! % length;
      const charIndex = randomBytes(1)[0]! % req.charSet.length;
      password =
        password.substring(0, randomIndex) +
        req.charSet[charIndex] +
        password.substring(randomIndex + 1);
    }
  }

  return password;
}

/**
 * Hash a password using Better Auth's crypto (scrypt-based)
 *
 * @param plainPassword - Plain text password to hash
 * @returns Hashed password (format: salt:hash, 161 chars)
 *
 * @example
 * ```typescript
 * const hashed = await hashPassword("myPassword123!");
 * // Returns: "d3c64365568fb3848b370e74a289129c:9384341a6117d5eb..."
 * ```
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  if (!plainPassword || plainPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  return await betterAuthHashPassword(plainPassword);
}

/**
 * Verify a password against a hash using Better Auth's crypto
 *
 * @param plainPassword - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against (Better Auth format)
 * @returns True if password matches, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = await verifyPassword("myPassword123!", hashedPassword);
 * // Returns: true or false
 * ```
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return await betterAuthVerifyPassword({
    password: plainPassword,
    hash: hashedPassword,
  });
}
