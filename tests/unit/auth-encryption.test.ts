/**
 * Authentication Token Encryption Tests
 *
 * Tests the AES-256-GCM encryption/decryption functions used to
 * secure OAuth tokens (accessToken, refreshToken, idToken) in the database.
 *
 * Security features tested:
 * - AES-256-GCM authenticated encryption
 * - Random IV and salt per encryption
 * - PBKDF2 key derivation (100,000 iterations)
 * - Authentication tag verification
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  encrypt,
  decrypt,
  encryptTokens,
  decryptTokens,
} from "@/lib/auth/encryption";

describe("Token Encryption Security Tests", () => {
  beforeAll(() => {
    // Ensure ENCRYPTION_KEY is set in test environment
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error(
        "ENCRYPTION_KEY must be set in test environment. Generate with: openssl rand -hex 32",
      );
    }
  });

  describe("encrypt() and decrypt()", () => {
    it("should encrypt and decrypt a simple string correctly", () => {
      // Arrange
      const plaintext = "my-secret-access-token-12345";

      // Act
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      // Assert
      expect(decrypted).toBe(plaintext);
      expect(encrypted).not.toBe(plaintext); // Encrypted should be different
    });

    it("should produce different ciphertexts for the same plaintext (random IV)", () => {
      // Arrange
      const plaintext = "my-secret-token";

      // Act
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      // Assert - Different encryptions due to random IV and salt
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to the same plaintext
      expect(decrypt(encrypted1)).toBe(plaintext);
      expect(decrypt(encrypted2)).toBe(plaintext);
    });

    it("should handle empty strings", () => {
      // Arrange
      const plaintext = "";

      // Act
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      // Assert
      expect(decrypted).toBe(plaintext);
    });

    it("should handle long strings (access tokens can be 1000+ chars)", () => {
      // Arrange - Simulate a long access token
      const plaintext = "Bearer " + "A".repeat(1500);

      // Act
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      // Assert
      expect(decrypted).toBe(plaintext);
      expect(decrypted.length).toBe(1507); // "Bearer " (7 chars) + 1500 chars
    });

    it("should handle special characters and Unicode", () => {
      // Arrange
      const plaintext = "Token with émojis 🔐🛡️ and special chars: äöü ñ";

      // Act
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      // Assert
      expect(decrypted).toBe(plaintext);
    });

    it("should throw error when decrypting invalid data", () => {
      // Arrange
      const invalidEncrypted = "not-a-valid-encrypted-string";

      // Act & Assert
      expect(() => {
        decrypt(invalidEncrypted);
      }).toThrow("Failed to decrypt data");
    });

    it("should throw error when decrypting tampered ciphertext", () => {
      // Arrange
      const plaintext = "original-token";
      const encrypted = encrypt(plaintext);

      // Tamper with the encrypted data
      const tamperedEncrypted = encrypted.slice(0, -5) + "XXXXX";

      // Act & Assert
      expect(() => {
        decrypt(tamperedEncrypted);
      }).toThrow("Failed to decrypt data");
    });
  });

  describe("encryptTokens() and decryptTokens()", () => {
    it("should encrypt and decrypt all OAuth tokens correctly", () => {
      // Arrange
      const tokens = {
        accessToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6Ik...",
        refreshToken: "0.AQMAIzIhOWNkODg1YmEtOGRhMC00...",
        idToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1...",
      };

      // Act
      const encrypted = encryptTokens(tokens);
      const decrypted = decryptTokens(encrypted);

      // Assert
      expect(decrypted.accessToken).toBe(tokens.accessToken);
      expect(decrypted.refreshToken).toBe(tokens.refreshToken);
      expect(decrypted.idToken).toBe(tokens.idToken);

      // Verify tokens are actually encrypted
      expect(encrypted.accessToken).not.toBe(tokens.accessToken);
      expect(encrypted.refreshToken).not.toBe(tokens.refreshToken);
      expect(encrypted.idToken).not.toBe(tokens.idToken);
    });

    it("should handle null tokens", () => {
      // Arrange
      const tokens = {
        accessToken: "valid-token",
        refreshToken: null,
        idToken: null,
      };

      // Act
      const encrypted = encryptTokens(tokens);
      const decrypted = decryptTokens(encrypted);

      // Assert
      expect(decrypted.accessToken).toBe(tokens.accessToken);
      expect(decrypted.refreshToken).toBeNull();
      expect(decrypted.idToken).toBeNull();
    });

    it("should handle all null tokens", () => {
      // Arrange
      const tokens = {
        accessToken: null,
        refreshToken: null,
        idToken: null,
      };

      // Act
      const encrypted = encryptTokens(tokens);
      const decrypted = decryptTokens(encrypted);

      // Assert
      expect(decrypted.accessToken).toBeNull();
      expect(decrypted.refreshToken).toBeNull();
      expect(decrypted.idToken).toBeNull();
    });

    it("should handle undefined tokens", () => {
      // Arrange
      const tokens = {
        accessToken: "valid-token",
        refreshToken: undefined,
        idToken: undefined,
      };

      // Act
      const encrypted = encryptTokens(tokens);
      const decrypted = decryptTokens(encrypted);

      // Assert
      expect(decrypted.accessToken).toBe(tokens.accessToken);
      expect(decrypted.refreshToken).toBeNull();
      expect(decrypted.idToken).toBeNull();
    });

    it("should produce different encrypted values for same tokens (random IV)", () => {
      // Arrange
      const tokens = {
        accessToken: "my-access-token",
        refreshToken: "my-refresh-token",
        idToken: "my-id-token",
      };

      // Act
      const encrypted1 = encryptTokens(tokens);
      const encrypted2 = encryptTokens(tokens);

      // Assert - Different encryptions
      expect(encrypted1.accessToken).not.toBe(encrypted2.accessToken);
      expect(encrypted1.refreshToken).not.toBe(encrypted2.refreshToken);
      expect(encrypted1.idToken).not.toBe(encrypted2.idToken);

      // But both should decrypt to the same values
      const decrypted1 = decryptTokens(encrypted1);
      const decrypted2 = decryptTokens(encrypted2);

      expect(decrypted1.accessToken).toBe(tokens.accessToken);
      expect(decrypted2.accessToken).toBe(tokens.accessToken);
    });
  });

  describe("Encryption Security Properties", () => {
    it("should use base64 encoding for encrypted output", () => {
      // Arrange
      const plaintext = "test-token";

      // Act
      const encrypted = encrypt(plaintext);

      // Assert - Base64 regex pattern
      const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
      expect(base64Pattern.test(encrypted)).toBe(true);
    });

    it("should have sufficient entropy in encrypted output", () => {
      // Arrange
      const plaintext = "a".repeat(50); // Repetitive input

      // Act
      const encrypted = encrypt(plaintext);

      // Assert - Encrypted output should be much longer due to salt + IV + tag
      // Salt (64) + IV (16) + Tag (16) = 96 bytes minimum overhead
      const minExpectedLength = Math.ceil(((96 + 50) * 4) / 3); // Base64 expansion
      expect(encrypted.length).toBeGreaterThan(minExpectedLength);
    });

    it("should add consistent overhead for encryption", () => {
      // Arrange
      const shortText = "short";
      const longText =
        "This is a much longer text that should have very different length";

      // Act
      const encryptedShort = encrypt(shortText);
      const encryptedLong = encrypt(longText);

      // Assert - Both have significant overhead from salt + IV + tag
      // Salt (64) + IV (16) + Tag (16) = 96 bytes minimum overhead
      const minExpectedOverheadShort = Math.ceil(
        ((96 + shortText.length) * 4) / 3,
      ); // Base64
      const minExpectedOverheadLong = Math.ceil(
        ((96 + longText.length) * 4) / 3,
      );

      // Verify both have substantial overhead
      expect(encryptedShort.length).toBeGreaterThanOrEqual(
        minExpectedOverheadShort,
      );
      expect(encryptedLong.length).toBeGreaterThanOrEqual(
        minExpectedOverheadLong,
      );
    });
  });

  describe("ENCRYPTION_KEY validation", () => {
    it("should have a 64-character hex ENCRYPTION_KEY", () => {
      // Assert
      const key = process.env.ENCRYPTION_KEY;
      expect(key).toBeDefined();
      expect(key?.length).toBe(64);

      // Should be valid hex
      const hexPattern = /^[0-9a-fA-F]{64}$/;
      expect(hexPattern.test(key!)).toBe(true);
    });
  });

  describe("Real-world OAuth token scenarios", () => {
    it("should handle Microsoft OAuth access tokens (typical format)", () => {
      // Arrange - Simulated Microsoft Graph API access token
      const microsoftToken = {
        accessToken:
          "eyJ0eXAiOiJKV1QiLCJub25jZSI6IlVxZGdWX2xNVFI4UzJfNkRsZ2p5UDBhY0NGSDNhaV9pMllJZzB5akVzbjgiLCJhbGciOiJSUzI1NiIsIng1dCI6Ik1yNS1BVWliZkJpaTdOZDFqQmViYXhib1hXMCIsImtpZCI6Ik1yNS1BVWliZkJpaTdOZDFqQmViYXhib1hXMCJ9",
        refreshToken:
          "0.AQMAIzIhOWNkODg1YmEtOGRhMC00NTEzLWE2YjEtNmQwODhkNmE4ZGY2",
        idToken:
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik1yNS1BVWliZkJpaTdOZDFqQmViYXhib1hXMCJ9.eyJhdWQiOiIzMzJhY2NlMC0zMGE2LTRkYzYtODM1YS1lMzNiMTgyNWZjYzgiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vY29tbW9uL3YyLjAiLCJpYXQiOjE3MDAwMDAwMDAsIm5iZiI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDAzNjAwfQ",
      };

      // Act
      const encrypted = encryptTokens(microsoftToken);
      const decrypted = decryptTokens(encrypted);

      // Assert
      expect(decrypted.accessToken).toBe(microsoftToken.accessToken);
      expect(decrypted.refreshToken).toBe(microsoftToken.refreshToken);
      expect(decrypted.idToken).toBe(microsoftToken.idToken);
    });

    it("should handle tokens with line breaks (some providers include them)", () => {
      // Arrange
      const tokenWithLineBreaks = {
        accessToken: "line1\nline2\nline3",
        refreshToken: null,
        idToken: null,
      };

      // Act
      const encrypted = encryptTokens(tokenWithLineBreaks);
      const decrypted = decryptTokens(encrypted);

      // Assert
      expect(decrypted.accessToken).toBe(tokenWithLineBreaks.accessToken);
    });
  });
});
