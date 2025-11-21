"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface TechBadgeProps {
  name: string;
  description: string;
  index: number;
}

function TechBadge({ name, description, index }: TechBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
      className="group cursor-default"
    >
      <Badge
        variant="outline"
        className="group-hover:border-barq-yellow group-hover:bg-barq-yellow/10 px-4 py-2 text-sm transition-all"
      >
        <span className="font-semibold">{name}</span>
        <span className="text-muted-foreground ml-2">{description}</span>
      </Badge>
    </motion.div>
  );
}

const techStack = [
  { name: "Next.js 16", description: "with Turbopack" },
  { name: "React 19", description: "latest UI framework" },
  { name: "TypeScript 5.9", description: "type-safe" },
  { name: "Prisma 7", description: "+ PostgreSQL" },
  { name: "Clean Architecture", description: "maintainable" },
  { name: "InversifyJS", description: "dependency injection" },
  { name: "Zod", description: "validation" },
  { name: "shadcn/ui", description: "components" },
];

/**
 * Tech Stack Badges Component
 * Displays the modern technology stack with animated badges
 */
export function TechStackBadges() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-2xl font-bold">Enterprise-Grade Technology</h3>
        <p className="text-muted-foreground">
          Built with modern, battle-tested technologies for reliability and
          performance
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {techStack.map((tech, index) => (
          <TechBadge key={tech.name} {...tech} index={index} />
        ))}
      </div>
    </div>
  );
}
