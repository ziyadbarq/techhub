"use client";

import { useMemo, type FC } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  type Node,
  type Edge,
} from "@xyflow/react";
import type { OrganizationUnitDTO } from "@/interface-adapters/presenters/organization-unit.presenter";
import { getLayoutedElements } from "@/lib/dagre-layout";

import "@xyflow/react/dist/style.css";

interface OrganizationUnitChartProps {
  units: OrganizationUnitDTO[];
}

const OrganizationUnitChart: FC<OrganizationUnitChartProps> = ({ units }) => {
  const initialNodes: Node[] = units.map((unit) => ({
    id: unit.id,
    position: { x: 0, y: 0 },
    data: { label: unit.name },
  }));

  const initialEdges: Edge[] = units
    .filter((unit) => unit.parentId)
    .map((unit) => ({
      id: `${unit.parentId}-${unit.id}`,
      source: unit.parentId!,
      target: unit.id,
    }));

  const { nodes, edges } = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges),
    [initialNodes, initialEdges],
  );

  if (!nodes.length) {
    return <div>No organization units to display.</div>;
  }

  return (
    <div style={{ height: "600px", width: "100%" }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Controls />
        <MiniMap />
        <Background />
      </ReactFlow>
    </div>
  );
};

export default OrganizationUnitChart;
