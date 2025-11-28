/**
 * DocsAccordion Component
 * MDX-friendly accordion for collapsible content sections
 *
 * Usage in MDX:
 * <DocsAccordion>
 *   <DocsAccordionItem title="How do I reset my password?">
 *     Navigate to Settings → Security and click "Reset Password".
 *   </DocsAccordionItem>
 *   <DocsAccordionItem title="Where can I find audit logs?">
 *     Audit logs are available in Admin → System → Audit Logs.
 *   </DocsAccordionItem>
 * </DocsAccordion>
 *
 * Or use single item:
 * <DocsAccordionItem title="Advanced configuration" defaultOpen>
 *   Content here...
 * </DocsAccordionItem>
 */

"use client";

import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface DocsAccordionProps {
  children: React.ReactNode;
  /** Allow multiple items to be open at once */
  multiple?: boolean;
  /** Default open item value(s) */
  defaultValue?: string | string[];
  className?: string;
}

export function DocsAccordion({
  children,
  multiple = false,
  defaultValue,
  className,
}: DocsAccordionProps) {
  // Extract children and add unique values
  const items = React.Children.toArray(children);

  if (multiple) {
    return (
      <Accordion
        type="multiple"
        defaultValue={
          Array.isArray(defaultValue)
            ? defaultValue
            : defaultValue
              ? [defaultValue]
              : undefined
        }
        className={cn("my-6", className)}
      >
        {items.map((child, index) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(
              child as React.ReactElement<DocsAccordionItemProps>,
              {
                value: `item-${index}`,
              },
            );
          }
          return child;
        })}
      </Accordion>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={typeof defaultValue === "string" ? defaultValue : undefined}
      className={cn("my-6", className)}
    >
      {items.map((child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(
            child as React.ReactElement<DocsAccordionItemProps>,
            {
              value: `item-${index}`,
            },
          );
        }
        return child;
      })}
    </Accordion>
  );
}

interface DocsAccordionItemProps {
  /** Title shown in the accordion trigger */
  title: string;
  /** Content inside the accordion */
  children: React.ReactNode;
  /** Internal value for accordion state (auto-generated) */
  value?: string;
  /** Whether this item is open by default */
  defaultOpen?: boolean;
  className?: string;
}

export function DocsAccordionItem({
  title,
  children,
  value = "item-0",
  defaultOpen,
  className,
}: DocsAccordionItemProps) {
  // If used standalone (not inside DocsAccordion)
  const isStandalone = !value || value === "item-0";

  if (isStandalone && defaultOpen === undefined) {
    // Standalone usage - wrap in its own Accordion
    return (
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultOpen ? value : undefined}
        className={cn("my-4", className)}
      >
        <AccordionItem
          value={value}
          className="border-border rounded-lg border"
        >
          <AccordionTrigger className="px-4 hover:no-underline">
            <span className="text-left font-medium">{title}</span>
          </AccordionTrigger>
          <AccordionContent className="px-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {children}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  // Used inside DocsAccordion
  return (
    <AccordionItem value={value} className="border-border rounded-lg border">
      <AccordionTrigger className="px-4 hover:no-underline">
        <span className="text-left font-medium">{title}</span>
      </AccordionTrigger>
      <AccordionContent className="px-4">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {children}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
