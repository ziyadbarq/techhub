/**
 * useFocusTrap Hook
 *
 * Traps focus within a container element when active.
 * Essential for accessibility in modals, dialogs, and mobile menus.
 * Prevents keyboard users from tabbing to elements outside the container.
 */

"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

/**
 * Get all focusable elements within a container
 */
const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const selectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  return Array.from(container.querySelectorAll(selectors));
};

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isActive: boolean,
): void {
  useEffect(() => {
    if (!isActive || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const focusableElements = getFocusableElements(container);

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Store previously focused element to restore later
    const previouslyFocusedElement = document.activeElement as HTMLElement;

    // Focus first element when trap activates
    firstElement.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      // Only handle Tab key
      if (e.key !== "Tab") {
        return;
      }

      // Shift + Tab (moving backwards)
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      }
      // Tab (moving forwards)
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Add event listener
    container.addEventListener("keydown", handleTabKey);

    // Cleanup function
    return () => {
      container.removeEventListener("keydown", handleTabKey);
      // Restore focus to previously focused element
      if (previouslyFocusedElement) {
        previouslyFocusedElement.focus();
      }
    };
  }, [isActive, containerRef]);
}
