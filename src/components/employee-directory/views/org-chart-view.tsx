/**
 * Org Chart View Component
 * XYFlow-based organizational hierarchy view
 * Refactored to use extracted hooks and components for maintainability
 * Note: Main filtering (department, location) is handled by parent page
 */

"use client";

import { useCallback, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";

import type { EmployeeDirectoryDTO } from "@/interface-adapters/presenters/employee-directory.presenter";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EmployeeNode,
  type EmployeeNodeType,
  OrgChartToolbar,
  OrgChartControls,
  OrgChartEmptyState,
  DEFAULT_ORG_CHART_CONFIG,
  useOrgChartFilters,
  useOrgChartState,
  useOrgChartLayout,
} from "../org-chart";

// Custom node types registration
const nodeTypes: NodeTypes = {
  employee: EmployeeNode,
};

interface OrgChartViewProps {
  /** Pre-filtered employees from parent page */
  employees: EmployeeDirectoryDTO[];
  isLoading: boolean;
  onViewReportingChain?: (employee: EmployeeDirectoryDTO) => void;
}

export function OrgChartView({
  employees,
  isLoading,
  onViewReportingChain,
}: OrgChartViewProps) {
  const config = DEFAULT_ORG_CHART_CONFIG;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Theme-aware colors for SVG elements
  const minimapNodeColor = isDark ? "#52525b" : "#d4d4d8"; // zinc-600 / zinc-300
  const minimapMaskColor = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(0, 0, 0, 0.08)";
  const edgeColor = isDark ? "#71717a" : "#888888"; // zinc-500 / gray

  // Filters hook - manages highlight search and derived data
  const {
    searchQuery,
    setSearchQuery,
    employeeMap,
    filteredEmployees,
    rootEmployees,
    highlightedNodes,
    handleResetFilters,
  } = useOrgChartFilters({ employees });

  // State hook - manages node expansion
  const {
    expandedNodes,
    handleToggleExpand,
    handleExpandAll,
    handleCollapseAll,
  } = useOrgChartState({
    employees,
    filteredEmployees,
    rootEmployees,
  });

  // Stable callback for viewing reporting chain
  const handleViewReportingChain = useCallback(
    (employee: EmployeeDirectoryDTO) => {
      onViewReportingChain?.(employee);
    },
    [onViewReportingChain],
  );

  // Layout hook - generates nodes and edges from tree structure
  const { nodes: flowNodes, edges: flowEdges } = useOrgChartLayout({
    filteredEmployees,
    employeeMap,
    rootEmployees,
    expandedNodes,
    highlightedNodes,
    onToggleExpand: handleToggleExpand,
    onViewReportingChain: handleViewReportingChain,
    edgeColor,
  });

  // ReactFlow state management
  const [nodes, setNodes, onNodesChange] =
    useNodesState<EmployeeNodeType>(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Update nodes when flow data changes
  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  // Reset view - clears highlight search and re-expands roots
  const handleResetView = useCallback(() => {
    handleCollapseAll();
    handleResetFilters();
    // Re-expand roots after reset
    setTimeout(() => {
      rootEmployees.forEach((emp) => handleToggleExpand(emp.id));
    }, 0);
  }, [
    handleCollapseAll,
    handleResetFilters,
    rootEmployees,
    handleToggleExpand,
  ]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    );
  }

  // Empty state - no employees after parent filtering
  if (employees.length === 0) {
    return (
      <OrgChartEmptyState
        hasEmployees={false}
        searchQuery=""
        onClearSearch={() => {}}
      />
    );
  }

  return (
    <div className="h-[600px] w-full overflow-hidden rounded-lg border">
      <ReactFlow
        className="rounded-lg"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        fitView
        fitViewOptions={config.fitView}
        minZoom={config.zoom.min}
        maxZoom={config.zoom.max}
        defaultEdgeOptions={{
          type: "default", // Bezier curves - cleaner than smoothstep
          style: { stroke: edgeColor, strokeWidth: 2 },
          animated: false,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={25}
          size={1.5}
          className="!bg-background"
        />
        <Controls
          showInteractive={false}
          className="react-flow-controls-custom"
        />
        <MiniMap
          nodeStrokeWidth={1}
          nodeStrokeColor={isDark ? "#3f3f46" : "#a1a1aa"} // zinc-700 / zinc-400
          pannable
          zoomable
          maskColor={minimapMaskColor}
          className="react-flow-minimap-custom"
          nodeColor={(node) =>
            highlightedNodes.has(node.id)
              ? config.colors.nodeHighlight
              : minimapNodeColor
          }
        />

        {/* Highlight search and stats toolbar */}
        <OrgChartToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          nodeCount={nodes.length}
          highlightedCount={highlightedNodes.size}
        />

        {/* Expand/collapse controls */}
        <OrgChartControls
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          onResetView={handleResetView}
        />
      </ReactFlow>
    </div>
  );
}
