"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Laptop, DollarSign, MapPin, Users } from "lucide-react";
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
 * Showcases how different teams use Barq Assets
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
    description: "Streamline device management from warehouse to desk",
    examples: [
      "Track laptops, phones, and equipment assignments",
      "Manage stock levels and prevent shortages",
      "Monitor warranty expirations and plan replacements",
      "Handle employee onboarding and offboarding efficiently",
    ],
  },
  {
    icon: DollarSign,
    team: "Finance & Procurement",
    description: "Complete financial visibility and compliance",
    examples: [
      "Track asset costs, depreciation, and total value",
      "Link purchases to vendors and contracts",
      "Generate compliance reports for audits",
      "Monitor spending and budget allocation",
    ],
  },
  {
    icon: MapPin,
    team: "Facilities Management",
    description: "Manage physical assets across all locations",
    examples: [
      "Track office equipment and furniture",
      "Monitor asset transfers between offices",
      "Plan lifecycle replacements and disposals",
      "Maintain location-based inventory accuracy",
    ],
  },
  {
    icon: Users,
    team: "HR & People Operations",
    description: "Seamless employee asset lifecycle management",
    examples: [
      "Onboard new employees with equipment assignments",
      "Track who has what equipment",
      "Manage asset returns during offboarding",
      "Handle role changes and transfers",
    ],
  },
];

/**
 * Use Cases Section
 * Shows how different Barq teams benefit from the system
 */
export function UseCases() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {TEAM_USE_CASES.map((useCase, index) => (
        <UseCaseCard key={useCase.team} {...useCase} index={index} />
      ))}
    </div>
  );
}
