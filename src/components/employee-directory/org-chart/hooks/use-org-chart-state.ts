/**
 * useOrgChartState Hook
 * Manages expansion state for org chart nodes
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EmployeeDirectoryDTO } from "@/interface-adapters/presenters/employee-directory.presenter";

interface UseOrgChartStateOptions {
  employees: EmployeeDirectoryDTO[];
  filteredEmployees: EmployeeDirectoryDTO[];
  rootEmployees: EmployeeDirectoryDTO[];
}

interface UseOrgChartStateReturn {
  expandedNodes: Set<string>;
  setExpandedNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
  handleToggleExpand: (id: string) => void;
  handleExpandAll: () => void;
  handleCollapseAll: () => void;
}

const areSetsEqual = (a: Set<string>, b: Set<string>): boolean =>
  a.size === b.size && [...a].every((value) => b.has(value));

export function useOrgChartState({
  employees,
  filteredEmployees,
  rootEmployees,
}: UseOrgChartStateOptions): UseOrgChartStateReturn {
  // Initialize expanded nodes with root employees
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const employeeMap = new Map(employees.map((emp) => [emp.id, emp]));
    const roots = employees.filter(
      (emp) => !emp.managerId || !employeeMap.has(emp.managerId),
    );
    return new Set(roots.map((emp) => emp.id));
  });

  const employeeIds = new Set(employees.map((emp) => emp.id));
  const previousRootIdsRef = useRef<string>("");

  // Auto-expand root nodes when employee list changes (e.g., parent filters change)
  useEffect(() => {
    const rootIds = rootEmployees
      .map((emp) => emp.id)
      .sort()
      .join(",");

    // Only update if roots actually changed
    if (rootIds === previousRootIdsRef.current) {
      return;
    }

    setExpandedNodes((previous) => {
      const next = new Set<string>();

      // Keep previously expanded nodes that still exist
      previous.forEach((id) => {
        if (employeeIds.has(id)) {
          next.add(id);
        }
      });

      // Auto-expand roots when list changes or when empty
      if (next.size === 0 || rootIds !== previousRootIdsRef.current) {
        rootEmployees.forEach((emp) => next.add(emp.id));
      }

      previousRootIdsRef.current = rootIds;

      if (areSetsEqual(previous, next)) {
        return previous;
      }

      return next;
    });
  }, [rootEmployees, employeeIds]);

  // Toggle node expansion
  const handleToggleExpand = useCallback((id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Expand all nodes with children
  const handleExpandAll = useCallback(() => {
    const allIds = new Set(
      filteredEmployees
        .filter((e) => e.directReportsCount > 0)
        .map((e) => e.id),
    );
    setExpandedNodes(allIds);
  }, [filteredEmployees]);

  // Collapse all nodes
  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  return {
    expandedNodes,
    setExpandedNodes,
    handleToggleExpand,
    handleExpandAll,
    handleCollapseAll,
  };
}
