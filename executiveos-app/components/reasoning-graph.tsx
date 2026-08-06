"use client";

import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import type { Challenge } from "@/types/domain";

export function ReasoningGraph({ challenge }: { challenge: Challenge }) {
  const nodes: Node[] = [
    { id: "challenge", position: { x: 260, y: 40 }, data: { label: challenge.title }, style: nodeStyle("#7c5cff") },
    { id: "hypothesis", position: { x: 20, y: 170 }, data: { label: challenge.hypothesis }, style: nodeStyle("#69bfff") },
    { id: "context", position: { x: 260, y: 210 }, data: { label: challenge.context }, style: nodeStyle("#ffbc57") },
    { id: "decision", position: { x: 500, y: 170 }, data: { label: "Décision à prendre" }, style: nodeStyle("#42d59d") }
  ];

  const edges: Edge[] = [
    { id: "e1", source: "hypothesis", target: "challenge", label: "supports" },
    { id: "e2", source: "context", target: "challenge", label: "updates" },
    { id: "e3", source: "challenge", target: "decision", label: "requires" }
  ];

  return (
    <div className="h-[430px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1525]">
      <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

function nodeStyle(borderColor: string) {
  return {
    width: 210,
    borderRadius: 16,
    border: `1px solid ${borderColor}`,
    background: "#16243c",
    color: "#f4f7fb",
    padding: 12
  };
}
