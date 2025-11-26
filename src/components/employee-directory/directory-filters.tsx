/**
 * Directory Filters Component
 * Filter panel for departments and locations
 */

"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface FilterOption {
  id: string;
  name: string;
  code?: string | null;
}

interface DirectoryFiltersProps {
  departments: FilterOption[];
  locations: FilterOption[];
  selectedDepartments: string[];
  selectedLocations: string[];
  onDepartmentsChange: (ids: string[]) => void;
  onLocationsChange: (ids: string[]) => void;
}

interface MultiSelectFilterProps {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  placeholder = "Search...",
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 justify-start gap-2",
            selected.length > 0 && "border-primary",
          )}
        >
          {label}
          {selected.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 rounded-full px-1.5 text-xs"
            >
              {selected.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option.id);
                return (
                  <CommandItem
                    key={option.id}
                    value={option.name}
                    onSelect={() => toggleOption(option.id)}
                  >
                    <div
                      className={cn(
                        "border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="truncate">{option.name}</span>
                    {option.code && (
                      <span className="text-muted-foreground ml-auto text-xs">
                        {option.code}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function DirectoryFilters({
  departments,
  locations,
  selectedDepartments,
  selectedLocations,
  onDepartmentsChange,
  onLocationsChange,
}: DirectoryFiltersProps) {
  const totalFilters = selectedDepartments.length + selectedLocations.length;

  const clearAllFilters = () => {
    onDepartmentsChange([]);
    onLocationsChange([]);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MultiSelectFilter
        label="Department"
        options={departments}
        selected={selectedDepartments}
        onChange={onDepartmentsChange}
        placeholder="Search departments..."
      />

      <MultiSelectFilter
        label="Location"
        options={locations}
        selected={selectedLocations}
        onChange={onLocationsChange}
        placeholder="Search locations..."
      />

      {totalFilters > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-9 gap-1 px-2"
        >
          <X className="h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
}

/**
 * Active filter pills display
 */
interface ActiveFilterPillsProps {
  departments: FilterOption[];
  locations: FilterOption[];
  selectedDepartments: string[];
  selectedLocations: string[];
  onRemoveDepartment: (id: string) => void;
  onRemoveLocation: (id: string) => void;
}

export function ActiveFilterPills({
  departments,
  locations,
  selectedDepartments,
  selectedLocations,
  onRemoveDepartment,
  onRemoveLocation,
}: ActiveFilterPillsProps) {
  const selectedDeptNames = departments.filter((d) =>
    selectedDepartments.includes(d.id),
  );
  const selectedLocNames = locations.filter((l) =>
    selectedLocations.includes(l.id),
  );

  if (selectedDeptNames.length === 0 && selectedLocNames.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selectedDeptNames.map((dept) => (
        <Badge key={dept.id} variant="secondary" className="gap-1 pr-1">
          {dept.name}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onRemoveDepartment(dept.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      {selectedLocNames.map((loc) => (
        <Badge key={loc.id} variant="outline" className="gap-1 pr-1">
          {loc.name}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onRemoveLocation(loc.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
    </div>
  );
}
