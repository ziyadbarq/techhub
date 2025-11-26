/**
 * Persons Page Client Component
 * Combines directory features (table, cards, org chart) with CRUD operations
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Table, LayoutGrid, Network, Plus } from "lucide-react";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmployeeDirectoryDTO } from "@/interface-adapters/presenters/employee-directory.presenter";
import {
  listEmployeeDirectoryAction,
  getDirectoryFilterOptionsAction,
} from "@/interface-adapters/controllers/employee-directory.controller";
import { deletePersonAction } from "@/interface-adapters/controllers/person.controller";
import { DirectorySearch } from "@/components/employee-directory/directory-search";
import {
  DirectoryFilters,
  ActiveFilterPills,
} from "@/components/employee-directory/directory-filters";
import { TableView } from "./views/table-view";
import { CardGridView } from "./views/card-grid-view";
import { OrgChartView } from "@/components/employee-directory/views/org-chart-view";
import { ReportingChainDialog } from "@/components/employee-directory/reporting-chain-dialog";
import { PersonForm } from "./person-form";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

interface FilterOption {
  id: string;
  name: string;
  code?: string | null;
}

interface PersonsPageClientProps {
  initialPersons: EmployeeDirectoryDTO[];
  initialTotal: number;
}

type ViewType = "table" | "cards" | "orgchart";

export function PersonsPageClient({
  initialPersons,
  initialTotal,
}: PersonsPageClientProps) {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.PERSONS_CREATE);
  const canUpdate = hasPermission(PERMISSIONS.PERSONS_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.PERSONS_DELETE);

  // Data state
  const [persons, setPersons] =
    useState<EmployeeDirectoryDTO[]>(initialPersons);
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

  // CRUD state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] =
    useState<EmployeeDirectoryDTO | null>(null);
  const [deletingPerson, setDeletingPerson] =
    useState<EmployeeDirectoryDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reporting chain dialog state
  const [selectedPerson, setSelectedPerson] =
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

  // Reload data
  const reloadData = useCallback(async () => {
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
        setPersons(result.data.employees);
        setTotal(result.data.total);
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to load persons");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedDepartments, selectedLocations]);

  // Reload when filters change
  useEffect(() => {
    // Skip initial mount since we have initialPersons
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
      setPersons(initialPersons);
      setTotal(initialTotal);
      return;
    }

    reloadData();
  }, [
    searchQuery,
    selectedDepartments,
    selectedLocations,
    initialPersons,
    initialTotal,
    reloadData,
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
    (person: EmployeeDirectoryDTO) => {
      setSelectedPerson(person);
      setIsChainDialogOpen(true);
    },
    [],
  );

  // CRUD handlers
  const handleCreate = useCallback(() => {
    setEditingPerson(null);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((person: EmployeeDirectoryDTO) => {
    setEditingPerson(person);
    setIsFormOpen(true);
  }, []);

  const handleDeleteClick = useCallback((person: EmployeeDirectoryDTO) => {
    setDeletingPerson(person);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingPerson) return;

    setIsDeleting(true);
    try {
      const result = await deletePersonAction(deletingPerson.id);
      if (result.success) {
        toast.success("Person deleted successfully");
        setDeletingPerson(null);
        reloadData();
      } else {
        toast.error(result.error);
      }
    } catch (_error) {
      toast.error("Failed to delete person");
    } finally {
      setIsDeleting(false);
    }
  }, [deletingPerson, reloadData]);

  const handleFormSuccess = useCallback(() => {
    reloadData();
  }, [reloadData]);

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
          <h2 className="text-2xl font-bold">Persons</h2>
          <div className="text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <>
                {total} {total !== 1 ? "people" : "person"}
                {(searchQuery ||
                  selectedDepartments.length > 0 ||
                  selectedLocations.length > 0) && (
                  <span className="ml-1 text-sm">(filtered)</span>
                )}
              </>
            )}
          </div>
        </div>
        {canCreate && (
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Person
          </Button>
        )}
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
            persons={persons}
            isLoading={isLoading}
            onViewReportingChain={handleViewReportingChain}
            onEdit={canUpdate ? handleEdit : undefined}
            onDelete={canDelete ? handleDeleteClick : undefined}
          />
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          <CardGridView
            persons={persons}
            isLoading={isLoading}
            onViewReportingChain={handleViewReportingChain}
            onEdit={canUpdate ? handleEdit : undefined}
            onDelete={canDelete ? handleDeleteClick : undefined}
          />
        </TabsContent>

        <TabsContent
          value="orgchart"
          className="space-y-4"
          ref={chartContainerRef}
        >
          <OrgChartView
            employees={persons}
            isLoading={isLoading}
            onViewReportingChain={handleViewReportingChain}
          />
        </TabsContent>
      </Tabs>

      {/* Reporting Chain Dialog */}
      <ReportingChainDialog
        employee={selectedPerson}
        open={isChainDialogOpen}
        onOpenChange={setIsChainDialogOpen}
      />

      {/* Person Form Dialog */}
      <PersonForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingPerson(null);
        }}
        onSuccess={handleFormSuccess}
        person={
          editingPerson
            ? {
                id: editingPerson.id,
                firstName: editingPerson.firstName,
                lastName: editingPerson.lastName,
                middleName: null,
                email: editingPerson.email,
                phone: editingPerson.phone,
                employeeId: editingPerson.employeeId,
                organizationUnitId: editingPerson.orgUnitId,
                primaryRoleId: "", // Not available in directory DTO, form will need to fetch
                locationId: editingPerson.locationId,
                managerId: editingPerson.managerId,
                title: editingPerson.title,
                department: null,
                hireDate: null,
                terminationDate: null,
                isActive: editingPerson.isActive,
                metadata: null,
                createdAt: "",
                updatedAt: "",
              }
            : null
        }
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deletingPerson}
        onOpenChange={(open) => !open && setDeletingPerson(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        personName={deletingPerson?.fullName ?? ""}
      />
    </div>
  );
}
