/**
 * Org Chart View Component
 * XYFlow-based organizational hierarchy view with department grouping
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  type Edge,
  BackgroundVariant,
  Panel,
  MarkerType,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Network, Maximize2, Users } from "lucide-react";

import type { EmployeeDirectoryDTO } from "@/interface-adapters/presenters/employee-directory.presenter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EmployeeNode,
  type EmployeeNodeType,
} from "../org-chart/employee-node";

// Node dimensions for layout calculation
const NODE_WIDTH = 192; // w-48 = 12rem = 192px
const NODE_HEIGHT = 120;
const HORIZONTAL_SPACING = 40;
const VERTICAL_SPACING = 80;

// Custom node types registration
const nodeTypes: NodeTypes = {
  employee: EmployeeNode,
};

interface OrgChartViewProps {
  employees: EmployeeDirectoryDTO[];
  isLoading: boolean;
  onViewReportingChain?: (employee: EmployeeDirectoryDTO) => void;
}

interface TreeNode {
  employee: EmployeeDirectoryDTO;
  children: TreeNode[];
  x: number;
  y: number;
  width: number;
}

export function OrgChartView({
  employees,
  isLoading,
  onViewReportingChain,
}: OrgChartViewProps) {
  // Initialize expanded nodes with root employees
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    // Find root employees to expand by default
    const employeeMap = new Map(employees.map((emp) => [emp.id, emp]));
    const roots = employees.filter(
      (emp) => !emp.managerId || !employeeMap.has(emp.managerId),
    );
    return new Set(roots.map((emp) => emp.id));
  });
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  // Build employee lookup map
  const employeeMap = useMemo(() => {
    const map = new Map<string, EmployeeDirectoryDTO>();
    employees.forEach((emp) => map.set(emp.id, emp));
    return map;
  }, [employees]);

  // Get unique departments for filter
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    employees.forEach((emp) => {
      if (emp.orgUnitName) deptSet.add(emp.orgUnitName);
    });
    return Array.from(deptSet).sort();
  }, [employees]);

  // Find root employees (those without managers or whose managers aren't in the list)
  const rootEmployees = useMemo(() => {
    return employees.filter(
      (emp) => !emp.managerId || !employeeMap.has(emp.managerId),
    );
  }, [employees, employeeMap]);

  // Get department heads (root employees or first level managers per department)
  const departmentHeads = useMemo(() => {
    const heads = new Map<string, EmployeeDirectoryDTO>();

    // First, try to find the topmost person in each department
    employees.forEach((emp) => {
      const dept = emp.orgUnitName;
      if (!dept) return;

      const currentHead = heads.get(dept);
      if (!currentHead) {
        heads.set(dept, emp);
      } else {
        // Check if this employee is higher in the hierarchy (has more reports or is a root)
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

  // Expand all nodes
  const handleExpandAll = useCallback(() => {
    const allIds = new Set(
      employees.filter((e) => e.directReportsCount > 0).map((e) => e.id),
    );
    setExpandedNodes(allIds);
  }, [employees]);

  // Collapse all nodes
  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // Convert tree to ReactFlow nodes and edges
  const { nodes: flowNodes, edges: flowEdges } = useMemo(() => {
    // Build tree structure from employees (defined inside useMemo)
    const buildTree = (rootId: string, depth: number = 0): TreeNode | null => {
      const employee = employeeMap.get(rootId);
      if (!employee) return null;

      // Filter by department if selected
      if (
        selectedDepartment !== "all" &&
        employee.orgUnitName !== selectedDepartment
      ) {
        return null;
      }

      const isExpanded = expandedNodes.has(rootId);
      const directReports = employees.filter(
        (e) => e.managerId === rootId && e.id !== rootId,
      );

      // Only include children if expanded
      const children: TreeNode[] = [];
      if (isExpanded) {
        directReports.forEach((report) => {
          const childTree = buildTree(report.id, depth + 1);
          if (childTree) children.push(childTree);
        });
      }

      return {
        employee,
        children,
        x: 0,
        y: depth * (NODE_HEIGHT + VERTICAL_SPACING),
        width: NODE_WIDTH,
      };
    };

    // Calculate tree layout (Reingold-Tilford-like algorithm)
    const calculateLayout = (node: TreeNode, leftBound: number = 0): number => {
      if (node.children.length === 0) {
        node.x = leftBound;
        return leftBound + NODE_WIDTH + HORIZONTAL_SPACING;
      }

      let currentX = leftBound;
      node.children.forEach((child) => {
        currentX = calculateLayout(child, currentX);
      });

      // Center parent over children
      const firstChild = node.children[0];
      const lastChild = node.children[node.children.length - 1];
      node.x = (firstChild.x + lastChild.x) / 2;

      return currentX;
    };

    const nodes: EmployeeNodeType[] = [];
    const edges: Edge[] = [];

    // Determine which employees to show as roots
    let roots: EmployeeDirectoryDTO[];

    if (selectedDepartment !== "all") {
      // When filtering by department, show the department head as root
      const head = departmentHeads.get(selectedDepartment);
      roots = head ? [head] : [];
    } else {
      // Show all root employees
      roots = rootEmployees;
    }

    // Build and layout trees for each root
    const trees: TreeNode[] = [];
    let offsetX = 0;

    roots.forEach((root) => {
      const tree = buildTree(root.id);
      if (tree) {
        const rightBound = calculateLayout(tree, offsetX);
        trees.push(tree);
        offsetX = rightBound + HORIZONTAL_SPACING * 2;
      }
    });

    // Convert trees to nodes and edges
    const processTree = (treeNode: TreeNode) => {
      const hasChildren = employees.some(
        (e) => e.managerId === treeNode.employee.id,
      );

      nodes.push({
        id: treeNode.employee.id,
        type: "employee",
        position: { x: treeNode.x, y: treeNode.y },
        data: {
          employee: treeNode.employee,
          isExpanded: expandedNodes.has(treeNode.employee.id),
          hasChildren,
          onToggleExpand: handleToggleExpand,
          onViewReportingChain: onViewReportingChain ?? (() => {}),
        },
      });

      treeNode.children.forEach((child) => {
        edges.push({
          id: `${treeNode.employee.id}-${child.employee.id}`,
          source: treeNode.employee.id,
          target: child.employee.id,
          type: "smoothstep",
          style: { stroke: "hsl(var(--border))", strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "hsl(var(--border))",
            width: 15,
            height: 15,
          },
        });
        processTree(child);
      });
    };

    trees.forEach(processTree);

    return { nodes, edges };
  }, [
    rootEmployees,
    departmentHeads,
    selectedDepartment,
    expandedNodes,
    handleToggleExpand,
    onViewReportingChain,
    employees,
    employeeMap,
  ]);

  const [nodes, setNodes, onNodesChange] =
    useNodesState<EmployeeNodeType>(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Update nodes when flow data changes
  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Network className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="mb-2 text-lg font-medium">No employees found</h3>
        <p className="text-muted-foreground text-sm">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full rounded-lg border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          pannable
          zoomable
          className="!bg-background/80"
        />

        {/* Custom control panel */}
        <Panel position="top-left" className="flex items-center gap-2">
          <Select
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
          >
            <SelectTrigger className="bg-background w-[200px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {nodes.length} shown
          </Badge>
        </Panel>

        <Panel position="top-right" className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExpandAll}
            className="bg-background"
          >
            <Maximize2 className="mr-1 h-4 w-4" />
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCollapseAll}
            className="bg-background"
          >
            Collapse All
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
