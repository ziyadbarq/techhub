import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /* config options here */
  // Standalone output for Docker deployment
  output: "standalone",
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
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
  // Image optimization configuration
  images: {
    // Allow local avatar optimization
    localPatterns: [
      {
        pathname: "/uploads/avatars/**",
        search: "",
      },
      {
        pathname: "/logos/**",
        search: "",
      },
    ],
    // Remote patterns for SSO providers (Microsoft Graph)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "graph.microsoft.com",
        pathname: "/v1.0/users/*/photo/$value",
      },
      {
        protocol: "https",
        hostname: "**.blob.core.windows.net", // Azure Storage fallback
      },
    ],
    // Modern image formats with fallbacks
    formats: ["image/avif", "image/webp"],
    // Device sizes for responsive images
    deviceSizes: [32, 64, 128, 256, 384, 640, 750, 828, 1080, 1200],
    // Image sizes for different use cases
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Disable external SVG (security risk)
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Security headers
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";

    return [
      {
        source: "/:path*",
        headers: [
          // Prevent clickjacking attacks
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Control referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Restrict browser features
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // HSTS - only in production with HTTPS
          ...(isProduction
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
          // Content Security Policy
          // Note: 'unsafe-inline' and 'unsafe-eval' are needed for Next.js hydration and development
          // In production, consider using nonces for stricter CSP
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob: https://graph.microsoft.com https://*.blob.core.windows.net",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
