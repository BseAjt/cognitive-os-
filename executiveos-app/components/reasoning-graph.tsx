"use client";

import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import type { CognitiveCase } from "@/domain/canonical";

export function ReasoningGraph({ cognitiveCase }: { cognitiveCase: CognitiveCase }) {
  const nodes: Node[] = [
    { id: "case", position: { x: 260, y: 40 }, data: { label: cognitiveCase.title }, style: nodeStyle("#7c5cff") },
    { id: "hypothesis", position: { x: 20, y: 170 }, data: { label: cognitiveCase.workingHypothesis }, style: nodeStyle("#69bfff") },
    { id: "context", position: { x: 260, y: 210 }, data: { label: cognitiveCase.context }, style: nodeStyle("#ffbc57") },
    { id: "decision", position: { x: 500, y: 170 }, data: { label: "Décision à prendre" }, style: nodeStyle("#42d59d") }
  ];

  const edges: Edge[] = [
    { id: "e1", source: "hypothesis", target: "case", label: "supports" },
    { id: "e2", source: "context", target: "case", label: "updates" },
    { id: "e3", source: "case", target: "decision", label: "requires" }
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
