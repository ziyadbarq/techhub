"use client";

/**
 * Field Template Selector Component
 * Allows users to browse and select field templates for a specific entity type
 */

import { useEffect, useState, useMemo } from "react";
import { Check, Layers, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { listFieldTemplatesForEntityAction } from "@/interface-adapters/controllers/field-template.controller";
import type { FieldTemplateSummaryDTO } from "@/interface-adapters/presenters/field-template.presenter";

interface FieldTemplateSelectorProps {
  entityType: string;
  value?: string;
  onSelect: (template: FieldTemplateSummaryDTO | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function FieldTemplateSelector({
  entityType,
  value,
  onSelect,
  placeholder = "Select a template...",
  disabled = false,
  className,
}: FieldTemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<FieldTemplateSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplates() {
      if (!entityType) {
        setTemplates([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await listFieldTemplatesForEntityAction(entityType);
        if (result.success) {
          setTemplates(result.data);
        } else {
          setError(result.error || "Failed to load templates");
        }
      } catch (_err) {
        setError("Failed to load templates");
      } finally {
        setLoading(false);
      }
    }

    loadTemplates();
  }, [entityType]);

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === value) || null;
  }, [templates, value]);

  const { builtInTemplates, userTemplates } = useMemo(() => {
    const builtIn = templates.filter((t) => t.isBuiltIn);
    const user = templates.filter((t) => !t.isBuiltIn);
    return { builtInTemplates: builtIn, userTemplates: user };
  }, [templates]);

  if (loading) {
    return <Skeleton className={cn("h-10 w-full", className)} />;
  }

  if (error) {
    return (
      <div className={cn("text-destructive text-sm", className)}>{error}</div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className={cn("text-muted-foreground text-sm", className)}>
        No templates available for this entity type
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", className)}
        >
          {selectedTemplate ? (
            <div className="flex items-center gap-2 truncate">
              {selectedTemplate.isBuiltIn ? (
                <Star className="h-4 w-4 text-amber-500" />
              ) : (
                <User className="text-muted-foreground h-4 w-4" />
              )}
              <span className="truncate">{selectedTemplate.name}</span>
              <Badge variant="secondary" className="ml-auto">
                {selectedTemplate.itemCount} fields
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <Layers className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search templates..." />
          <CommandList>
            <CommandEmpty>No templates found.</CommandEmpty>

            {builtInTemplates.length > 0 && (
              <CommandGroup heading="Built-in Templates">
                {builtInTemplates.map((template) => (
                  <CommandItem
                    key={template.id}
                    value={template.name}
                    onSelect={() => {
                      onSelect(template.id === value ? null : template);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === template.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-1 items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <div className="flex flex-col">
                        <span>{template.name}</span>
                        {template.description && (
                          <span className="text-muted-foreground max-w-[280px] truncate text-xs">
                            {template.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {template.standard && (
                        <Badge variant="outline" className="text-xs">
                          {template.standard}
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {template.itemCount} fields
                      </Badge>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {builtInTemplates.length > 0 && userTemplates.length > 0 && (
              <CommandSeparator />
            )}

            {userTemplates.length > 0 && (
              <CommandGroup heading="Custom Templates">
                {userTemplates.map((template) => (
                  <CommandItem
                    key={template.id}
                    value={template.name}
                    onSelect={() => {
                      onSelect(template.id === value ? null : template);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === template.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-1 items-center gap-2">
                      <User className="text-muted-foreground h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{template.name}</span>
                        {template.description && (
                          <span className="text-muted-foreground max-w-[280px] truncate text-xs">
                            {template.description}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                      {template.itemCount} fields
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
