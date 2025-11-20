import { useEffect, useCallback, useRef } from "react";

export type ModifierKey = "ctrl" | "cmd" | "shift" | "alt" | "meta";

export interface ShortcutConfig {
  key: string;
  modifiers?: ModifierKey[];
  callback: (event: KeyboardEvent) => void;
  description?: string;
  preventDefault?: boolean;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: ShortcutConfig[];
  /**
   * If true, shortcuts will only work when no input/textarea/contenteditable is focused
   * @default true
   */
  preventInInputs?: boolean;
}

/**
 * Platform detection for showing correct modifier keys
 */
export const getPlatform = (): "mac" | "windows" | "linux" => {
  if (typeof window === "undefined") return "windows";

  const platform = window.navigator.platform.toLowerCase();
  if (platform.includes("mac")) return "mac";
  if (platform.includes("linux")) return "linux";
  return "windows";
};

/**
 * Get the display name for a modifier key based on platform
 */
export const getModifierDisplayName = (modifier: ModifierKey): string => {
  const platform = getPlatform();

  const displayNames: Record<ModifierKey, Record<string, string>> = {
    ctrl: { mac: "⌃", windows: "Ctrl", linux: "Ctrl" },
    cmd: { mac: "⌘", windows: "Ctrl", linux: "Ctrl" },
    shift: { mac: "⇧", windows: "Shift", linux: "Shift" },
    alt: { mac: "⌥", windows: "Alt", linux: "Alt" },
    meta: { mac: "⌘", windows: "Win", linux: "Super" },
  };

  return displayNames[modifier][platform];
};

/**
 * Format a keyboard shortcut for display
 */
export const formatShortcut = (shortcut: ShortcutConfig): string => {
  const platform = getPlatform();
  const modifiers = shortcut.modifiers || [];

  // On Mac, cmd and meta are the same, prefer cmd
  const filteredModifiers = modifiers.map((m) => {
    if (platform === "mac" && m === "ctrl") return "cmd";
    if (platform !== "mac" && (m === "cmd" || m === "meta")) return "ctrl";
    return m;
  });

  // Remove duplicates and sort
  const uniqueModifiers = [...new Set(filteredModifiers)];
  const sortOrder: ModifierKey[] = ["ctrl", "cmd", "alt", "shift", "meta"];
  uniqueModifiers.sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b));

  const modifierStr = uniqueModifiers
    .map(getModifierDisplayName)
    .join(platform === "mac" ? "" : "+");

  const keyDisplay =
    shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key;

  return modifierStr
    ? `${modifierStr}${platform === "mac" ? "" : "+"}${keyDisplay}`
    : keyDisplay;
};

/**
 * Check if an element is an input-like element where we should not trigger shortcuts
 */
const isInputElement = (element: Element | null): boolean => {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const isContentEditable = element.getAttribute("contenteditable") === "true";

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    isContentEditable
  );
};

/**
 * Check if the keyboard event matches the shortcut configuration
 */
const matchesShortcut = (
  event: KeyboardEvent,
  config: ShortcutConfig,
): boolean => {
  const platform = getPlatform();
  const modifiers = config.modifiers || [];

  // Normalize key comparison (case-insensitive)
  const eventKey = event.key.toLowerCase();
  const configKey = config.key.toLowerCase();

  if (eventKey !== configKey) return false;

  // Check modifiers
  const hasCtrl = event.ctrlKey;
  const hasCmd = event.metaKey;
  const hasShift = event.shiftKey;
  const hasAlt = event.altKey;

  // On Mac, treat cmd and ctrl as the same for shortcuts
  const wantsCtrlOrCmd =
    modifiers.includes("ctrl") ||
    modifiers.includes("cmd") ||
    modifiers.includes("meta");
  const hasCtrlOrCmd = platform === "mac" ? hasCmd : hasCtrl;

  const wantsShift = modifiers.includes("shift");
  const wantsAlt = modifiers.includes("alt");

  // Exact match required
  return (
    (wantsCtrlOrCmd ? hasCtrlOrCmd : !hasCtrlOrCmd) &&
    (wantsShift ? hasShift : !hasShift) &&
    (wantsAlt ? hasAlt : !hasAlt)
  );
};

/**
 * Hook to register global keyboard shortcuts
 * Returns a cleanup function that can be called to unregister all shortcuts
 */
export const useKeyboardShortcuts = ({
  shortcuts,
  preventInInputs = true,
}: UseKeyboardShortcutsOptions) => {
  // Use ref to always have the latest shortcuts without re-registering the event listener
  const shortcutsRef = useRef<ShortcutConfig[]>(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if we should ignore this event
      if (preventInInputs && isInputElement(document.activeElement)) {
        return;
      }

      // Find matching shortcut
      for (const config of shortcutsRef.current) {
        // Skip if disabled
        if (config.enabled === false) continue;

        if (matchesShortcut(event, config)) {
          // Prevent default browser behavior if specified
          if (config.preventDefault !== false) {
            event.preventDefault();
          }

          // Execute callback
          config.callback(event);
          break; // Only execute the first matching shortcut
        }
      }
    },
    [preventInInputs],
  );

  useEffect(() => {
    // Register event listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Return cleanup function
  return useCallback(() => {
    document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};
