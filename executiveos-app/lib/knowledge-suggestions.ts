import type { CognitiveCase } from "../domain/canonical.ts";
import type { ConsolidatedKnowledge } from "./live-memory.ts";
import type { CrossCaseLink } from "./cross-case-memory.ts";
import type { CrossCaseContradiction } from "./cross-case-contradictions.ts";
import type { ReusableExperience } from "./experience-reuse.ts";

export type KnowledgeSuggestionType = "reuse_experience" | "review_contradiction" | "related_case" | "validate_knowledge";

export interface KnowledgeSuggestion {
  id: string;
  type: KnowledgeSuggestionType;
  title: string;
  detail: string;
  priority: number;
  reason: string;
  sourceCaseId?: string;
}

export function buildKnowledgeSuggestions(input: {
  activeCase: CognitiveCase;
  liveKnowledge: ConsolidatedKnowledge[];
  links: CrossCaseLink[];
  reusableExperiences: ReusableExperience[];
  contradictions: CrossCaseContradiction[];
}): KnowledgeSuggestion[] {
  const suggestions: KnowledgeSuggestion[] = [];

  for (const contradiction of input.contradictions.filter((item) => item.leftCaseId === input.activeCase.id || item.rightCaseId === input.activeCase.id)) {
    const sourceCaseId = contradiction.leftCaseId === input.activeCase.id ? contradiction.rightCaseId : contradiction.leftCaseId;
    const sourceTitle = contradiction.leftCaseId === input.activeCase.id ? contradiction.rightCaseTitle : contradiction.leftCaseTitle;
    suggestions.push({
      id: `suggestion:contradiction:${contradiction.id}`,
      type: "review_contradiction",
      title: `Revoir la position sur « ${contradiction.topic} »`,
      detail: `Une position opposée existe dans « ${sourceTitle} ».`,
      priority: Math.min(100, contradiction.confidence + 8),
      reason: contradiction.reason,
      sourceCaseId
    });
  }

  for (const item of input.reusableExperiences.slice(0, 5)) {
    suggestions.push({
      id: `suggestion:reuse:${item.sourceCaseId}:${item.type}:${normalizeId(item.title)}`,
      type: "reuse_experience",
      title: `Réutiliser ${labelForExperience(item.type)} de « ${item.sourceCaseTitle} »`,
      detail: item.type === "risk" ? `Risque déjà rencontré : ${item.title}` : item.detail,
      priority: item.relevance,
      reason: item.reason,
      sourceCaseId: item.sourceCaseId
    });
  }

  for (const link of input.links.slice(0, 3)) {
    suggestions.push({
      id: `suggestion:related:${link.targetCaseId}`,
      type: "related_case",
      title: "Consulter un dossier connexe",
      detail: `${link.score}% de similarité · ${link.sharedConcepts.slice(0, 4).join(", ")}`,
      priority: Math.max(35, link.score - 8),
      reason: link.rationale,
      sourceCaseId: link.targetCaseId
    });
  }

  for (const knowledge of input.liveKnowledge.filter((item) => item.confidence < 65).slice(0, 3)) {
    suggestions.push({
      id: `suggestion:validate:${knowledge.id}`,
      type: "validate_knowledge",
      title: `Valider « ${knowledge.title} »`,
      detail: `Cette connaissance n'est consolidée qu'à ${knowledge.confidence}% de confiance.`,
      priority: 70 - knowledge.confidence,
      reason: `${knowledge.sourceIds.length} source(s) cognitive(s) sont actuellement consolidées.`
    });
  }

  return deduplicate(suggestions).sort((a, b) => b.priority - a.priority).slice(0, 8);
}

export function buildKnowledgeSuggestionBrief(suggestions: KnowledgeSuggestion[]): string {
  if (!suggestions.length) return "Aucune suggestion de mémoire prioritaire pour le moment.";
  const top = suggestions[0];
  return `${top.title}. ${top.detail}`;
}

function deduplicate(items: KnowledgeSuggestion[]): KnowledgeSuggestion[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type}:${item.sourceCaseId ?? "local"}:${normalizeId(item.title)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function normalizeId(value: string): string { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function labelForExperience(type: ReusableExperience["type"]): string { return type === "decision" ? "la décision" : type === "risk" ? "le retour de risque" : "l'apprentissage"; }
