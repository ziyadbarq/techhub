/**
 * Card Grid View Component
 * Responsive card grid for employee directory
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";

import type { EmployeeDirectoryDTO } from "@/interface-adapters/presenters/employee-directory.presenter";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeCard } from "../employee-card";

interface CardGridViewProps {
  employees: EmployeeDirectoryDTO[];
  isLoading: boolean;
  onViewReportingChain?: (employee: EmployeeDirectoryDTO) => void;
}

export function CardGridView({
  employees,
  isLoading,
  onViewReportingChain,
}: CardGridViewProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="mb-2 text-lg font-medium">No employees found</h3>
        <p className="text-muted-foreground text-sm">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.05,
          },
        },
      }}
    >
      <AnimatePresence mode="popLayout">
        {employees.map((employee, index) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            index={index}
            onViewReportingChain={() => onViewReportingChain?.(employee)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
