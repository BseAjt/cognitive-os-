import type { CognitiveCase, CognitiveProfileRecord, ContextSourceRecord, DecisionRecord } from "../domain/canonical.ts";

export type TwinMaturity = "initial" | "learning" | "calibrated";

export interface DecisionTwinSnapshot {
  maturity: TwinMaturity;
  maturityScore: number;
  decisionCount: number;
  doctrineCoverage: number;
  calibration: number | null;
  nextMilestone: string;
}

export type DoctrineStatus = "inferred" | "confirmed" | "corrected";

export interface DoctrinePrinciple {
  id: string;
  label: string;
  statement: string;
  confidence: number;
  status: DoctrineStatus;
  evidence: Array<{ decisionId: string; outcome: string; rationale: string }>;
  counterEvidence: Array<{ decisionId: string; outcome: string; rationale: string }>;
}

export interface DecisionDoctrine {
  principles: DoctrinePrinciple[];
  riskTolerance: "prudente" | "équilibrée" | "offensive" | "à apprendre";
  biasSignals: string[];
  evidenceCount: number;
}

const PRINCIPLE_RULES = [
  { id: "clarity", label: "Clarté de la valeur", statement: "Vous privilégiez les opportunités dont la valeur est immédiatement compréhensible.", positive: /valeur|clair|lisib|compréh|démonstr|simple|objectif/i, negative: /complex|ambigu|flou/i },
  { id: "execution", label: "Capacité d’exécution", statement: "Vous accordez un poids fort à la capacité de transformer une conviction en exécution mesurable.", positive: /exécut|action|déploi|opération|mainten|livr|runtime/i, negative: /sans exécution|non branch|incomplet/i },
  { id: "differentiation", label: "Différenciation", statement: "Vous recherchez une thèse distinctive avant d’engager davantage de ressources.", positive: /différen|positionn|catégorie|avantage|unique|thèse/i, negative: /générique|banal|copie/i },
  { id: "evidence", label: "Preuve avant conviction", statement: "Vous augmentez votre conviction lorsque les hypothèses sont reliées à des preuves observables.", positive: /preuve|test|valid|donnée|résultat|contexte|source/i, negative: /intuition seule|sans preuve|non vérifi/i }
] as const;

export function buildDecisionDoctrine(input: { decisions: DecisionRecord[]; profiles: CognitiveProfileRecord[]; sources?: ContextSourceRecord[] }): DecisionDoctrine {
  const feedback = new Map<string, { status: DoctrineStatus; statement?: string }>();
  for (const source of input.sources ?? []) {
    const match = source.title.match(/^Doctrine (confirmée|corrigée):(.+)$/i);
    if (!match) continue;
    feedback.set(match[2].trim(), { status: match[1].toLocaleLowerCase("fr") === "confirmée" ? "confirmed" : "corrected", statement: source.rawContent.trim() || undefined });
  }
  const principles = PRINCIPLE_RULES.map((rule) => {
    const evidence = input.decisions.filter((item) => rule.positive.test(`${item.outcome} ${item.recommendation} ${item.rationale}`));
    const counterEvidence = input.decisions.filter((item) => rule.negative.test(`${item.outcome} ${item.recommendation} ${item.rationale}`));
    const correction = feedback.get(rule.id);
    return {
      id: rule.id,
      label: rule.label,
      statement: correction?.statement ?? rule.statement,
      confidence: Math.min(95, Math.max(35, 42 + evidence.length * 13 - counterEvidence.length * 9 + (correction ? 12 : 0))),
      status: correction?.status ?? "inferred",
      evidence: evidence.slice(0, 3).map(({ id: decisionId, outcome, rationale }) => ({ decisionId, outcome, rationale })),
      counterEvidence: counterEvidence.slice(0, 2).map(({ id: decisionId, outcome, rationale }) => ({ decisionId, outcome, rationale }))
    } satisfies DoctrinePrinciple;
  }).filter((item) => item.evidence.length > 0 || item.status !== "inferred");
  const averageRisk = input.profiles.length ? input.profiles.reduce((sum, item) => sum + item.riskDiscipline, 0) / input.profiles.length : null;
  const riskTolerance = averageRisk === null ? "à apprendre" : averageRisk >= 80 ? "prudente" : averageRisk >= 60 ? "équilibrée" : "offensive";
  return {
    principles,
    riskTolerance,
    biasSignals: [...new Set(input.profiles.flatMap((item) => item.biasSignals))].slice(0, 4),
    evidenceCount: input.decisions.length
  };
}

export function predictDecisionOrientation(input: { cognitiveCase: CognitiveCase; doctrine: DecisionDoctrine }): { orientation: "favorable" | "réservée" | "indéterminée"; confidence: number; reasons: string[]; missing: string[] } {
  const text = `${input.cognitiveCase.title} ${input.cognitiveCase.objective} ${input.cognitiveCase.context}`;
  const matched = PRINCIPLE_RULES.filter((rule) => rule.positive.test(text)).map((rule) => input.doctrine.principles.find((item) => item.id === rule.id)).filter((item): item is DoctrinePrinciple => Boolean(item));
  const missing = input.doctrine.principles.filter((item) => !matched.some((match) => match.id === item.id)).slice(0, 2).map((item) => item.label);
  if (input.doctrine.evidenceCount < 3 || matched.length === 0) return { orientation: "indéterminée", confidence: Math.min(55, 25 + input.doctrine.evidenceCount * 8), reasons: ["Historique encore insuffisant pour reproduire votre arbitrage."], missing };
  const confidence = Math.min(90, Math.round(matched.reduce((sum, item) => sum + item.confidence, 0) / matched.length));
  return { orientation: input.cognitiveCase.signals.risk >= 8 ? "réservée" : "favorable", confidence, reasons: matched.slice(0, 2).map((item) => item.label), missing };
}

export function buildDecisionTwinSnapshot(input: {
  cases: CognitiveCase[];
  decisions: DecisionRecord[];
  profiles: CognitiveProfileRecord[];
}): DecisionTwinSnapshot {
  const decisionCount = input.decisions.length;
  const documentedCases = input.cases.filter((item) => item.context.trim().length >= 40).length;
  const doctrineCoverage = Math.min(100, Math.round((decisionCount / 10) * 60 + (documentedCases / 5) * 40));
  const calibration = input.profiles.length
    ? Math.round(input.profiles.reduce((sum, item) => sum + item.calibration, 0) / input.profiles.length)
    : null;
  const maturityScore = Math.min(100, Math.round(doctrineCoverage * 0.7 + (calibration ?? 0) * 0.3));
  const maturity: TwinMaturity = decisionCount >= 10 && calibration !== null ? "calibrated" : decisionCount >= 3 ? "learning" : "initial";
  const nextMilestone = decisionCount < 3
    ? `Importer ${3 - decisionCount} décision${3 - decisionCount > 1 ? "s" : ""} pour révéler les premiers critères récurrents.`
    : decisionCount < 10
      ? `Ajouter ${10 - decisionCount} décision${10 - decisionCount > 1 ? "s" : ""} pour stabiliser la doctrine.`
      : "Comparer les prédictions du jumeau aux décisions et résultats réels.";

  return { maturity, maturityScore, decisionCount, doctrineCoverage, calibration, nextMilestone };
}

export function maturityLabel(maturity: TwinMaturity): string {
  return { initial: "Initialisation", learning: "En apprentissage", calibrated: "Calibré" }[maturity];
}
