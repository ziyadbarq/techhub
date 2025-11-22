"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import {
  Laptop,
  DollarSign,
  MapPin,
  Users,
  ShieldAlert,
  FileCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UseCaseCardProps {
  icon: LucideIcon;
  team: string;
  description: string;
  examples: string[];
  index?: number;
}

/**
 * Use Case Card Component
 * Showcases how different teams use barq TechHub
 */
function UseCaseCard({
  icon: Icon,
  team,
  description,
  examples,
  index = 0,
}: UseCaseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="h-full"
    >
      <Card className="border-l-barq-yellow h-full border-l-4">
        <CardHeader>
          <div className="bg-barq-yellow/10 text-barq-yellow mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full">
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg">{team}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5 text-sm">
            {examples.map((example, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="bg-barq-yellow mt-1.5 h-1 w-1 flex-shrink-0 rounded-full" />
                <span className="text-muted-foreground">{example}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const TEAM_USE_CASES = [
  {
    icon: Laptop,
    team: "Technology Operations",
    description: "Device lifecycle and infrastructure",
    examples: [
      "Stock IN → Deploy → Track assignment",
      "Map CMDB dependencies for incident response",
      "Auto-sync devices from Intune/MDM",
      "Initiate disposal when end-of-life",
    ],
  },
  {
    icon: FileCheck,
    team: "Compliance & Audit",
    description: "SAMA audit readiness",
    examples: [
      "Export change logs for SAMA audits",
      "Review disposal certificates",
      "Run verification campaigns",
      "Generate filtered compliance reports",
    ],
  },
  {
    icon: DollarSign,
    team: "Finance & Procurement",
    description: "Cost tracking and optimization",
    examples: [
      "Monitor depreciation by category",
      "Track contract renewals",
      "Identify unused licenses",
      "Link POs to assets and vendors",
    ],
  },
  {
    icon: ShieldAlert,
    team: "Information Security",
    description: "Security and risk management",
    examples: [
      "Approve disposal requests",
      "Track patch compliance",
      "Analyze CMDB impact for changes",
      "Review access audit trails",
    ],
  },
  {
    icon: MapPin,
    team: "Facilities",
    description: "Physical inventory management",
    examples: [
      "Transfer assets between offices",
      "Deploy Conference Room Kits",
      "Track locations (building/floor/room)",
      "Coordinate disposal pickups",
    ],
  },
  {
    icon: Users,
    team: "HR & People Ops",
    description: "Employee lifecycle automation",
    examples: [
      "Reserve New Hire Kits in advance",
      "Auto-assign items on day 1",
      "Trigger returns on resignation",
      "Track partial returns",
    ],
  },
];

/**
 * Use Cases Section
 * Shows how different Barq teams benefit from the system
 */
export function UseCases() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {TEAM_USE_CASES.map((useCase, index) => (
        <UseCaseCard key={useCase.team} {...useCase} index={index} />
      ))}
    </div>
  );
}
