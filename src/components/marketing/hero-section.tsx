"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, LogIn, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

/**
 * Hero Section Component
 * Landing page hero with tagline, subheading, and CTAs
 */
export function HeroSection() {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Background gradient */}
      <div className="from-barq-yellow/10 via-background to-barq-light-blue/10 absolute inset-0 bg-gradient-to-br" />

      {/* Content */}
      <div className="relative container mx-auto px-4 md:px-6">
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-16 text-center md:py-24">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Logo className="h-16 w-auto md:h-20" />
          </motion.div>

          {/* Tagline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-6 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Intelligent Asset Management{" "}
            <span className="from-barq-yellow to-barq-yellow/70 bg-gradient-to-r bg-clip-text text-transparent">
              for Modern Enterprises
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-muted-foreground mb-10 max-w-2xl text-lg sm:text-xl md:text-2xl"
          >
            Keep asset and inventory data clean, connected, and auditable. Built
            with enterprise-grade architecture for{" "}
            <span className="text-foreground font-semibold">
              Barq's operational excellence
            </span>
            .
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col gap-4 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
            >
              <Link href="/login">
                <LogIn className="mr-2 h-5 w-5" />
                Login to Dashboard
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="text-muted-foreground mt-16 flex flex-col items-center gap-2 text-sm"
          >
            <span>Scroll to explore features</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <ChevronDown className="text-barq-yellow h-6 w-6" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
