/**
 * Vitest Component Test Setup
 *
 * This file runs before component tests that use jsdom environment.
 * Sets up React Testing Library matchers and necessary mocks.
 * Only sets up DOM-related mocks when running in jsdom environment.
 */

import { vi } from "vitest";

// Only run DOM setup when in jsdom environment (has window defined)
if (typeof window !== "undefined") {
  // Import jest-dom matchers only in jsdom environment
  import("@testing-library/jest-dom/vitest");

  // Mock window.matchMedia for responsive components
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock ResizeObserver as a class
  class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  global.ResizeObserver = MockResizeObserver;

  // Mock IntersectionObserver as a class
  class MockIntersectionObserver {
    constructor(
      _callback: IntersectionObserverCallback,
      _options?: IntersectionObserverInit,
    ) {}
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    root = null;
    rootMargin = "";
    thresholds = [0];
    takeRecords = vi.fn(() => []);
  }
  global.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;

  // Mock scrollIntoView for cmdk and other components that use it
  Element.prototype.scrollIntoView = vi.fn();

  // Mock getComputedStyle if needed
  if (!window.getComputedStyle) {
    window.getComputedStyle = vi.fn(() => ({
      getPropertyValue: vi.fn(),
    })) as unknown as typeof window.getComputedStyle;
  }
}
