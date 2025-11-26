/**
 * useOrgChartFilters Hook
 * Manages highlight search and derived employee data for org chart
 * Note: Main filtering (department, location) is handled by parent page
 */

"use client";

import { useCallback, useMemo, useState } from "react";
import type { EmployeeDirectoryDTO } from "@/interface-adapters/presenters/employee-directory.presenter";

interface UseOrgChartFiltersOptions {
  /** Pre-filtered employees from parent page */
  employees: EmployeeDirectoryDTO[];
}

interface UseOrgChartFiltersReturn {
  // Highlight search state (visual only, doesn't filter)
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Derived data for layout
  employeeMap: Map<string, EmployeeDirectoryDTO>;
  departments: string[];
  /** All employees (no additional filtering - parent handles that) */
  filteredEmployees: EmployeeDirectoryDTO[];
  rootEmployees: EmployeeDirectoryDTO[];
  departmentHeads: Map<string, EmployeeDirectoryDTO>;
  /** Nodes matching highlight search */
  highlightedNodes: Set<string>;

  // Actions
  handleResetFilters: () => void;
}

export function useOrgChartFilters({
  employees,
}: UseOrgChartFiltersOptions): UseOrgChartFiltersReturn {
  // Highlight search - for visual highlighting only, not filtering
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Build employee lookup map
  const employeeMap = useMemo(() => {
    const map = new Map<string, EmployeeDirectoryDTO>();
    employees.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, [employees]);

  // Get unique departments (for display purposes)
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    employees.forEach((emp) => {
      if (emp.orgUnitName) deptSet.add(emp.orgUnitName);
    });
    return Array.from(deptSet).sort();
  }, [employees]);

  // No filtering here - parent already filtered employees
  // This is named "filtered" for API compatibility but returns all employees
  const filteredEmployees = employees;

  // Get department heads (topmost person per department)
  const departmentHeads = useMemo(() => {
    const heads = new Map<string, EmployeeDirectoryDTO>();

    employees.forEach((emp) => {
      const dept = emp.orgUnitName;
      if (!dept) return;

      const currentHead = heads.get(dept);
      if (!currentHead) {
        heads.set(dept, emp);
      } else {
        // Check if this employee is higher in the hierarchy
        const isRoot = !emp.managerId || !employeeMap.has(emp.managerId);
        const currentIsRoot =
          !currentHead.managerId || !employeeMap.has(currentHead.managerId);

        if (isRoot && !currentIsRoot) {
          heads.set(dept, emp);
        } else if (
          isRoot === currentIsRoot &&
          emp.directReportsCount > currentHead.directReportsCount
        ) {
          heads.set(dept, emp);
        }
      }
    });

    return heads;
  }, [employees, employeeMap]);

  // Find root employees (those without managers in current list)
  // Exclude standalone employees (no manager AND no direct reports)
  const rootEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const isRoot = !emp.managerId || !employeeMap.has(emp.managerId);
      // Standalone employees have no manager AND no reports - exclude from chart
      const isStandalone = !emp.managerId && emp.directReportsCount === 0;
      return isRoot && !isStandalone;
    });
  }, [employees, employeeMap]);

  // Get highlighted nodes from search (visual highlighting only)
  const highlightedNodes = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();

    const highlighted = new Set<string>();
    const query = searchQuery.toLowerCase();

    employees.forEach((emp) => {
      if (
        emp.fullName.toLowerCase().includes(query) ||
        emp.title?.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.orgUnitName.toLowerCase().includes(query)
      ) {
        highlighted.add(emp.id);
      }
    });

    return highlighted;
  }, [searchQuery, employees]);

  // Reset highlight search
  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    employeeMap,
    departments,
    filteredEmployees,
    rootEmployees,
    departmentHeads,
    highlightedNodes,
    handleResetFilters,
  };
}
