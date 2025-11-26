/**
 * Employee Node Component for Org Chart
 * Custom XYFlow node for displaying employees in the org chart
 */

"use client";

import { memo } from "react";
import { Handle, Position, type Node } from "@xyflow/react";
import { ChevronDown, ChevronRight, Users } from "lucide-react";

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
  onToggleExpand: (id: string) => void;
  onViewReportingChain: (employee: EmployeeDirectoryDTO) => void;
}

export type EmployeeNodeType = Node<EmployeeNodeData, "employee">;

interface EmployeeNodeProps {
  data: EmployeeNodeData;
}

function EmployeeNodeComponent({ data }: EmployeeNodeProps) {
  const { employee, isExpanded, hasChildren, onToggleExpand } = data;

  return (
    <>
      {/* Target handle (top) - for incoming connections from manager */}
      {employee.managerId && (
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-border !h-2 !w-2"
        />
      )}

      <Card
        className={cn(
          "w-48 cursor-pointer transition-shadow hover:shadow-md",
          isExpanded && hasChildren && "ring-primary/20 ring-2",
        )}
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
            <Badge variant="outline" className="max-w-full truncate text-xs">
              {employee.orgUnitName}
            </Badge>
          </div>

          {/* Expand/collapse button if has children */}
          {hasChildren && (
            <div className="mt-2 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(employee.id);
                }}
              >
                {isExpanded ? (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    <Users className="h-3 w-3" />
                    {employee.directReportsCount}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Source handle (bottom) - for outgoing connections to reports */}
      {hasChildren && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-border !h-2 !w-2"
        />
      )}
    </>
  );
}

export const EmployeeNode = memo(EmployeeNodeComponent);
