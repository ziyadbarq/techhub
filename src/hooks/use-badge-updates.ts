/**
 * useBadgeUpdates Hook
 *
 * Real-time badge updates for navigation items.
 * Provides a centralized system for updating badge counts dynamically.
 *
 * TODO: Integrate with WebSocket/SSE for real-time updates
 * TODO: Connect to actual notification/messaging system
 *
 * @example
 * ```tsx
 * const badges = useBadgeUpdates();
 * const messageCount = badges["/messages"] || "0";
 * ```
 */

"use client";

import { useState, useEffect } from "react";

/**
 * Badge registry type
 * Maps navigation href to badge value
 */
export type BadgeRegistry = Record<string, string | undefined>;

/**
 * Global badge state (singleton)
 *
 * Starts empty: no badge renders until a real source calls updateBadge.
 * (Earlier revisions shipped hardcoded demo counts here, which showed
 * fake notification numbers in the sidebar.)
 */
let globalBadges: BadgeRegistry = {};

/**
 * Subscribers for badge updates
 */
const subscribers = new Set<(badges: BadgeRegistry) => void>();

/**
 * Subscribe to badge updates
 */
function subscribe(callback: (badges: BadgeRegistry) => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/**
 * Notify all subscribers of badge changes
 */
function notifySubscribers(): void {
  subscribers.forEach((callback) => callback({ ...globalBadges }));
}

/**
 * Update a badge value
 */
export function updateBadge(href: string, value: string | undefined): void {
  if (globalBadges[href] !== value) {
    globalBadges[href] = value;
    notifySubscribers();
  }
}

/**
 * Increment badge count
 */
export function incrementBadge(href: string): void {
  const current = parseInt(globalBadges[href] || "0", 10);
  updateBadge(href, String(current + 1));
}

/**
 * Decrement badge count
 */
export function decrementBadge(href: string): void {
  const current = parseInt(globalBadges[href] || "0", 10);
  const newValue = Math.max(0, current - 1);
  updateBadge(href, newValue === 0 ? undefined : String(newValue));
}

/**
 * Clear a badge
 */
export function clearBadge(href: string): void {
  updateBadge(href, undefined);
}

/**
 * Get all badges
 */
export function getAllBadges(): BadgeRegistry {
  return { ...globalBadges };
}

/**
 * React hook for badge updates
 * Automatically subscribes to changes and re-renders
 */
export function useBadgeUpdates(): BadgeRegistry {
  const [badges, setBadges] = useState<BadgeRegistry>(getAllBadges());

  useEffect(() => {
    // Subscribe to updates
    const unsubscribe = subscribe(setBadges);

    // Cleanup subscription
    return unsubscribe;
  }, []);

  return badges;
}

/**
 * Initialize badge system with default values
 * Call this once at app startup
 */
export function initializeBadges(initialBadges: BadgeRegistry): void {
  globalBadges = { ...initialBadges };
  notifySubscribers();
}
