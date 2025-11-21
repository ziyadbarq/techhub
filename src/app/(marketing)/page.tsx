import type { Metadata } from "next";
import { HeroSection } from "@/components/marketing/hero-section";
import { SectionContainer } from "@/components/marketing/section-container";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { TechStackBadges } from "@/components/marketing/tech-stack-badges";
import { UseCases } from "@/components/marketing/use-case-card";
import { FAQAccordion } from "@/components/marketing/faq-accordion";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const metadata: Metadata = {
  title: "Barq Assets | Enterprise CMDB & ITAM System",
  description:
    "Complete asset and inventory management for Barq. Track devices, manage warranties, control inventory, and maintain full audit trails with enterprise-grade architecture.",
};

/**
 * Landing Page
 * Public-facing marketing page showcasing Barq Assets capabilities
 * Authenticated users are automatically redirected to /dashboard
 */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <HeroSection />

      {/* Key Features Section */}
      <SectionContainer id="features">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Comprehensive Asset Management
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Everything you need to track, manage, and optimize your technology
            assets in one powerful platform
          </p>
        </div>
        <FeatureGrid />
      </SectionContainer>

      {/* Use Cases Section */}
      <SectionContainer id="use-cases" variant="alternate">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Built for Every Team at Barq
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            From technology operations to finance, Barq Assets empowers every
            department with the tools they need
          </p>
        </div>
        <UseCases />
      </SectionContainer>

      {/* Tech Stack Section */}
      <SectionContainer id="technology">
        <TechStackBadges />
      </SectionContainer>

      {/* FAQ Section */}
      <SectionContainer id="faq" variant="alternate">
        <FAQAccordion />
      </SectionContainer>

      {/* Footer */}
      <MarketingFooter />
    </div>
  );
}
