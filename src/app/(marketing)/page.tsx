import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { HeroSection } from "@/components/marketing/hero-section";
import { SectionContainer } from "@/components/marketing/section-container";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { TechStackBadges } from "@/components/marketing/tech-stack-badges";
import { UseCases } from "@/components/marketing/use-case-card";
import { FAQAccordion } from "@/components/marketing/faq-accordion";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { ValuePropositionSection } from "@/components/marketing/value-proposition-section";
import { getPageTitle, getPageDescription } from "@/config/branding";

export const metadata: Metadata = {
  title: getPageTitle("landing"),
  description: getPageDescription("landing"),
};

/**
 * Landing Page
 * Public-facing marketing page showcasing barq TechHub capabilities
 * Authenticated users are automatically redirected to /dashboard
 */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <MarketingNav />

      {/* Hero Section */}
      <HeroSection />

      {/* Value Proposition Section */}
      <SectionContainer id="value">
        <ValuePropositionSection />
      </SectionContainer>

      {/* Key Features Section */}
      <SectionContainer id="features" variant="alternate">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Platform Capabilities
          </h2>
          <p className="text-muted-foreground mx-auto max-w-3xl text-lg">
            16 integrated modules: Assets, CMDB, Disposals, Kits, Reservations,
            Contracts, Licenses, MDM, Webhooks.
          </p>
        </div>
        <FeatureGrid />
      </SectionContainer>

      {/* Use Cases Section */}
      <SectionContainer id="use-cases">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Team Workflows
          </h2>
          <p className="text-muted-foreground mx-auto max-w-3xl text-lg">
            Technology, Compliance, Finance, Security, Facilities, HR.
          </p>
        </div>
        <UseCases />
      </SectionContainer>

      {/* Tech Stack Section */}
      <SectionContainer id="technology" variant="alternate">
        <TechStackBadges />
      </SectionContainer>

      {/* FAQ Section */}
      <SectionContainer id="faq">
        <FAQAccordion />
      </SectionContainer>

      {/* Footer */}
      <MarketingFooter />
    </div>
  );
}
