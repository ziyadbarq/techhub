"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useShortcutsContext } from "@/components/providers/shortcuts-provider";
import { getPlatform } from "@/lib/hooks/use-keyboard-shortcuts";
import { Keyboard } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
  category: "Global" | "Editor" | "Navigation";
}

/**
 * Keyboard shortcuts help dialog
 * Shows all available keyboard shortcuts organized by category
 */
export function ShortcutsHelpDialog() {
  const { showHelpDialog, setShowHelpDialog } = useShortcutsContext();
  const platform = getPlatform();
  const isMac = platform === "mac";

  // Get the appropriate modifier key symbol/text
  const modKey = isMac ? "⌘" : "Ctrl";
  const shiftKey = isMac ? "⇧" : "Shift";

  // Define all shortcuts organized by category
  const shortcuts: Shortcut[] = [
    // Global shortcuts
    {
      keys: [modKey, "N"],
      description: "Create new presentation",
      category: "Global",
    },
    {
      keys: [modKey, "K"],
      description: "Open command palette",
      category: "Global",
    },
    {
      keys: [modKey, ","],
      description: "Open settings",
      category: "Global",
    },
    {
      keys: [modKey, "B"],
      description: "Toggle sidebar",
      category: "Global",
    },
    {
      keys: ["?"],
      description: "Show keyboard shortcuts",
      category: "Global",
    },
    {
      keys: ["Esc"],
      description: "Close dialog or cancel",
      category: "Global",
    },

    // Editor shortcuts (for future implementation)
    {
      keys: [modKey, "S"],
      description: "Save presentation",
      category: "Editor",
    },
    {
      keys: [modKey, "Z"],
      description: "Undo",
      category: "Editor",
    },
    {
      keys: [modKey, shiftKey, "Z"],
      description: "Redo",
      category: "Editor",
    },
    {
      keys: [modKey, "F"],
      description: "Find in presentation",
      category: "Editor",
    },
    {
      keys: [modKey, "H"],
      description: "Find and replace",
      category: "Editor",
    },

    // Navigation shortcuts
    {
      keys: [modKey, "P"],
      description: "Preview presentation",
      category: "Navigation",
    },
    {
      keys: [modKey, "E"],
      description: "Export presentation",
      category: "Navigation",
    },
    {
      keys: [modKey, "1"],
      description: "Go to presentations",
      category: "Navigation",
    },
    {
      keys: [modKey, "2"],
      description: "Go to templates",
      category: "Navigation",
    },
  ];

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, Shortcut[]>,
  );

  // Close dialog on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showHelpDialog) {
        setShowHelpDialog(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showHelpDialog, setShowHelpDialog]);

  return (
    <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>
            {isMac
              ? "Keyboard shortcuts to help you work faster on macOS"
              : "Keyboard shortcuts to help you work faster"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {Object.entries(groupedShortcuts).map(
            ([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="text-muted-foreground mb-3 text-sm font-semibold">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={`${category}-${index}`}
                      className="hover:bg-muted/50 flex items-center justify-between rounded-md px-3 py-2 transition-colors"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span
                            key={keyIndex}
                            className="flex items-center gap-1"
                          >
                            <kbd className="text-foreground bg-muted border-border rounded border px-2 py-1 text-xs font-semibold shadow-sm">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-muted-foreground text-xs">
                                +
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>

        <div className="border-t pt-4">
          <p className="text-muted-foreground text-xs">
            Press{" "}
            <kbd className="bg-muted border-border rounded border px-1.5 py-0.5 text-xs font-semibold">
              ?
            </kbd>{" "}
            to toggle this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
