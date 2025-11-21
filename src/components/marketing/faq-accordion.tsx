"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Who can access Barq Assets?",
    answer:
      "Barq Assets is available to all Barq employees with appropriate permissions. Access levels are configured based on your role and department within the organization.",
  },
  {
    question: "How do I request access or additional permissions?",
    answer:
      "Contact the Technology Operations team or your direct manager to request access. They will evaluate your needs and grant the appropriate permissions based on your role requirements.",
  },
  {
    question: "Can I track software licenses and contracts?",
    answer:
      "Yes, Barq Assets includes comprehensive license and contract management capabilities. You can track software licenses, vendor contracts, SLAs, and link them to assets and vendors.",
  },
  {
    question: "How does the warranty tracking work?",
    answer:
      "The system automatically tracks warranty end dates for all assets and provides expiration alerts. You can view active, expiring, and expired warranties, and receive notifications 30 days before expiration.",
  },
  {
    question: "Is my data secure and auditable?",
    answer:
      "Absolutely. Barq Assets features enterprise-grade role-based access control (RBAC), complete audit trails tracking all changes, and comprehensive logging for compliance and accountability.",
  },
  {
    question: "How do I report issues or request features?",
    answer:
      "You can submit issues, bug reports, or feature requests through the internal helpdesk system or contact the Technology Operations team directly. We continuously improve the platform based on user feedback.",
  },
  {
    question: "Can I customize asset categories and fields?",
    answer:
      "Yes, administrators can create custom asset categories and define custom fields using the Field Definitions feature. This allows the system to adapt to your specific asset tracking needs without code changes.",
  },
  {
    question: "How do I transfer assets between locations or employees?",
    answer:
      "Use the Stock Movements feature to record transfers. You can transfer assets between stock locations (warehouses) or reassign them to different employees, with full audit trail tracking.",
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
        <h2 className="mb-2 text-3xl font-bold">Frequently Asked Questions</h2>
        <p className="text-muted-foreground">
          Common questions about using Barq Assets
        </p>
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
