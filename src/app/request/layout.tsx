import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, ClipboardList, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { getCopyrightText } from "@/config/branding";

export default function RequestPortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f7fb] text-slate-900 dark:bg-[#080d18] dark:text-slate-100">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_at_20%_0%,rgba(43,128,196,0.10),transparent_58%)] dark:bg-[radial-gradient(ellipse_at_20%_0%,rgba(53,114,196,0.20),transparent_58%)]" />
      <header className="relative z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#0c1322]/80">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-3 px-5 sm:px-8 lg:px-12">
          <Link href="/request" className="flex shrink-0 items-center gap-4" aria-label="TechHub request portal home">
            <Logo width={80} height={32} className="h-8" priority />
            <span className="hidden h-7 w-px bg-slate-200 sm:block dark:bg-white/20" aria-hidden="true" />
            <span className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">TechHub</span>
              <span className="text-[11px] font-medium tracking-wide text-slate-500 dark:text-slate-400">Request portal</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Portal navigation">
            <Link href="/workflows/requests?scope=mine" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 sm:text-sm dark:text-slate-300 dark:hover:bg-white/10">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">My requests</span>
            </Link>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold shadow-sm transition hover:border-slate-300 sm:px-4 sm:text-sm dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Workspace <ArrowUpRight className="hidden h-3.5 w-3.5 sm:block" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>
      <main className="relative z-10">{children}</main>
      <footer className="relative z-10 mt-16 border-t border-slate-200/70 dark:border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-7 text-xs text-slate-500 sm:px-8 lg:px-12 dark:text-slate-400">
          <span>{getCopyrightText()} · TechHub Service Requests</span>
          <span>For authorized barq employees</span>
        </div>
      </footer>
    </div>
  );
}
