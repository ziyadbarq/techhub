"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Marketing Navigation Component
 * Simple top navigation bar for marketing pages with logo, Enter button, and theme switcher
 */
export function MarketingNav() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center transition-opacity hover:opacity-80"
        >
          <Logo className="h-8 w-auto" />
        </Link>

        {/* Right Side: Theme Toggle + Enter Button */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="hover:bg-accent h-9 w-9 transition-colors"
            aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
            aria-pressed={resolvedTheme === "dark"}
          >
            <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Enter Button */}
          <Button
            asChild
            className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
          >
            <Link href="/login">Enter</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
