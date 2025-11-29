"use client";

/**
 * Table of Contents Component
 * Auto-generated TOC from markdown headings with smooth scroll
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: TocHeading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0% 0% -80% 0%" },
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="border-border/60 bg-card/70 space-y-3 rounded-2xl border p-4 shadow-[0_12px_40px_-30px_rgba(0,0,0,0.7)] backdrop-blur">
      <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-[0.1em] uppercase">
        On This Page
      </p>
      <ul className="space-y-1">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
          >
            <button
              onClick={() => handleClick(heading.id)}
              className={cn(
                "hover:text-foreground text-muted-foreground w-full rounded-md px-2 py-1 text-left text-sm transition",
                activeId === heading.id &&
                  "text-foreground bg-emerald-400/10 ring-1 ring-emerald-300/30",
              )}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
