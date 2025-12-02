/**
 * Request Context Tests
 *
 * Tests AsyncLocalStorage-based request context propagation.
 */

import { describe, it, expect } from "vitest";
import {
  withRequestContext,
  getRequestContext,
  generateRequestId,
  updateRequestContext,
  getRequestDuration,
  extractRequestContext,
} from "@/lib/request-context";

describe("Request Context", () => {
  describe("withRequestContext", () => {
    it("should propagate context across async boundaries", async () => {
      const result = await withRequestContext(
        {
          requestId: "test-123",
          path: "/test",
          method: "GET",
        },
        async () => {
          const context = getRequestContext();
          expect(context?.requestId).toBe("test-123");
          expect(context?.path).toBe("/test");
          expect(context?.method).toBe("GET");

          // Test nested async operation
          await Promise.resolve();
          const contextAfterAsync = getRequestContext();
          expect(contextAfterAsync?.requestId).toBe("test-123");

          return "success";
        },
      );

      expect(result).toBe("success");

      // Context should be cleared outside
      expect(getRequestContext()).toBeUndefined();
    });

    it("should auto-generate requestId if not provided", async () => {
      await withRequestContext(
        {
          path: "/test",
          method: "GET",
        },
        async () => {
          const context = getRequestContext();
          expect(context?.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
        },
      );
    });

    it("should set default values for missing fields", async () => {
      await withRequestContext({}, async () => {
        const context = getRequestContext();
        expect(context?.path).toBe("unknown");
        expect(context?.method).toBe("unknown");
        expect(context?.startTime).toBeGreaterThan(0);
      });
    });

    it("should isolate contexts between concurrent requests", async () => {
      const [result1, result2] = await Promise.all([
        withRequestContext(
          { requestId: "req-1", path: "/1", method: "GET" },
          async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return getRequestContext()?.requestId;
          },
        ),
        withRequestContext(
          { requestId: "req-2", path: "/2", method: "POST" },
          async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return getRequestContext()?.requestId;
          },
        ),
      ]);

      expect(result1).toBe("req-1");
      expect(result2).toBe("req-2");
    });
  });

  describe("generateRequestId", () => {
    it("should generate unique request IDs", () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();

      expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it("should generate IDs with correct format", () => {
      const id = generateRequestId();
      const parts = id.split("_");

      expect(parts[0]).toBe("req");
      expect(parts[1]).toMatch(/^\d+$/); // timestamp
      expect(parts[2]).toMatch(/^[a-z0-9]+$/); // random string
    });
  });

  describe("updateRequestContext", () => {
    it("should update context within request scope", async () => {
      await withRequestContext(
        { requestId: "test-123", path: "/test", method: "GET" },
        async () => {
          const initial = getRequestContext();
          expect(initial?.userId).toBeUndefined();

          // Simulate adding userId after authentication
          updateRequestContext({ userId: "user-456" });

          const updated = getRequestContext();
          expect(updated?.userId).toBe("user-456");
          expect(updated?.requestId).toBe("test-123"); // Original data preserved
        },
      );
    });

    it("should do nothing if called outside request context", () => {
      // Should not throw
      updateRequestContext({ userId: "user-123" });
      expect(getRequestContext()).toBeUndefined();
    });
  });

  describe("getRequestDuration", () => {
    it("should return duration in milliseconds", async () => {
      await withRequestContext(
        { requestId: "test-123", path: "/test", method: "GET" },
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          const duration = getRequestDuration();

          expect(duration).toBeGreaterThanOrEqual(10);
          expect(duration).toBeLessThan(100); // Should be reasonably fast
        },
      );
    });

    it("should return undefined outside request context", () => {
      expect(getRequestDuration()).toBeUndefined();
    });
  });

  describe("extractRequestContext", () => {
    it("should extract context as plain object for logging", async () => {
      await withRequestContext(
        {
          requestId: "test-123",
          correlationId: "corr-456",
          userId: "user-789",
          path: "/test",
          method: "GET",
        },
        async () => {
          const extracted = extractRequestContext();

          expect(extracted).toBeDefined();
          expect(extracted?.requestId).toBe("test-123");
          expect(extracted?.correlationId).toBe("corr-456");
          expect(extracted?.userId).toBe("user-789");
          expect(extracted?.path).toBe("/test");
          expect(extracted?.method).toBe("GET");
          expect(extracted?.durationMs).toBeGreaterThanOrEqual(0);
          expect(extracted).not.toHaveProperty("startTime"); // Excluded from extraction
        },
      );
    });

    it("should return undefined outside request context", () => {
      expect(extractRequestContext()).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should handle context with extra fields", async () => {
      await withRequestContext(
        {
          requestId: "test-123",
          path: "/test",
          method: "GET",
          customField: "custom-value",
        } as never,
        async () => {
          const context = getRequestContext();
          expect((context as never)?.["customField"]).toBe("custom-value");
        },
      );
    });

    it("should handle errors without losing context", async () => {
      try {
        await withRequestContext(
          { requestId: "test-123", path: "/test", method: "GET" },
          async () => {
            const context = getRequestContext();
            expect(context?.requestId).toBe("test-123");

            throw new Error("Test error");
          },
        );
      } catch (error) {
        expect((error as Error).message).toBe("Test error");
      }

      // Context should still be cleared after error
      expect(getRequestContext()).toBeUndefined();
    });

    it("should handle deeply nested async operations", async () => {
      await withRequestContext(
        { requestId: "test-123", path: "/test", method: "GET" },
        async () => {
          const asyncOperation1 = async () => {
            await Promise.resolve();
            return getRequestContext()?.requestId;
          };

          const asyncOperation2 = async () => {
            await asyncOperation1();
            return getRequestContext()?.requestId;
          };

          const asyncOperation3 = async () => {
            await asyncOperation2();
            return getRequestContext()?.requestId;
          };

          const id = await asyncOperation3();
          expect(id).toBe("test-123");
        },
      );
    });
  });
});
