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
process.env.LOG_LEVEL = "silent"; // Suppress all logs in test output

import { beforeAll, afterAll, vi } from "vitest";
import "reflect-metadata"; // Required for InversifyJS dependency injection

// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

// Global setup (runs once before all test files)
beforeAll(async () => {
  // Suppress console output during tests to keep output clean
  // Error logs from testing error handling scenarios are expected and not real failures
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "debug").mockImplementation(() => {});
});

// Global teardown (runs once after all test files)
afterAll(async () => {
  // Restore console methods
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
});
