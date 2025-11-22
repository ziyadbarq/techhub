"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  FileCheck,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ValuePropCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  outcomes: string[];
  index?: number;
}

/**
 * Value Proposition Card Component
 * Showcases business outcomes and SAMA compliance benefits
 */
function ValuePropCard({
  icon: Icon,
  title,
  description,
  outcomes,
  index = 0,
}: ValuePropCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="h-full"
    >
      <Card className="border-t-barq-yellow h-full border-t-4">
        <CardHeader>
          <div className="bg-barq-yellow/10 text-barq-yellow mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg">
            <Icon className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-foreground text-sm font-semibold">
              Business Outcomes:
            </p>
            <ul className="space-y-2 text-sm">
              {outcomes.map((outcome, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="bg-barq-yellow mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
                  <span className="text-muted-foreground">{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const VALUE_PROPOSITIONS = [
  {
    icon: ShieldCheck,
    title: "SAMA Compliance",
    description:
      "Built for Saudi Arabia's financial services regulatory framework.",
    outcomes: [
      "Audit-ready documentation and disposal certificates",
      "Exportable compliance reports",
      "Immutable change history",
    ],
  },
  {
    icon: TrendingDown,
    title: "Cost Control",
    description:
      "Reduce wasteful spending on licenses, contracts, and emergency purchases.",
    outcomes: [
      "License allocation tracking",
      "Contract renewal alerts",
      "Depreciation and warranty monitoring",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Risk Mitigation",
    description:
      "Minimize security breaches and infrastructure outages through visibility.",
    outcomes: [
      "Secure disposal workflows",
      "CMDB dependency impact analysis",
      "Role-based access control",
    ],
  },
  {
    icon: FileCheck,
    title: "Operational Efficiency",
    description:
      "Automate manual workflows and eliminate administrative overhead.",
    outcomes: [
      "Asset kit automation",
      "Reservation conflict detection",
      "Automated stock tracking",
    ],
  },
];

/**
 * Value Proposition Section Component
 * Highlights business value for SAMA-regulated fintech operations
 */
export function ValuePropositionSection() {
  return (
    <div className="space-y-12">
      {/* Section Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-4 inline-flex items-center gap-2"
        >
          <Badge
            variant="outline"
            className="border-barq-yellow text-barq-yellow"
          >
            Enterprise ITAM
          </Badge>
          <Badge
            variant="outline"
            className="border-barq-yellow text-barq-yellow"
          >
            SAMA Compliant
          </Badge>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
        >
          Why Barq Assets?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-muted-foreground mx-auto max-w-3xl text-lg"
        >
          Four critical outcomes for SAMA-regulated fintech operations.
        </motion.p>
      </div>

      {/* Value Proposition Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {VALUE_PROPOSITIONS.map((prop, index) => (
          <ValuePropCard key={prop.title} {...prop} index={index} />
        ))}
      </div>

      {/* Statistics Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-barq-yellow/5 border-barq-yellow/20 rounded-lg border p-8"
      >
        <TooltipProvider delayDuration={200}>
          <div className="grid gap-8 text-center md:grid-cols-4">
            {/* Entity Types */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help transition-transform hover:scale-105">
                  <p className="text-barq-yellow mb-2 text-4xl font-bold">
                    26+
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Entity Types Tracked
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm" side="top">
                <div className="space-y-3">
                  <p className="text-barq-yellow text-sm font-semibold">
                    Entity Breakdown:
                  </p>
                  <div className="space-y-2.5">
                    <div>
                      <p className="text-barq-yellow/90 text-xs font-medium">
                        Layer 1 (Foundation): 11 entities
                      </p>
                      <p className="text-muted-foreground mt-0.5 ml-3 text-xs leading-relaxed">
                        OrganizationUnit, Person, Role, Location, Vendor,
                        Lifecycle models, Field definitions
                      </p>
                    </div>
                    <div>
                      <p className="text-barq-yellow/90 text-xs font-medium">
                        Layer 2 (Assets): 9 entities
                      </p>
                      <p className="text-muted-foreground mt-0.5 ml-3 text-xs leading-relaxed">
                        Asset, Category, Model, Assignment, Stock, Movements,
                        Warranty, Maintenance
                      </p>
                    </div>
                    <div>
                      <p className="text-barq-yellow/90 text-xs font-medium">
                        Layer 3 (Advanced ITAM): 26 entities
                      </p>
                      <p className="text-muted-foreground mt-0.5 ml-3 text-xs leading-relaxed">
                        Disposals (3), Kits (4), Reservations (2), CMDB (6),
                        Contracts (3), Licenses (4), Config (4)
                      </p>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Use Cases */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help transition-transform hover:scale-105">
                  <p className="text-barq-yellow mb-2 text-4xl font-bold">
                    115+
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Use Cases Implemented
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs" side="top">
                <div className="space-y-3">
                  <p className="text-barq-yellow text-sm font-semibold">
                    Use Case Breakdown:
                  </p>
                  <div className="space-y-1.5 text-xs">
                    <p>
                      <span className="text-barq-yellow/90 font-medium">
                        Asset Disposals:
                      </span>{" "}
                      11 use cases
                    </p>
                    <p>
                      <span className="text-barq-yellow/90 font-medium">
                        Asset Kits:
                      </span>{" "}
                      19 use cases
                    </p>
                    <p>
                      <span className="text-barq-yellow/90 font-medium">
                        Asset Reservations:
                      </span>{" "}
                      17 use cases
                    </p>
                    <p>
                      <span className="text-barq-yellow/90 font-medium">
                        CMDB:
                      </span>{" "}
                      28 use cases
                    </p>
                    <p>
                      <span className="text-barq-yellow/90 font-medium">
                        Contract Management:
                      </span>{" "}
                      17 use cases
                    </p>
                    <p>
                      <span className="text-barq-yellow/90 font-medium">
                        License Management:
                      </span>{" "}
                      23 use cases
                    </p>
                    <p className="text-muted-foreground mt-2.5 italic">
                      Plus foundation and asset management use cases
                    </p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Audit Trail */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help transition-transform hover:scale-105">
                  <p className="text-barq-yellow mb-2 text-4xl font-bold">
                    100%
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Audit Trail Coverage
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm" side="top">
                <div className="space-y-3">
                  <p className="text-barq-yellow text-sm font-semibold">
                    What's Tracked:
                  </p>
                  <div className="space-y-2">
                    <p className="text-barq-yellow/90 text-xs font-medium">
                      All entity changes logged with:
                    </p>
                    <div className="text-muted-foreground ml-3 space-y-1 text-xs">
                      <p>
                        • <span className="text-foreground/80">Who</span> made
                        the change (user ID)
                      </p>
                      <p>
                        • <span className="text-foreground/80">What</span> was
                        changed (entity type & ID)
                      </p>
                      <p>
                        • <span className="text-foreground/80">When</span> it
                        happened (timestamp)
                      </p>
                      <p>
                        • <span className="text-foreground/80">Why</span> it
                        changed (action & reason)
                      </p>
                    </div>
                    <p className="text-muted-foreground mt-2.5 text-xs leading-relaxed italic">
                      Covers Assets, CIs, Disposals, Kits, Reservations,
                      Contracts, Licenses, and all 26+ entities
                    </p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>

            {/* SAMA Compliance */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help transition-transform hover:scale-105">
                  <p className="text-barq-yellow mb-2 text-4xl font-bold">
                    SAMA
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Compliance Ready
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs" side="top">
                <div className="space-y-3">
                  <p className="text-barq-yellow text-sm font-semibold">
                    SAMA Requirements Met:
                  </p>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <p className="text-barq-yellow/90 font-medium">
                        Documentation & Audit:
                      </p>
                      <div className="text-muted-foreground mt-1 ml-3 space-y-0.5">
                        <p>• Immutable audit trails</p>
                        <p>• Exportable compliance reports</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-barq-yellow/90 font-medium">
                        Data Security:
                      </p>
                      <div className="text-muted-foreground mt-1 ml-3 space-y-0.5">
                        <p>• Disposal sanitization tracking</p>
                        <p>• Disposal certificates</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-barq-yellow/90 font-medium">
                        Access Control:
                      </p>
                      <div className="text-muted-foreground mt-1 ml-3 space-y-0.5">
                        <p>• Role-based permissions</p>
                        <p>• Temporal role assignments</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </motion.div>
    </div>
  );
}
