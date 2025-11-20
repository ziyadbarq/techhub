/**
 * Task Filters Component
 *
 * Filter buttons for task status.
 */

"use client";

import { Button } from "@/components/ui/button";
import { TaskStatus } from "@/core/domain/entities/task.entity";

interface TaskFiltersProps {
  selectedStatus: TaskStatus | "ALL";
  onStatusChange: (status: TaskStatus | "ALL") => void;
}

export function TaskFilters({
  selectedStatus,
  onStatusChange,
}: TaskFiltersProps) {
  const filters = [
    { label: "All", value: "ALL" as const },
    { label: "Pending", value: TaskStatus.PENDING },
    { label: "In Progress", value: TaskStatus.IN_PROGRESS },
    { label: "Completed", value: TaskStatus.COMPLETED },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={selectedStatus === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusChange(filter.value)}
          className={
            selectedStatus === filter.value
              ? "bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
              : ""
          }
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
