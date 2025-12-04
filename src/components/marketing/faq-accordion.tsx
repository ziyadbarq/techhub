"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BRANDING } from "@/config/branding";

const faqs = [
  {
    question: "Is barq TechHub compliant with financial regulations?",
    answer:
      "Yes. Immutable audit trails, disposal certificates, and exportable compliance reports. All changes logged with who, what, when, and why.",
  },
  {
    question: "What is the CMDB and why do we need it?",
    answer:
      "Configuration Management Database tracks infrastructure dependencies. Shows which systems depend on each other for impact analysis during incidents and changes.",
  },
  {
    question: "How does the asset disposal process work?",
    answer:
      "Workflow: PENDING → APPROVED → SANITIZED → COMPLETED. Multiple approvers, sanitization checklists, and auto-generated certificates.",
  },
  {
    question: "Can I reserve assets for future use?",
    answer:
      "Yes. Reserve for specific date/time ranges with automatic conflict detection. Availability checker shows free assets.",
  },
  {
    question: "What are Asset Kits?",
    answer:
      "Predefined bundles like 'New Hire Kit' (laptop + accessories). Checkout entire kits, track item status, process partial returns.",
  },
  {
    question: "How does license management work?",
    answer:
      "Track entitlements and allocations to persons, CIs, or assets. Real-time available vs. allocated quantities prevent over-purchasing.",
  },
  {
    question: "Can I track vendor contracts?",
    answer:
      "Yes. Create contract types, link to assets/CIs/licenses, track renewals, get alerts 30 days before expiration.",
  },
  {
    question: "How does MDM integration work?",
    answer:
      "Auto-sync devices from Intune/MDM platforms. Real-time compliance status, automated asset updates, device health monitoring.",
  },
  {
    question: "Who can access barq TechHub?",
    answer:
      "All barq employees with appropriate role-based permissions. Contact Technology Operations or your manager for access.",
  },
  {
    question: "Can I customize asset fields?",
    answer:
      "Yes. Add custom fields per category with validation rules, multiple data types, and UI grouping—no code changes needed.",
  },
  {
    question: "How do webhooks work?",
    answer:
      "Configure webhooks for asset lifecycle events. Real-time notifications to external systems with custom payload formatting.",
  },
  {
    question: "Is the system secure?",
    answer:
      "Yes. Granular RBAC, temporal role assignments, immutable audit trails, and comprehensive logging for compliance.",
  },
];

/**
 * FAQ Accordion Component
 * Frequently asked questions with expandable answers
 */
export function FAQAccordion() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-3xl font-bold">{BRANDING.faq.heading}</h2>
        <p className="text-muted-foreground">{BRANDING.faq.subheading}</p>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left font-semibold">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
