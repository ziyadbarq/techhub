/**
 * Employee Node Component for Org Chart
 * Custom XYFlow node for displaying employees in the org chart
 */

"use client";

import { memo } from "react";
import { Handle, Position, type Node } from "@xyflow/react";
import { ChevronDown, ChevronRight, GitBranch, Users } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EmployeeDirectoryDTO } from "@/interface-adapters/presenters/employee-directory.presenter";
import { EmployeeAvatar } from "../employee-avatar";

export interface EmployeeNodeData extends Record<string, unknown> {
  employee: EmployeeDirectoryDTO;
  isExpanded: boolean;
  hasChildren: boolean;
  isHighlighted?: boolean;
  isRoot?: boolean; // True if this node has no parent in the current chart view
  onToggleExpand: (id: string) => void;
  onViewReportingChain: (employee: EmployeeDirectoryDTO) => void;
}

export type EmployeeNodeType = Node<EmployeeNodeData, "employee">;

interface EmployeeNodeProps {
  data: EmployeeNodeData;
}

function EmployeeNodeComponent({ data }: EmployeeNodeProps) {
  const {
    employee,
    isExpanded,
    hasChildren,
    isHighlighted,
    isRoot,
    onToggleExpand,
    onViewReportingChain,
  } = data;

  return (
    <>
      {/* Target handle (top) - for incoming connections from manager */}
      {/* Only show if NOT a root node (has visible parent in chart) */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={false}
          className="!h-1 !min-h-0 !w-1 !min-w-0 !border-0 !bg-transparent"
        />
      )}

      <Card
        className={cn(
          "w-48 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          isExpanded && hasChildren && "ring-primary/30 shadow-md ring-2",
          isHighlighted && "ring-primary bg-primary/5 shadow-lg ring-2",
        )}
        onClick={() => onViewReportingChain(employee)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onViewReportingChain(employee);
          }
        }}
        role="article"
        tabIndex={0}
        aria-label={`${employee.fullName}, ${employee.title ?? "No title"}, ${employee.orgUnitName}${employee.directReportsCount > 0 ? `, ${employee.directReportsCount} direct reports` : ""}`}
      >
        <div className="p-3">
          {/* Employee info */}
          <div className="flex items-center gap-2">
            <EmployeeAvatar
              firstName={employee.firstName}
              lastName={employee.lastName}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {employee.fullName}
              </p>
              {employee.title && (
                <p className="text-muted-foreground truncate text-xs">
                  {employee.title}
                </p>
              )}
            </div>
          </div>

          {/* Department */}
          <div className="mt-2">
            <Badge
              variant={isHighlighted ? "default" : "outline"}
              className="max-w-full truncate text-xs"
            >
              {employee.orgUnitName}
            </Badge>
          </div>

          {/* Additional info */}
          <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
            <span>{employee.email.split("@")[0]}</span>
            {employee.directReportsCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {employee.directReportsCount} reports
              </Badge>
            )}
          </div>

          {/* Expand/collapse button if has children */}
          <div className="mt-2 flex items-center justify-between">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(employee.id);
                }}
                aria-expanded={isExpanded}
                aria-label={
                  isExpanded
                    ? `Collapse direct reports for ${employee.fullName}`
                    : `Expand ${employee.directReportsCount} direct reports for ${employee.fullName}`
                }
              >
                {isExpanded ? (
                  <>
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    <Users className="h-3 w-3" aria-hidden="true" />
                    {employee.directReportsCount}
                  </>
                )}
              </Button>
            ) : (
              <Badge variant="outline" className="text-[11px]">
                No reports
              </Badge>
            )}

            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={(event) => {
                event.stopPropagation();
                onViewReportingChain(employee);
              }}
              aria-label={`View reporting chain for ${employee.fullName}`}
            >
              <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Source handle (bottom) - for outgoing connections to reports */}
      {hasChildren && (
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={false}
          className="!h-1 !min-h-0 !w-1 !min-w-0 !border-0 !bg-transparent"
        />
      )}
    </>
  );
}

export const EmployeeNode = memo(EmployeeNodeComponent);
