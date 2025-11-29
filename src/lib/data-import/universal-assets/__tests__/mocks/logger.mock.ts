/**
 * Mock Logger Service for Universal Assets Import Tests
 */

import { vi } from "vitest";

export function createMockLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(() => createMockLogger()),
    startTimer: vi.fn(() => ({ startTime: Date.now() })),
    endTimer: vi.fn(),
  };
}

export type MockLoggerService = ReturnType<typeof createMockLogger>;
