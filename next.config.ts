import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Type checking enabled for production-ready builds
    // Can be disabled with SKIP_TYPE_CHECK=true for faster builds
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === "true",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Exclude server-only packages from client bundle
  serverExternalPackages: [
    "@prisma/client",
    "bullmq",
    "ioredis",
    "pino",
    "pino-pretty",
    "inversify",
    "reflect-metadata",
    "better-auth",
  ],
};

export default withBundleAnalyzer(nextConfig);
