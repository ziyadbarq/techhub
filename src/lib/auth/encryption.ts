import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string;
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  throw new Error(
    "ENCRYPTION_KEY must be 64 hex characters (32 bytes). Generate with: openssl rand -hex 32",
  );
}

/**
 * Encrypt sensitive data (OAuth tokens) using AES-256-GCM
 */
export function encrypt(plaintext: string): string {
  try {
    // Generate random IV and salt
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Derive key from encryption key + salt
    const key = crypto.pbkdf2Sync(
      Buffer.from(ENCRYPTION_KEY, "hex"),
      salt,
      100000,
      32,
      "sha512",
    );

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get auth tag
    const tag = cipher.getAuthTag();

    // Combine: salt + iv + tag + encrypted data
    const result = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, "hex"),
    ]);

    return result.toString("base64");
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt encrypted data
 */
export function decrypt(encryptedData: string): string {
  try {
    // Decode from base64
    const buffer = Buffer.from(encryptedData, "base64");

    // Extract components
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH,
    );
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    // Derive key from encryption key + salt
    const key = crypto.pbkdf2Sync(
      Buffer.from(ENCRYPTION_KEY, "hex"),
      salt,
      100000,
      32,
      "sha512",
    );

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Decrypt
    let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Encrypt OAuth tokens before storing in database
 */
export function encryptTokens(tokens: {
  accessToken?: string | null;
  refreshToken?: string | null;
  idToken?: string | null;
}) {
  return {
    accessToken: tokens.accessToken ? encrypt(tokens.accessToken) : null,
    refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
    idToken: tokens.idToken ? encrypt(tokens.idToken) : null,
  };
}

/**
 * Decrypt OAuth tokens from database
 */
export function decryptTokens(tokens: {
  accessToken?: string | null;
  refreshToken?: string | null;
  idToken?: string | null;
}) {
  return {
    accessToken: tokens.accessToken ? decrypt(tokens.accessToken) : null,
    refreshToken: tokens.refreshToken ? decrypt(tokens.refreshToken) : null,
    idToken: tokens.idToken ? decrypt(tokens.idToken) : null,
  };
}
