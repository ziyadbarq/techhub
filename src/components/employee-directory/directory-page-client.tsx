/**
 * Employee Directory Page Client Component
 * Main client component with tabs for Table, Card Grid, and Org Chart views
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Table, LayoutGrid, Network } from "lucide-react";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmployeeDirectoryDTO } from "@/interface-adapters/presenters/employee-directory.presenter";
import {
  listEmployeeDirectoryAction,
  getDirectoryFilterOptionsAction,
} from "@/interface-adapters/controllers/employee-directory.controller";
import { DirectorySearch } from "./directory-search";
import { DirectoryFilters, ActiveFilterPills } from "./directory-filters";
import { TableView } from "./views/table-view";
import { CardGridView } from "./views/card-grid-view";
import { OrgChartView } from "./views/org-chart-view";
import { ReportingChainDialog } from "./reporting-chain-dialog";

interface FilterOption {
  id: string;
  name: string;
  code?: string | null;
}

interface DirectoryPageClientProps {
  initialEmployees: EmployeeDirectoryDTO[];
  initialTotal: number;
}

type ViewType = "table" | "cards" | "orgchart";

export function DirectoryPageClient({
  initialEmployees,
  initialTotal,
}: DirectoryPageClientProps) {
  // Data state
  const [employees, setEmployees] =
    useState<EmployeeDirectoryDTO[]>(initialEmployees);
  const [total, setTotal] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);

  // View state
  const [activeView, setActiveView] = useState<ViewType>("table");

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Filter options
  const [departments, setDepartments] = useState<FilterOption[]>([]);
  const [locations, setLocations] = useState<FilterOption[]>([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  // Reporting chain dialog state
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeDirectoryDTO | null>(null);
  const [isChainDialogOpen, setIsChainDialogOpen] = useState(false);

  // Load filter options on mount
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const result = await getDirectoryFilterOptionsAction();
        if (result.success) {
          setDepartments(result.data.departments);
          setLocations(result.data.locations);
        }
      } catch (_error) {
        // Silently fail, filters will just be empty
      } finally {
        setOptionsLoaded(true);
      }
    }
    loadFilterOptions();
  }, []);

  // Track if this is initial mount
  const isInitialMount = useRef(true);

  // Ref for scrolling to chart view
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Reload when filters change
  useEffect(() => {
    // Skip initial mount since we have initialEmployees
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // If no filters, reset to initial data
    if (
      !searchQuery &&
      selectedDepartments.length === 0 &&
      selectedLocations.length === 0
    ) {
      setEmployees(initialEmployees);
      setTotal(initialTotal);
      return;
    }

    // Load with filters
    async function loadEmployees() {
      setIsLoading(true);
      try {
        const result = await listEmployeeDirectoryAction({
          search: searchQuery || undefined,
          orgUnitIds:
            selectedDepartments.length > 0 ? selectedDepartments : undefined,
          locationIds:
            selectedLocations.length > 0 ? selectedLocations : undefined,
          isActive: true,
        });

        if (result.success) {
          setEmployees(result.data.employees);
          setTotal(result.data.total);
        } else {
          toast.error(result.error);
        }
      } catch (_error) {
        toast.error("Failed to load employees");
      } finally {
        setIsLoading(false);
      }
    }

    loadEmployees();
  }, [
    searchQuery,
    selectedDepartments,
    selectedLocations,
    initialEmployees,
    initialTotal,
  ]);

  // Filter handlers
  const handleRemoveDepartment = useCallback((id: string) => {
    setSelectedDepartments((prev) => prev.filter((d) => d !== id));
  }, []);

  const handleRemoveLocation = useCallback((id: string) => {
    setSelectedLocations((prev) => prev.filter((l) => l !== id));
  }, []);

  // Reporting chain handler
  const handleViewReportingChain = useCallback(
    (employee: EmployeeDirectoryDTO) => {
      setSelectedEmployee(employee);
      setIsChainDialogOpen(true);
    },
    [],
  );

  // Auto-scroll to chart when switching to orgchart view
  useEffect(() => {
    if (activeView === "orgchart" && chartContainerRef.current) {
      // Small delay to allow content to render
      setTimeout(() => {
        chartContainerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [activeView]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Employee Directory</h2>
          <div className="text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <>
                {total} employee{total !== 1 ? "s" : ""}
                {(searchQuery ||
                  selectedDepartments.length > 0 ||
                  selectedLocations.length > 0) && (
                  <span className="ml-1 text-sm">(filtered)</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <DirectorySearch
            value={searchQuery}
            onChange={setSearchQuery}
            className="flex-1"
          />
          {optionsLoaded && (
            <DirectoryFilters
              departments={departments}
              locations={locations}
              selectedDepartments={selectedDepartments}
              selectedLocations={selectedLocations}
              onDepartmentsChange={setSelectedDepartments}
              onLocationsChange={setSelectedLocations}
            />
          )}
        </div>

        {/* Active filter pills */}
        <ActiveFilterPills
          departments={departments}
          locations={locations}
          selectedDepartments={selectedDepartments}
          selectedLocations={selectedLocations}
          onRemoveDepartment={handleRemoveDepartment}
          onRemoveLocation={handleRemoveLocation}
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeView}
        onValueChange={(v) => setActiveView(v as ViewType)}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="table" className="gap-2">
            <Table className="h-4 w-4" />
            Table
          </TabsTrigger>
          <TabsTrigger value="cards" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Cards
          </TabsTrigger>
          <TabsTrigger value="orgchart" className="gap-2">
            <Network className="h-4 w-4" />
            Org Chart
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <TableView
            employees={employees}
            isLoading={isLoading}
            onViewReportingChain={handleViewReportingChain}
          />
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          <CardGridView
            employees={employees}
            isLoading={isLoading}
            onViewReportingChain={handleViewReportingChain}
          />
        </TabsContent>

        <TabsContent
          value="orgchart"
          className="space-y-4"
          ref={chartContainerRef}
        >
          <OrgChartView
            employees={employees}
            isLoading={isLoading}
            onViewReportingChain={handleViewReportingChain}
          />
        </TabsContent>
      </Tabs>

      {/* Reporting Chain Dialog */}
      <ReportingChainDialog
        employee={selectedEmployee}
        open={isChainDialogOpen}
        onOpenChange={setIsChainDialogOpen}
      />
    </div>
  );
}
