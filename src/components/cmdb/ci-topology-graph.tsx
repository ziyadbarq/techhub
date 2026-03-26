"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { listCIRelationshipsAction } from "@/interface-adapters/controllers/ci-relationship.controller";
import type { CIRelationshipDTO } from "@/interface-adapters/dtos/generated/ci-relationship.dto";

// ============================================================================
// Types
// ============================================================================

interface CINodeData {
  label: string;
  ciClass: string;
  criticality: string;
  [key: string]: unknown;
}

type CINode = Node<CINodeData>;

// ============================================================================
// Layout
// ============================================================================

const NODE_WIDTH = 180;
const NODE_HEIGHT = 50;

function layoutGraph(
  nodes: CINode[],
  edges: Edge[],
): { nodes: CINode[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",
    nodesep: 60,
    ranksep: 80,
    marginx: 20,
    marginy: 20,
  });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// ============================================================================
// Custom Node
// ============================================================================

const criticalityColors: Record<string, string> = {
  CRITICAL: "border-red-500 bg-red-50 dark:bg-red-950",
  HIGH: "border-orange-500 bg-orange-50 dark:bg-orange-950",
  MEDIUM: "border-blue-500 bg-blue-50 dark:bg-blue-950",
  LOW: "border-slate-400 bg-slate-50 dark:bg-slate-900",
};

function CINodeComponent({ data }: { data: CINodeData }) {
  const colorClass =
    criticalityColors[data.criticality] ?? criticalityColors.MEDIUM;
  return (
    <div
      className={`rounded-lg border-2 px-3 py-2 shadow-sm ${colorClass}`}
      style={{ width: NODE_WIDTH, minHeight: NODE_HEIGHT }}
    >
      <div className="truncate text-sm font-medium">{data.label}</div>
      <div className="text-muted-foreground truncate text-xs">
        {data.ciClass}
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  ci: CINodeComponent,
};

// ============================================================================
// Component
// ============================================================================

interface CITopologyGraphProps {
  ciId?: string;
}

export function CITopologyGraph({ ciId }: CITopologyGraphProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [loading, setLoading] = useState(true);
  const [relationships, setRelationships] = useState<CIRelationshipDTO[]>([]);

  const [nodes, setNodes, onNodesChange] = useNodesState<CINode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Fetch relationships
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const result = await listCIRelationshipsAction(ciId, undefined, true);
        if (result.success && result.data) {
          setRelationships(result.data);
        }
      } catch {
        toast.error("Failed to load CI relationships");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [ciId]);

  // Build graph from relationships
  useEffect(() => {
    if (relationships.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Collect unique CIs
    const ciMap = new Map<string, { name: string; ciClass: string }>();
    for (const rel of relationships) {
      if (!ciMap.has(rel.fromCiId)) {
        ciMap.set(rel.fromCiId, {
          name: rel.fromCiName?.split(" (")[0] ?? rel.fromCiId.slice(0, 8),
          ciClass: rel.fromCiName?.match(/\(([^)]+)\)/)?.[1] ?? "Unknown",
        });
      }
      if (!ciMap.has(rel.toCiId)) {
        ciMap.set(rel.toCiId, {
          name: rel.toCiName?.split(" (")[0] ?? rel.toCiId.slice(0, 8),
          ciClass: rel.toCiName?.match(/\(([^)]+)\)/)?.[1] ?? "Unknown",
        });
      }
    }

    // Create nodes
    const rawNodes: CINode[] = Array.from(ciMap.entries()).map(
      ([id, { name, ciClass }]) => ({
        id,
        type: "ci",
        position: { x: 0, y: 0 },
        data: {
          label: name,
          ciClass,
          criticality: "MEDIUM",
        },
      }),
    );

    // Create edges
    const rawEdges: Edge[] = relationships.map((rel) => ({
      id: rel.id,
      source: rel.fromCiId,
      target: rel.toCiId,
      label: rel.relationshipTypeCode ?? rel.relationshipTypeName ?? "",
      animated: rel.relationshipTypeCode === "DEPENDS_ON",
      style: {
        stroke: isDark ? "#94a3b8" : "#64748b",
        strokeWidth: 1.5,
      },
      labelStyle: {
        fontSize: 10,
        fill: isDark ? "#94a3b8" : "#64748b",
      },
    }));

    // Layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = layoutGraph(
      rawNodes,
      rawEdges,
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [relationships, isDark, setNodes, setEdges]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: CINode) => {
    // Could navigate to CI detail page
    window.open(`/configuration-items/${node.id}`, "_blank");
  }, []);

  const legendItems = useMemo(
    () => [
      { label: "Critical", color: "bg-red-500" },
      { label: "High", color: "bg-orange-500" },
      { label: "Medium", color: "bg-blue-500" },
      { label: "Low", color: "bg-slate-400" },
    ],
    [],
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (relationships.length === 0) {
    return (
      <div className="text-muted-foreground flex h-96 items-center justify-center">
        No relationships found. Create CI relationships to see the topology.
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
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color={isDark ? "#334155" : "#e2e8f0"}
        />
        <Controls />
        <MiniMap
          nodeColor={() => (isDark ? "#475569" : "#94a3b8")}
          maskColor={isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.1)"}
        />
        <Panel position="top-right">
          <div className="bg-background/80 flex gap-3 rounded-md border px-3 py-2 text-xs backdrop-blur">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                <span className="text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
