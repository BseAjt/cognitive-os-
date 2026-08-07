"use client";

import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import type { CognitiveCase, KnowledgeEntity, KnowledgeEntityType, KnowledgeRelation } from "@/domain/canonical";

export function ReasoningGraph({
  cognitiveCase,
  entities,
  relations
}: {
  cognitiveCase: CognitiveCase;
  entities: KnowledgeEntity[];
  relations: KnowledgeRelation[];
}) {
  const scopedEntities = entities.filter((entity) => entity.caseId === cognitiveCase.id);
  const scopedIds = new Set(scopedEntities.map((entity) => entity.id));
  const scopedRelations = relations.filter(
    (relation) => relation.caseId === cognitiveCase.id && scopedIds.has(relation.sourceId) && scopedIds.has(relation.targetId)
  );

  if (!scopedEntities.length) {
    return <EmptyGraph cognitiveCase={cognitiveCase} />;
  }

  const caseEntity = scopedEntities.find((entity) => entity.type === "decision_case");
  const satellites = scopedEntities.filter((entity) => entity.id !== caseEntity?.id);
  const nodes: Node[] = [
    ...(caseEntity ? [toNode(caseEntity, { x: 300, y: 190 })] : []),
    ...satellites.map((entity, index) => {
      const angle = (index / Math.max(1, satellites.length)) * Math.PI * 2 - Math.PI / 2;
      const radiusX = 285 + Math.floor(index / 10) * 90;
      const radiusY = 155 + Math.floor(index / 10) * 65;
      return toNode(entity, {
        x: 300 + Math.cos(angle) * radiusX,
        y: 190 + Math.sin(angle) * radiusY
      });
    })
  ];

  const edges: Edge[] = scopedRelations.map((relation) => ({
    id: relation.id,
    source: relation.sourceId,
    target: relation.targetId,
    label: relation.relationType.toLowerCase().replaceAll("_", " "),
    animated: relation.relationType === "AFFECTS" || relation.relationType === "CREATES"
  }));

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1525]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-[#91a2bd]">
        <span>KNOWLEDGE GRAPH · LIVE</span>
        <span>{scopedEntities.length} entités · {scopedRelations.length} relations</span>
      </div>
      <div className="h-[430px]">
        <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }} minZoom={0.25}>
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

function EmptyGraph({ cognitiveCase }: { cognitiveCase: CognitiveCase }) {
  const nodes: Node[] = [
    { id: "case", position: { x: 210, y: 80 }, data: { label: cognitiveCase.title }, style: nodeStyle("decision_case") },
    { id: "context", position: { x: 210, y: 230 }, data: { label: "Le prochain cycle cognitif construira le graphe." }, style: nodeStyle("context_item") }
  ];
  const edges: Edge[] = [{ id: "waiting", source: "context", target: "case", label: "en attente" }];

  return (
    <div className="h-[430px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1525]">
      <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

function toNode(entity: KnowledgeEntity, position: { x: number; y: number }): Node {
  return {
    id: entity.id,
    position,
    data: { label: entity.title },
    style: nodeStyle(entity.type)
  };
}

function nodeStyle(type: KnowledgeEntityType) {
  const colors: Partial<Record<KnowledgeEntityType, string>> = {
    decision_case: "#7c5cff",
    decision: "#42d59d",
    action: "#69bfff",
    risk: "#ff6b7a",
    memory: "#c79cff",
    insight: "#ffd166",
    context_item: "#ffbc57"
  };
  const borderColor = colors[type] ?? "#71839e";

  return {
    width: 210,
    borderRadius: 16,
    border: `1px solid ${borderColor}`,
    background: "#16243c",
    color: "#f4f7fb",
    padding: 12,
    fontSize: 12
  };
}
