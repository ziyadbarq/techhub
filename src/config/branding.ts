/**
 * Centralized Branding Configuration
 * Single source of truth for all branding-related content
 *
 * Usage:
 * ```typescript
 * import { BRANDING, getCopyrightText } from "@/config/branding";
 *
 * // App name
 * const appName = BRANDING.app.name; // "barq TechHub"
 *
 * // Copyright
 * const copyright = getCopyrightText(); // "© 2025 Barq. All rights reserved."
 *
 * // Logo
 * <Image src={BRANDING.logos.icon.default} alt={BRANDING.app.name} />
 * ```
 */

export const BRANDING = {
  // App Identity
  app: {
    name: "TechHub",
    shortName: "TechHub",
    fullTitle: "barq TechHub | Enterprise CMDB & ITAM System",
  },

  // Company - small "b" per branding guidelines
  company: {
    name: "barq",
    legalName: "barq",
    website: "https://barq.com",
  },

  // Logos
  logos: {
    icon: {
      default: "/logos/barq-icon-black.png",
      whiteBG: "/logos/barq-icon-black-whiteBG-margined.png",
      // Browser tab icon: transparent, turns white on dark tab bars (SVG)
      favicon: "/logos/barq-favicon.svg?v=2",
      faviconPng: "/logos/barq-favicon-192.png?v=2",
    },
    full: {
      light: "/logos/logo-black.svg",
      dark: "/logos/logo-white.svg",
      fallback:
        "https://barq.com/wp-content/uploads/logo-black-barq-no-margins1.svg",
    },
  },

  // Taglines & Descriptions
  taglines: {
    main: "Enterprise CMDB & IT Asset Management for Financial Services",
    short: "Enterprise CMDB & ITAM system",
    hero: "Map dependencies, automate lifecycles, and stay audit-ready.",
    compliance: "Built for financial services compliance.",
    full: "Unified CMDB, lifecycle automation, Intune compliance monitoring, contracts, licenses, and service mapping — all in one platform for Technology Operations.",
    landing:
      "Enterprise CMDB & IT Asset Management built for regulated financial services operations. Map services, track assets end-to-end, enforce controls, and pass audits with confidence.",
    auth: "Enterprise CMDB & ITAM system built for financial services compliance and operational excellence.",
  },

  // Value Propositions
  valueProps: {
    heading: "Why barq TechHub?",
    subheading:
      "Four outcomes that power CMDB visibility, lifecycle automation, compliance, and financial control.",
  },

  // Footer Content
  footer: {
    description:
      "barq TechHub — Unified CMDB & IT Asset Management platform for Technology Operations.",
    deployment:
      "On-premises deployment with Intune sync, audit trails, and enterprise compliance controls.",
    builtBy: "Built by Barq Technology Team",
    builtFor: "Built for Technology Operations",
  },

  // Compliance Messaging
  compliance: {
    label: "Regulatory Compliance",
    regulator: "Internal platform for regulated financial services operations",
    ready: "Regulatory Compliance Ready",
    tagline:
      "Built for financial services regulatory compliance and audit readiness",
    internal: "Internal use only. All access is logged for compliance.",
    internalApproval:
      "Internal use only. Contact Technology Operations for access approval.",
    features: [
      "Immutable audit trails",
      "Disposal certificates",
      "Exportable compliance reports",
    ],
  },

  // Contact
  contact: {
    support: {
      email: "it-support@barq.com",
      text: "Contact Technology Operations",
      helpText: "Need help? Contact Technology Operations",
      approvalText: "Contact Technology Operations for access approval",
    },
  },

  // Copyright
  copyright: {
    text: "All rights reserved.",
    template: (year: number) => `© ${year} Barq. All rights reserved.`,
    withTagline: (year: number, tagline: string) =>
      `© ${year} Barq. ${tagline}`,
    currentYear: () => new Date().getFullYear(),
  },

  // AI Branding
  ai: {
    name: "barq technology",
    tagline: "Powered by barq technology",
  },

  // Metadata templates
  metadata: {
    title: {
      home: "barq TechHub | Enterprise CMDB & ITAM System",
      landing: "barq TechHub | Enterprise CMDB & ITAM System",
      auth: "barq TechHub",
    },
    description: {
      default:
        "Complete asset and inventory management for barq. Track devices, manage warranties, control inventory, and maintain full audit trails with enterprise-grade architecture.",
      landing:
        "Enterprise IT Asset Management and CMDB built for regulated financial services operations. Track assets, manage dependencies, ensure compliance, and pass audits with confidence.",
      auth: "Enterprise CMDB & ITAM system built for financial services compliance and operational excellence.",
    },
  },

  // FAQ
  faq: {
    heading: "Frequently Asked Questions",
    subheading: "Common questions about using barq TechHub",
  },

  // Auth Pages
  auth: {
    register: {
      heading: "Join the barq TechHub Team",
      subheading:
        "Get access to enterprise-grade ITAM & CMDB built for regulated financial services.",
      cta: "Create Account",
      ctaSubheading: "Join barq TechHub for compliant ITAM",
    },
    login: {
      heading: "Welcome Back",
      subheading: "Sign in to access your dashboard",
    },
    forgotPassword: {
      heading: "Reset Your Password",
      subheading: "Enter your email and we'll send you a reset link",
    },
    resetPassword: {
      heading: "Create New Password",
      subheading: "Choose a strong password for your account",
    },
    verifyEmail: {
      heading: "Email Verified",
      subheading: "Your email has been successfully verified",
    },
  },
} as const;

/**
 * Helper Functions
 */

/**
 * Get copyright text for the current or specified year
 * @param year - Optional year (defaults to current year)
 * @returns Copyright text (e.g., "© 2025 Barq. All rights reserved.")
 */
export function getCopyrightText(year?: number): string {
  return BRANDING.copyright.template(year ?? BRANDING.copyright.currentYear());
}

/**
 * Get copyright text with custom tagline
 * @param tagline - Custom tagline to append after company name
 * @param year - Optional year (defaults to current year)
 * @returns Copyright text with tagline (e.g., "© 2025 Barq. Built for Technology Operations.")
 */
export function getCopyrightWithTagline(
  tagline: string,
  year?: number,
): string {
  return BRANDING.copyright.withTagline(
    year ?? BRANDING.copyright.currentYear(),
    tagline,
  );
}

/**
 * Get page title from metadata templates
 * @param page - Page key from metadata.title
 * @returns Page title
 */
export function getPageTitle(
  page: keyof typeof BRANDING.metadata.title,
): string {
  return BRANDING.metadata.title[page];
}

/**
 * Get page description from metadata templates
 * @param page - Page key from metadata.description
 * @returns Page description
 */
export function getPageDescription(
  page: keyof typeof BRANDING.metadata.description,
): string {
  return BRANDING.metadata.description[page];
}

/**
 * Get logo path based on theme
 * @param theme - "light" or "dark"
 * @returns Logo SVG path
 */
export function getLogoPath(theme: "light" | "dark"): string {
  return theme === "dark"
    ? BRANDING.logos.full.dark
    : BRANDING.logos.full.light;
}
