/**
 * Logger State Management
 *
 * This file is separated from logger.ts to break circular dependencies
 * between the logger and the DI container.
 *
 * The DI container needs to signal to the logger when initialization is complete,
 * but the logger needs to access the container to get the DI-based logger.
 *
 * By extracting just the state management, both modules can import this file
 * without creating a circular dependency.
 */

import type { Container } from "inversify";

/**
 * Flag indicating whether the DI container has been initialized.
 * When false, the logger uses a console-based fallback.
 * When true, the logger can safely access the DI container.
 */
let containerInitialized = false;

/**
 * Reference to the container getter function.
 * This avoids the need for require() in logger.ts which doesn't work in ESM.
 */
let containerGetter: (() => Container) | null = null;

/**
 * Check if container is initialized
 */
export function isContainerInitialized(): boolean {
  return containerInitialized;
}

/**
 * Get the container using the registered getter
 * Returns null if container is not initialized
 */
export function getContainerFromState(): Container | null {
  if (containerInitialized && containerGetter) {
    return containerGetter();
  }
  return null;
}

/**
 * Mark container as initialized so logger can start using DI
 * This should be called after container initialization is complete
 *
 * @param getter - Function to get the container instance
 */
export function markContainerInitialized(getter: () => Container): void {
  containerInitialized = true;
  containerGetter = getter;
}

/**
 * Reset logger state (for testing)
 * This should be called when the DI container is reset
 */
export function resetLoggerState(): void {
  containerInitialized = false;
  containerGetter = null;
}
