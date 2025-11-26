/**
 * useOrgChartLayout Hook
 * Handles tree building, layout calculation, and ReactFlow node/edge generation
 * Note: Employees are already filtered by parent page
 */

"use client";

import { useMemo } from "react";
import { MarkerType, type Edge } from "@xyflow/react";
import type { EmployeeDirectoryDTO } from "@/interface-adapters/presenters/employee-directory.presenter";
import type { EmployeeNodeType } from "../employee-node";
import {
  DEFAULT_ORG_CHART_CONFIG,
  getNodeTotalWidth,
  getNodeTotalHeight,
} from "../config";

interface TreeNode {
  employee: EmployeeDirectoryDTO;
  children: TreeNode[];
  x: number;
  y: number;
  width: number;
}

interface UseOrgChartLayoutOptions {
  /** Pre-filtered employees from parent */
  filteredEmployees: EmployeeDirectoryDTO[];
  employeeMap: Map<string, EmployeeDirectoryDTO>;
  rootEmployees: EmployeeDirectoryDTO[];
  expandedNodes: Set<string>;
  highlightedNodes: Set<string>;
  onToggleExpand: (id: string) => void;
  onViewReportingChain: (employee: EmployeeDirectoryDTO) => void;
  /** Theme-aware edge color */
  edgeColor?: string;
}

interface UseOrgChartLayoutReturn {
  nodes: EmployeeNodeType[];
  edges: Edge[];
}

export function useOrgChartLayout({
  filteredEmployees,
  employeeMap,
  rootEmployees,
  expandedNodes,
  highlightedNodes,
  onToggleExpand,
  onViewReportingChain,
  edgeColor = "#888888",
}: UseOrgChartLayoutOptions): UseOrgChartLayoutReturn {
  const config = DEFAULT_ORG_CHART_CONFIG;
  const highlightColor = "#3b82f6"; // blue-500
  const nodeWidth = config.dimensions.nodeWidth;
  const totalHeight = getNodeTotalHeight(config);
  const totalWidth = getNodeTotalWidth(config);

  return useMemo(() => {
    // Build tree structure from employees
    const buildTree = (rootId: string, depth: number = 0): TreeNode | null => {
      const employee = employeeMap.get(rootId);
      if (!employee) return null;

      // Filter by current filters
      if (!filteredEmployees.some((e) => e.id === rootId)) {
        return null;
      }

      const isExpanded = expandedNodes.has(rootId);
      const directReports = filteredEmployees.filter(
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
        y: depth * totalHeight,
        width: nodeWidth,
      };
    };

    // Calculate tree layout (Reingold-Tilford-like algorithm)
    const calculateLayout = (node: TreeNode, leftBound: number = 0): number => {
      if (node.children.length === 0) {
        node.x = leftBound;
        return leftBound + totalWidth;
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

    // Build and layout trees for each root employee
    const trees: TreeNode[] = [];
    let offsetX = 0;

    rootEmployees.forEach((root) => {
      const tree = buildTree(root.id);
      if (tree) {
        const rightBound = calculateLayout(tree, offsetX);
        trees.push(tree);
        offsetX = rightBound + config.spacing.treeGap;
      }
    });

    // Track root node IDs for isRoot prop
    const rootIds = new Set(rootEmployees.map((r) => r.id));

    // Convert trees to nodes and edges
    const processTree = (treeNode: TreeNode) => {
      const hasChildren = filteredEmployees.some(
        (e) => e.managerId === treeNode.employee.id,
      );
      const isHighlighted = highlightedNodes.has(treeNode.employee.id);
      const isRoot = rootIds.has(treeNode.employee.id);

      nodes.push({
        id: treeNode.employee.id,
        type: "employee",
        position: { x: treeNode.x, y: treeNode.y },
        data: {
          employee: treeNode.employee,
          isExpanded: expandedNodes.has(treeNode.employee.id),
          hasChildren,
          isHighlighted,
          isRoot,
          onToggleExpand,
          onViewReportingChain,
        },
      });

      treeNode.children.forEach((child) => {
        const isChildHighlighted = highlightedNodes.has(child.employee.id);
        const shouldHighlight = isHighlighted || isChildHighlighted;

        edges.push({
          id: `${treeNode.employee.id}-${child.employee.id}`,
          source: treeNode.employee.id,
          target: child.employee.id,
          type: "default", // Bezier curves - cleaner than smoothstep
          style: {
            stroke: shouldHighlight ? highlightColor : edgeColor,
            strokeWidth: shouldHighlight ? 3 : 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: shouldHighlight ? highlightColor : edgeColor,
            width: config.marker.width,
            height: config.marker.height,
          },
        });
        processTree(child);
      });
    };

    trees.forEach(processTree);

    return { nodes, edges };
  }, [
    filteredEmployees,
    employeeMap,
    rootEmployees,
    expandedNodes,
    highlightedNodes,
    onToggleExpand,
    onViewReportingChain,
    edgeColor,
    highlightColor,
    nodeWidth,
    totalHeight,
    totalWidth,
    config,
  ]);
}
