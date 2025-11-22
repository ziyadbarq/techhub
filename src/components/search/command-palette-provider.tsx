"use client";

import * as React from "react";
import { CommandPalette } from "./command-palette";
import {
  CommandPaletteContextProvider,
  useCommandPalette,
} from "./command-palette-context";

function CommandPaletteRenderer() {
  const { open, setOpen } = useCommandPalette();
  return <CommandPalette open={open} onOpenChange={setOpen} />;
}

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CommandPaletteContextProvider>
      {children}
      <CommandPaletteRenderer />
    </CommandPaletteContextProvider>
  );
}
