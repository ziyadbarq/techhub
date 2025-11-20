/**
 * Vitest Global Setup
 *
 * This file runs once before all tests.
 * Sets up global test environment and utilities.
 */

// Set test environment variables BEFORE any imports
// This ensures they're available when modules are loaded
if (!process.env.ENCRYPTION_KEY) {
  // Test encryption key (32 bytes = 64 hex characters)
  // This is a test-only key, NOT for production use
  process.env.ENCRYPTION_KEY =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
}
process.env.LOG_LEVEL = "error"; // Reduce noise in test output

import { beforeAll, afterAll } from "vitest";
import "reflect-metadata"; // Required for InversifyJS dependency injection

// Global setup (runs once before all test files)
beforeAll(async () => {
  // Additional setup if needed
});

// Global teardown (runs once after all test files)
afterAll(async () => {
  // Cleanup if needed
});
