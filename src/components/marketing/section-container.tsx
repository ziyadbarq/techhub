"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionContainerProps {
  children: ReactNode;
  className?: string;
  id?: string;
  variant?: "default" | "alternate";
}

/**
 * Section Container Component
 * Reusable wrapper for landing page sections with:
 * - Consistent padding and spacing
 * - Scroll-triggered fade-in animations
 * - Optional alternate background
 */
export function SectionContainer({
  children,
  className,
  id,
  variant = "default",
}: SectionContainerProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "w-full py-16 md:py-24 lg:py-32",
        variant === "alternate" && "bg-muted/30",
        className,
      )}
    >
      <div className="container mx-auto px-4 md:px-6">{children}</div>
    </motion.section>
  );
}
