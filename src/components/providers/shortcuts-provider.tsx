"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { ShortcutConfig } from "@/lib/hooks/use-keyboard-shortcuts";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { toast } from "sonner";

interface ShortcutsContextValue {
  showHelpDialog: boolean;
  setShowHelpDialog: (show: boolean) => void;
  toggleSidebar: () => void;
  openNewPresentationDialog: () => void;
  openSettings: () => void;
  openCommandPalette: () => void;
}

const ShortcutsContext = createContext<ShortcutsContextValue | undefined>(
  undefined,
);

export const useShortcutsContext = () => {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error(
      "useShortcutsContext must be used within ShortcutsProvider",
    );
  }
  return context;
};

interface ShortcutsProviderProps {
  children: React.ReactNode;
  /**
   * Callback to toggle sidebar visibility
   */
  onToggleSidebar?: () => void;
  /**
   * Callback to open new presentation dialog
   */
  onNewPresentation?: () => void;
  /**
   * Callback to open settings
   */
  onOpenSettings?: () => void;
  /**
   * Callback to open command palette
   */
  onOpenCommandPalette?: () => void;
}

/**
 * Global keyboard shortcuts provider
 * Provides app-wide keyboard shortcuts and manages shortcut help dialog
 */
export function ShortcutsProvider({
  children,
  onToggleSidebar,
  onNewPresentation,
  onOpenSettings,
  onOpenCommandPalette,
}: ShortcutsProviderProps) {
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  // Handler functions
  const toggleSidebar = useCallback(() => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      toast.info("Sidebar toggle not implemented yet");
    }
  }, [onToggleSidebar]);

  const openNewPresentationDialog = useCallback(() => {
    if (onNewPresentation) {
      onNewPresentation();
    } else {
      // Try to trigger the dialog by clicking the button
      const newPresentationButton = document.querySelector(
        "[data-new-presentation-trigger]",
      ) as HTMLButtonElement;
      if (newPresentationButton) {
        newPresentationButton.click();
      } else {
        toast.info("New presentation shortcut - please implement handler");
      }
    }
  }, [onNewPresentation]);

  const openSettings = useCallback(() => {
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      toast.info("Settings shortcut - coming soon");
    }
  }, [onOpenSettings]);

  const openCommandPalette = useCallback(() => {
    if (onOpenCommandPalette) {
      onOpenCommandPalette();
    } else {
      toast.info("Command palette - coming soon");
    }
  }, [onOpenCommandPalette]);

  // Define global shortcuts
  const shortcuts: ShortcutConfig[] = [
    {
      key: "n",
      modifiers: ["cmd"],
      callback: () => openNewPresentationDialog(),
      description: "New presentation",
      preventDefault: true,
    },
    {
      key: "k",
      modifiers: ["cmd"],
      callback: () => openCommandPalette(),
      description: "Open command palette",
      preventDefault: true,
    },
    {
      key: ",",
      modifiers: ["cmd"],
      callback: () => openSettings(),
      description: "Open settings",
      preventDefault: true,
    },
    {
      key: "b",
      modifiers: ["cmd"],
      callback: () => toggleSidebar(),
      description: "Toggle sidebar",
      preventDefault: true,
    },
    {
      key: "?",
      modifiers: [],
      callback: () => setShowHelpDialog(true),
      description: "Show keyboard shortcuts",
      preventDefault: true,
    },
    {
      key: "/",
      modifiers: ["cmd"],
      callback: () => setShowHelpDialog(true),
      description: "Show keyboard shortcuts (alternative)",
      preventDefault: true,
    },
  ];

  // Register shortcuts
  useKeyboardShortcuts({
    shortcuts,
    preventInInputs: true,
  });

  const contextValue: ShortcutsContextValue = {
    showHelpDialog,
    setShowHelpDialog,
    toggleSidebar,
    openNewPresentationDialog,
    openSettings,
    openCommandPalette,
  };

  return (
    <ShortcutsContext.Provider value={contextValue}>
      {children}
    </ShortcutsContext.Provider>
  );
}
