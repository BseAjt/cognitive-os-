import type { CognitiveCase } from "../domain/canonical.ts";
import type { ConsolidatedKnowledge } from "./live-memory.ts";

export interface CrossCaseLink {
  sourceCaseId: string;
  targetCaseId: string;
  score: number;
  sharedConcepts: string[];
  rationale: string;
}

export function buildCrossCaseLinks(input: {
  activeCase: CognitiveCase;
  cases: CognitiveCase[];
  knowledgeByCase: Record<string, ConsolidatedKnowledge[]>;
  threshold?: number;
}): CrossCaseLink[] {
  const threshold = input.threshold ?? 22;
  const activeConcepts = conceptsFor(input.activeCase, input.knowledgeByCase[input.activeCase.id] ?? []);

  return input.cases
    .filter((candidate) => candidate.id !== input.activeCase.id)
    .map((candidate) => {
      const candidateConcepts = conceptsFor(candidate, input.knowledgeByCase[candidate.id] ?? []);
      const shared = [...activeConcepts].filter((concept) => candidateConcepts.has(concept));
      const union = new Set([...activeConcepts, ...candidateConcepts]);
      const lexical = union.size ? shared.length / union.size : 0;
      const stateAffinity = input.activeCase.state === candidate.state ? 0.08 : 0;
      const score = Math.min(100, Math.round((lexical + stateAffinity) * 100));
      return {
        sourceCaseId: input.activeCase.id,
        targetCaseId: candidate.id,
        score,
        sharedConcepts: shared.slice(0, 8),
        rationale: shared.length
          ? `${shared.length} concept(s) partagé(s) : ${shared.slice(0, 4).join(", ")}.`
          : "Aucun concept suffisamment discriminant partagé."
      } satisfies CrossCaseLink;
    })
    .filter((link) => link.score >= threshold && link.sharedConcepts.length > 0)
    .sort((a, b) => b.score - a.score);
}

export function reusableKnowledgeForLink(link: CrossCaseLink, targetKnowledge: ConsolidatedKnowledge[]): ConsolidatedKnowledge[] {
  const shared = new Set(link.sharedConcepts);
  return targetKnowledge
    .filter((item) => tokenize(item.title).some((token) => shared.has(token)))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}

function conceptsFor(cognitiveCase: CognitiveCase, records: ConsolidatedKnowledge[]): Set<string> {
  const text = [cognitiveCase.title, cognitiveCase.objective, cognitiveCase.workingHypothesis, cognitiveCase.context, ...records.map((item) => item.title)].join(" ");
  return new Set(tokenize(text));
}

function tokenize(value: string): string[] {
  const stop = new Set(["avec","dans","pour","plus","moins","faire","creer","créer","etre","être","avoir","une","des","les","que","qui","sur","par","est","aux","the","and","from","this","that"]);
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/).filter((token) => token.length >= 4 && !stop.has(token));
}
