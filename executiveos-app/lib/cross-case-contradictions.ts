import type { CognitiveCase, DecisionRecord, DossierObjectRecord, LearningEventRecord } from "../domain/canonical.ts";

export interface CrossCaseContradiction {
  id: string;
  leftCaseId: string;
  rightCaseId: string;
  leftCaseTitle: string;
  rightCaseTitle: string;
  topic: string;
  leftStatement: string;
  rightStatement: string;
  confidence: number;
  reason: string;
}

export function detectCrossCaseContradictions(input: {
  cases: CognitiveCase[];
  decisions: DecisionRecord[];
  caseObjects: DossierObjectRecord[];
  learningEvents: LearningEventRecord[];
}): CrossCaseContradiction[] {
  const statements = collectStatements(input);
  const results: CrossCaseContradiction[] = [];

  for (let i = 0; i < statements.length; i += 1) {
    for (let j = i + 1; j < statements.length; j += 1) {
      const left = statements[i];
      const right = statements[j];
      if (left.caseId === right.caseId) continue;
      const topic = sharedTopic(left.text, right.text);
      if (!topic) continue;
      if (!oppositePolarity(left.text, right.text)) continue;
      const confidence = Math.round((left.confidence + right.confidence) / 2);
      results.push({
        id: `contradiction:${left.id}:${right.id}`,
        leftCaseId: left.caseId,
        rightCaseId: right.caseId,
        leftCaseTitle: left.caseTitle,
        rightCaseTitle: right.caseTitle,
        topic,
        leftStatement: left.text,
        rightStatement: right.text,
        confidence,
        reason: `Positions opposées détectées sur « ${topic} » dans deux dossiers différents.`
      });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

type Statement = { id:string; caseId:string; caseTitle:string; text:string; confidence:number };

function collectStatements(input: { cases:CognitiveCase[]; decisions:DecisionRecord[]; caseObjects:DossierObjectRecord[]; learningEvents:LearningEventRecord[] }): Statement[] {
  const caseById = new Map(input.cases.map((item) => [item.id, item]));
  const output: Statement[] = [];
  for (const decision of input.decisions) {
    const c = caseById.get(decision.caseId); if (!c) continue;
    output.push({ id:decision.id, caseId:decision.caseId, caseTitle:c.title, text:`${decision.outcome} ${decision.recommendation}`, confidence:decision.confidence });
  }
  for (const object of input.caseObjects.filter((item) => item.type === "hypothesis" || item.type === "decision")) {
    const c = caseById.get(object.caseId); if (!c) continue;
    output.push({ id:object.id, caseId:object.caseId, caseTitle:c.title, text:object.title, confidence:object.confidence });
  }
  for (const learning of input.learningEvents) {
    const c = caseById.get(learning.caseId); if (!c) continue;
    output.push({ id:learning.id, caseId:learning.caseId, caseTitle:c.title, text:learning.detail, confidence:learning.confidence ?? 50 });
  }
  return output;
}

function sharedTopic(left: string, right: string): string | undefined {
  const a = tokenize(left); const b = new Set(tokenize(right));
  return a.find((token) => b.has(token));
}

function oppositePolarity(left: string, right: string): boolean {
  const positive = /\b(lancer|adopter|choisir|valider|oui|favorable|utile|prioritaire|augmenter|conserver)\b/i;
  const negative = /\b(ne pas|éviter|eviter|rejeter|non|défavorable|defavorable|inutile|abandonner|réduire|reduire|supprimer)\b/i;
  return (positive.test(left) && negative.test(right)) || (negative.test(left) && positive.test(right));
}

function tokenize(value: string): string[] {
  const stop = new Set(["avec","dans","pour","plus","moins","faire","creer","créer","etre","être","avoir","une","des","les","que","qui","sur","par","est","aux","lancer","adopter","choisir","valider","eviter","éviter","rejeter","abandonner"]);
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/).filter((token) => token.length >= 5 && !stop.has(token));
}
