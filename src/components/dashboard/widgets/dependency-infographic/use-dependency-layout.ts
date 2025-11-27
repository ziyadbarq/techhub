/**
 * Dependency Layout Hook
 * Uses Dagre for automatic graph layout of entity dependencies
 */

import { useMemo } from "react";
import dagre from "@dagrejs/dagre";
import { MarkerType, type Edge } from "@xyflow/react";

import {
  DEPENDENCY_ENTITIES,
  LAYOUT_CONFIG,
  getEdgeColor,
  type DependencyEntity,
} from "./config";
import type { DependencyNodeType, DependencyNodeData } from "./dependency-node";

// ============================================================================
// Types
// ============================================================================

interface UseDependencyLayoutOptions {
  isDark: boolean;
}

interface UseDependencyLayoutResult {
  nodes: DependencyNodeType[];
  edges: Edge[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create edges from entity dependencies
 */
function createEdges(entities: DependencyEntity[], edgeColor: string): Edge[] {
  const edges: Edge[] = [];

  entities.forEach((entity) => {
    entity.dependsOn.forEach((depId) => {
      edges.push({
        id: `${depId}-${entity.id}`,
        source: depId,
        target: entity.id,
        type: "smoothstep",
        style: {
          stroke: edgeColor,
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: edgeColor,
        },
        animated: false,
      });
    });
  });

  return edges;
}

/**
 * Build a set of entity IDs that have outgoing edges (are depended upon)
 */
function getEntitiesWithOutgoing(entities: DependencyEntity[]): Set<string> {
  const withOutgoing = new Set<string>();
  entities.forEach((entity) => {
    entity.dependsOn.forEach((depId) => {
      withOutgoing.add(depId);
    });
  });
  return withOutgoing;
}

/**
 * Apply Dagre layout to nodes
 */
function applyDagreLayout(
  entities: DependencyEntity[],
  edges: Edge[],
  isDark: boolean,
): DependencyNodeType[] {
  const { node, graph } = LAYOUT_CONFIG;
  const entitiesWithOutgoing = getEntitiesWithOutgoing(entities);

  // Create dagre graph
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: graph.rankdir,
    ranksep: graph.ranksep,
    nodesep: graph.nodesep,
  });

  // Add nodes to dagre
  entities.forEach((entity) => {
    dagreGraph.setNode(entity.id, {
      width: node.width,
      height: node.height,
    });
  });

  // Add edges to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Create positioned nodes
  const nodes: DependencyNodeType[] = entities.map((entity) => {
    const nodeWithPosition = dagreGraph.node(entity.id);

    const nodeData: DependencyNodeData = {
      id: entity.id,
      name: entity.name,
      shortDesc: entity.shortDesc,
      fullDesc: entity.fullDesc,
      href: entity.href,
      icon: entity.icon,
      order: entity.order,
      tier: entity.tier,
      hasIncoming: entity.dependsOn.length > 0,
      hasOutgoing: entitiesWithOutgoing.has(entity.id),
      isDark,
    };

    return {
      id: entity.id,
      type: "dependency",
      position: {
        x: nodeWithPosition.x - node.width / 2,
        y: nodeWithPosition.y - node.height / 2,
      },
      data: nodeData,
      draggable: false,
    };
  });

  return nodes;
}

// ============================================================================
// Hook
// ============================================================================

export function useDependencyLayout({
  isDark,
}: UseDependencyLayoutOptions): UseDependencyLayoutResult {
  return useMemo(() => {
    const edgeColor = getEdgeColor(isDark);
    const edges = createEdges(DEPENDENCY_ENTITIES, edgeColor);
    const nodes = applyDagreLayout(DEPENDENCY_ENTITIES, edges, isDark);

    return { nodes, edges };
  }, [isDark]);
}
