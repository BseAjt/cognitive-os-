import type { CognitiveCase, DossierObjectRecord, KnowledgeRecord, LearningEventRecord, MemoryRecord } from "../domain/canonical.ts";

export interface ConsolidatedKnowledge {
  id: string;
  caseId: string;
  title: string;
  detail: string;
  confidence: number;
  sourceIds: string[];
  kind: "fact" | "hypothesis" | "risk" | "decision" | "learning" | "context";
}

export function consolidateLiveKnowledge(input: {
  cognitiveCase: CognitiveCase;
  caseObjects: DossierObjectRecord[];
  memories: MemoryRecord[];
  knowledgeRecords: KnowledgeRecord[];
  learningEvents: LearningEventRecord[];
}): ConsolidatedKnowledge[] {
  const caseId = input.cognitiveCase.id;
  const candidates = [
    ...input.caseObjects.filter((item) => item.caseId === caseId).map((item) => ({
      key: normalize(item.title),
      title: item.title,
      detail: item.title,
      confidence: item.confidence,
      sourceId: item.id,
      kind: objectKind(item.type)
    })),
    ...input.memories.filter((item) => item.caseId === caseId && item.durable).map((item) => ({
      key: normalize(item.content),
      title: item.content,
      detail: item.content,
      confidence: item.confidence,
      sourceId: item.id,
      kind: memoryKind(item.kind)
    })),
    ...input.knowledgeRecords.filter((item) => item.caseId === caseId).map((item) => ({
      key: normalize(item.title),
      title: item.title,
      detail: item.detail ?? item.title,
      confidence: item.confidence,
      sourceId: item.id,
      kind: knowledgeKind(item.type)
    })),
    ...input.learningEvents.filter((item) => item.caseId === caseId).map((item) => ({
      key: normalize(item.detail),
      title: item.title,
      detail: item.detail,
      confidence: item.confidence,
      sourceId: item.id,
      kind: "learning" as const
    }))
  ].filter((item) => item.key.length >= 6);

  const groups = new Map<string, typeof candidates>();
  for (const candidate of candidates) {
    const existing = groups.get(candidate.key) ?? [];
    existing.push(candidate);
    groups.set(candidate.key, existing);
  }

  return [...groups.entries()]
    .map(([key, items]) => {
      const strongest = [...items].sort((a, b) => b.confidence - a.confidence)[0];
      return {
        id: `live:${caseId}:${hash(key)}`,
        caseId,
        title: strongest.title,
        detail: strongest.detail,
        confidence: Math.round(items.reduce((sum, item) => sum + item.confidence, 0) / items.length),
        sourceIds: items.map((item) => item.sourceId),
        kind: strongest.kind
      } satisfies ConsolidatedKnowledge;
    })
    .sort((a, b) => b.confidence - a.confidence);
}

export function buildLiveMemorySummary(records: ConsolidatedKnowledge[]): string {
  if (!records.length) return "Aucune connaissance consolidée pour ce dossier.";
  const top = records.slice(0, 5).map((item) => `• ${item.title} (${item.confidence}%)`);
  return `Mémoire vivante consolidée\n${top.join("\n")}`;
}

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
function hash(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
function objectKind(type: DossierObjectRecord["type"]): ConsolidatedKnowledge["kind"] {
  if (type === "hypothesis") return "hypothesis";
  if (type === "risk") return "risk";
  if (type === "decision") return "decision";
  if (type === "context" || type === "goal" || type === "question" || type === "action") return "context";
  return "fact";
}
function memoryKind(kind: MemoryRecord["kind"]): ConsolidatedKnowledge["kind"] {
  if (kind === "hypothesis") return "hypothesis";
  if (kind === "risk") return "risk";
  if (kind === "decision") return "decision";
  if (kind === "context" || kind === "goal" || kind === "action") return "context";
  return "fact";
}
function knowledgeKind(type: KnowledgeRecord["type"]): ConsolidatedKnowledge["kind"] {
  if (type === "risk") return "risk";
  if (type === "decision") return "decision";
  if (type === "insight") return "learning";
  if (type === "context_item" || type === "action") return "context";
  return "fact";
}
