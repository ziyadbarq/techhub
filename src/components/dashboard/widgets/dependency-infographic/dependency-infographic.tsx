/**
 * Dependency Infographic Widget
 * Visual guide showing entity dependencies for data entry workflow
 */

"use client";

import { useEffect } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import { GitBranch } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DependencyNode, type DependencyNodeType } from "./dependency-node";
import { useDependencyLayout } from "./use-dependency-layout";
import { LAYOUT_CONFIG } from "./config";

// ============================================================================
// Node Types Registration
// ============================================================================

const nodeTypes: NodeTypes = {
  dependency: DependencyNode,
};

// ============================================================================
// Component
// ============================================================================

export function DependencyInfographic() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Get layout from Dagre
  const { nodes: layoutNodes, edges: layoutEdges } = useDependencyLayout({
    isDark,
  });

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] =
    useNodesState<DependencyNodeType>(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  // Update when layout changes (theme change)
  useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  return (
    <TooltipProvider delayDuration={200}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="bg-barq-yellow/15 flex h-8 w-8 items-center justify-center rounded-lg">
              <GitBranch className="text-barq-yellow h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Assets Data Entry Workflow
              </CardTitle>
              <CardDescription className="text-sm">
                Complete entities from top to bottom based on dependencies
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="bg-muted/30 h-[420px] w-full overflow-hidden rounded-lg border">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              nodesDraggable={false}
              nodesConnectable={false}
              nodesFocusable={false}
              edgesFocusable={false}
              panOnDrag={false}
              zoomOnScroll={false}
              zoomOnPinch={false}
              zoomOnDoubleClick={false}
              preventScrolling={false}
              fitView
              fitViewOptions={LAYOUT_CONFIG.fitView}
              minZoom={LAYOUT_CONFIG.zoom.min}
              maxZoom={LAYOUT_CONFIG.zoom.max}
              proOptions={{ hideAttribution: true }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1}
                className="!bg-transparent"
              />
            </ReactFlow>
          </div>

          {/* Legend */}
          <div className="text-muted-foreground mt-3 flex flex-wrap items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>Foundation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span>Dependent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="bg-barq-yellow h-2.5 w-2.5 rounded-full" />
              <span>Final</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground/60">→</span>
              <span>Depends on</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
