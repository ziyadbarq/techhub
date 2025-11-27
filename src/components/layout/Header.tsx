"use client";

import { useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, Moon, Sun, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCommandPalette } from "@/components/search/command-palette-context";

export function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { setOpen } = useCommandPalette();

  // Memoize breadcrumb calculation - only recalculate when pathname changes
  const breadcrumbs = useMemo(() => {
    const segments =
      pathname
        ?.split("/")
        .filter(Boolean)
        .map((segment, index, array) => {
          const path = "/" + array.slice(0, index + 1).join("/");
          const label = segment
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          return { label, path };
        }) ?? [];

    // Add home breadcrumb if not on home page
    if (segments.length > 0) {
      return [{ label: "Home", path: "/" }, ...segments];
    }
    return segments;
  }, [pathname]);

  // Handle sign out - memoized to prevent unnecessary re-renders
  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    router.push("/login");
  }, [router]);

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 flex h-16 items-center gap-4 border-b pr-4 pl-16 backdrop-blur md:pr-6 md:pl-6">
      {/* Breadcrumbs */}
      <nav className="flex flex-1 items-center gap-2 text-sm">
        {breadcrumbs.length > 0 ? (
          breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center gap-2">
              {index > 0 && <span className="text-muted-foreground">/</span>}
              <Link
                href={crumb.path}
                className={cn(
                  "hover:text-foreground",
                  index === breadcrumbs.length - 1
                    ? "text-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                {crumb.label}
              </Link>
            </div>
          ))
        ) : (
          <span className="font-medium">Dashboard</span>
        )}
      </nav>

      {/* User Actions */}
      <div className="flex items-center gap-2">
        {/* Search Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="hover:bg-accent h-12 w-12 transition-colors md:h-9 md:w-9"
          aria-label="Search (⌘K)"
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="hover:bg-accent h-12 w-12 transition-colors md:h-9 md:w-9"
          aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          aria-pressed={resolvedTheme === "dark"}
        >
          <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild suppressHydrationWarning>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full md:h-9 md:w-9"
              aria-label="Open user menu"
            >
              <User className="h-5 w-5" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
