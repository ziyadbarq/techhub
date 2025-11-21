"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features?: string[];
  index?: number;
}

/**
 * Feature Card Component
 * Individual feature card with icon, title, description, and optional feature list
 */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  features,
  index = 0,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="group hover:border-barq-yellow/50 h-full border-2 transition-all hover:shadow-lg">
        <CardHeader>
          <div className="bg-barq-yellow/10 text-barq-yellow mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110">
            <Icon className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        {features && features.length > 0 && (
          <CardContent>
            <ul className="text-muted-foreground space-y-2 text-sm">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="bg-barq-yellow mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}
