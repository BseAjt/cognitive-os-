import type { CognitiveCase, DecisionRecord, DossierObjectRecord, LearningEventRecord } from "../domain/canonical.ts";
import type { CrossCaseLink } from "./cross-case-memory.ts";

export interface ReusableExperience {
  sourceCaseId: string;
  sourceCaseTitle: string;
  type: "decision" | "learning" | "risk";
  title: string;
  detail: string;
  confidence: number;
  relevance: number;
  reason: string;
}

export function buildReusableExperiences(input: {
  activeCase: CognitiveCase;
  cases: CognitiveCase[];
  links: CrossCaseLink[];
  decisions: DecisionRecord[];
  caseObjects: DossierObjectRecord[];
  learningEvents: LearningEventRecord[];
}): ReusableExperience[] {
  const caseById = new Map(input.cases.map((item) => [item.id, item]));
  const linkedIds = new Map(input.links.map((link) => [link.targetCaseId, link]));
  const output: ReusableExperience[] = [];

  for (const [caseId, link] of linkedIds.entries()) {
    const sourceCase = caseById.get(caseId);
    if (!sourceCase) continue;
    const reason = `Dossier similaire à ${link.score}% · ${link.rationale}`;

    for (const decision of input.decisions.filter((item) => item.caseId === caseId)) {
      output.push({
        sourceCaseId: caseId,
        sourceCaseTitle: sourceCase.title,
        type: "decision",
        title: decision.outcome,
        detail: decision.rationale,
        confidence: decision.confidence,
        relevance: relevance(link.score, decision.confidence),
        reason
      });
    }

    for (const learning of input.learningEvents.filter((item) => item.caseId === caseId)) {
      output.push({
        sourceCaseId: caseId,
        sourceCaseTitle: sourceCase.title,
        type: "learning",
        title: learning.title,
        detail: learning.detail,
        confidence: learning.confidence ?? 50,
        relevance: relevance(link.score, learning.confidence ?? 50),
        reason
      });
    }

    for (const risk of input.caseObjects.filter((item) => item.caseId === caseId && item.type === "risk" && item.status !== "resolved")) {
      output.push({
        sourceCaseId: caseId,
        sourceCaseTitle: sourceCase.title,
        type: "risk",
        title: risk.title,
        detail: risk.title,
        confidence: risk.confidence,
        relevance: relevance(link.score, risk.confidence),
        reason
      });
    }
  }

  return output.sort((a, b) => b.relevance - a.relevance).slice(0, 12);
}

export function buildExperienceRecommendation(items: ReusableExperience[]): string {
  if (!items.length) return "Aucune expérience passée suffisamment proche pour être réutilisée.";
  const best = items[0];
  return `Expérience réutilisable depuis « ${best.sourceCaseTitle} » : ${best.title}. ${best.reason}`;
}

function relevance(similarity: number, confidence: number): number {
  return Math.round(similarity * 0.6 + confidence * 0.4);
}
