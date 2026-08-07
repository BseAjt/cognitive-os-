import type { CognitiveCase } from "../domain/canonical.ts";
import type { CrossCaseLink } from "./cross-case-memory.ts";
import type { CrossCaseContradiction } from "./cross-case-contradictions.ts";
import type { ReusableExperience } from "./experience-reuse.ts";

export interface LivingGraphNode {
  id: string;
  type: "case" | "experience" | "contradiction";
  label: string;
  meta?: string;
}

export interface LivingGraphEdge {
  id: string;
  source: string;
  target: string;
  type: "RELATED_TO" | "REUSES" | "CONFLICTS_WITH";
  weight: number;
  rationale: string;
}

export interface LivingKnowledgeGraph {
  nodes: LivingGraphNode[];
  edges: LivingGraphEdge[];
}

export function buildLivingKnowledgeGraph(input: {
  cases: CognitiveCase[];
  links: CrossCaseLink[];
  reusableExperiences: ReusableExperience[];
  contradictions: CrossCaseContradiction[];
}): LivingKnowledgeGraph {
  const nodes: LivingGraphNode[] = input.cases.map((item) => ({ id: `case:${item.id}`, type: "case", label: item.title, meta: item.state }));
  const edges: LivingGraphEdge[] = [];
  const nodeIds = new Set(nodes.map((item) => item.id));

  for (const link of input.links) {
    edges.push({
      id: `related:${link.sourceCaseId}:${link.targetCaseId}`,
      source: `case:${link.sourceCaseId}`,
      target: `case:${link.targetCaseId}`,
      type: "RELATED_TO",
      weight: link.score,
      rationale: link.rationale
    });
  }

  for (const item of input.reusableExperiences) {
    const nodeId = `experience:${item.sourceCaseId}:${slug(item.type)}:${slug(item.title)}`;
    if (!nodeIds.has(nodeId)) {
      nodes.push({ id: nodeId, type: "experience", label: item.title, meta: `${item.type} · ${item.confidence}%` });
      nodeIds.add(nodeId);
    }
    edges.push({
      id: `reuse:${nodeId}`,
      source: `case:${item.sourceCaseId}`,
      target: nodeId,
      type: "REUSES",
      weight: item.relevance,
      rationale: item.reason
    });
  }

  for (const contradiction of input.contradictions) {
    const contradictionId = `contradiction:${slug(contradiction.id)}`;
    if (!nodeIds.has(contradictionId)) {
      nodes.push({ id: contradictionId, type: "contradiction", label: `Contradiction · ${contradiction.topic}`, meta: `${contradiction.confidence}%` });
      nodeIds.add(contradictionId);
    }
    edges.push({
      id: `conflict:left:${contradiction.id}`,
      source: `case:${contradiction.leftCaseId}`,
      target: contradictionId,
      type: "CONFLICTS_WITH",
      weight: contradiction.confidence,
      rationale: contradiction.leftStatement
    });
    edges.push({
      id: `conflict:right:${contradiction.id}`,
      source: `case:${contradiction.rightCaseId}`,
      target: contradictionId,
      type: "CONFLICTS_WITH",
      weight: contradiction.confidence,
      rationale: contradiction.rightStatement
    });
  }

  return { nodes: dedupe(nodes, (item) => item.id), edges: dedupe(edges, (item) => item.id) };
}

export function graphSummary(graph: LivingKnowledgeGraph): string {
  const cases = graph.nodes.filter((item) => item.type === "case").length;
  const contradictions = graph.nodes.filter((item) => item.type === "contradiction").length;
  const experiences = graph.nodes.filter((item) => item.type === "experience").length;
  return `${cases} dossiers reliés · ${experiences} expériences réutilisables · ${contradictions} contradiction(s) détectée(s).`;
}

function dedupe<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => { const id = key(item); if (seen.has(id)) return false; seen.add(id); return true; });
}
function slug(value: string): string { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
