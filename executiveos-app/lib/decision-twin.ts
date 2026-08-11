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

export type EvidenceLevel = "not_started" | "early_signals" | "emerging" | "consolidating" | "usable" | "calibrated";

export function evidenceLevel(decisionCount: number, outcomeCount = 0): EvidenceLevel {
  if (decisionCount === 0) return "not_started";
  if (decisionCount < 3) return "early_signals";
  if (decisionCount < 7) return "emerging";
  if (decisionCount < 15) return "consolidating";
  return outcomeCount >= 8 ? "calibrated" : "usable";
}

export function explainDoctrineScore(principle: DoctrinePrinciple): string {
  const corrected = principle.status === "corrected" ? " et votre correction la plus récente" : principle.status === "confirmed" ? " et votre confirmation" : "";
  const contradiction = principle.counterEvidence.length ? `, malgré ${principle.counterEvidence.length} contre-exemple(s)` : "";
  return `Basé sur ${principle.evidence.length} décision(s) concordante(s)${contradiction}${corrected}.`;
}

export const SCORE_METHOD = [
  "Les décisions explicitement confirmées ou corrigées comptent davantage que les tendances seulement déduites.",
  "Les preuves concordantes renforcent le score ; les contre-exemples le réduisent.",
  "La correction la plus récente de l’utilisateur prévaut toujours sur les interprétations antérieures.",
  "Avec moins de trois décisions, le jumeau affiche une orientation limitée plutôt qu’une conclusion stabilisée."
] as const;

export function qualitativeStrength(evidenceCount: number, confirmed = false): "signal faible" | "tendance émergente" | "tendance récurrente" | "critère confirmé" {
  if (confirmed) return "critère confirmé";
  if (evidenceCount >= 6) return "tendance récurrente";
  if (evidenceCount >= 3) return "tendance émergente";
  return "signal faible";
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

export const PRINCIPLE_RULES = [
  { id: "risk", label: "Votre manière de prendre des risques", statement: "Vous avancez lorsque le gain potentiel justifie clairement l’exposition.", positive: /risque|exposition|réversib|gain potentiel|downside/i, negative: /risque ignoré|irréversible sans/i },
  { id: "clarity", label: "Valeur attendue", statement: "Vous privilégiez les options dont le bénéfice concret est facile à expliquer.", positive: /valeur|clair|lisib|compréh|démonstr|simple|objectif|bénéfice/i, negative: /complex|ambigu|flou/i },
  { id: "execution", label: "Capacité à livrer", statement: "Vous vérifiez que le temps, l’équipe et les moyens permettent réellement d’exécuter.", positive: /exécut|action|déploi|opération|mainten|livr|temps|équipe|moyens/i, negative: /sans exécution|non branch|incomplet|aucune capacité/i },
  { id: "differentiation", label: "Avantage distinctif", statement: "Vous favorisez les options qui apportent une différence visible et difficile à reproduire.", positive: /différen|positionn|catégorie|avantage|unique|thèse|reproduire/i, negative: /générique|banal|copie/i },
  { id: "evidence", label: "Niveau de preuve attendu", statement: "Avant de vous engager, vous cherchez des signaux concrets plutôt qu’une promesse seule.", positive: /preuve|test|valid|donnée|résultat|contexte|source|client|pilote/i, negative: /intuition seule|sans preuve|non vérifi|promesse seule/i }
] as const;

export function buildDecisionDoctrine(input: { decisions: DecisionRecord[]; profiles: CognitiveProfileRecord[]; sources?: ContextSourceRecord[] }): DecisionDoctrine {
  const feedback = new Map<string, { status: DoctrineStatus; statement?: string; createdAt: string }>();
  for (const source of input.sources ?? []) {
    const match = source.title.match(/^Doctrine (confirmée|corrigée):(.+)$/i);
    if (!match) continue;
    const principleId = match[2].trim();
    const previous = feedback.get(principleId);
    if (previous && previous.createdAt >= source.createdAt) continue;
    feedback.set(principleId, { status: match[1].toLocaleLowerCase("fr") === "confirmée" ? "confirmed" : "corrected", statement: source.rawContent.trim() || undefined, createdAt: source.createdAt });
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

export interface OrientationFactor { id: string; label: string; importance: "forte" | "moyenne"; situation: "confirmée" | "absente" | "incertaine"; effect: "positif" | "négatif" | "neutre" }

export function predictDecisionOrientation(input: { cognitiveCase: CognitiveCase; doctrine: DecisionDoctrine }): { orientation: "favorable" | "réservée" | "indéterminée"; confidence: number; confidenceLabel: "limitée" | "modérée" | "étayée"; reasons: string[]; missing: string[]; factors: OrientationFactor[] } {
  const text = `${input.cognitiveCase.title} ${input.cognitiveCase.objective} ${input.cognitiveCase.context}`;
  const matched = PRINCIPLE_RULES.filter((rule) => rule.positive.test(text)).map((rule) => input.doctrine.principles.find((item) => item.id === rule.id)).filter((item): item is DoctrinePrinciple => Boolean(item));
  const missing = input.doctrine.principles.filter((item) => !matched.some((match) => match.id === item.id)).slice(0, 2).map((item) => item.label);
  const factors: OrientationFactor[] = input.doctrine.principles.map((item) => {
    const isMatched = matched.some((match) => match.id === item.id);
    return { id: item.id, label: item.label, importance: item.status === "confirmed" || item.evidence.length >= 3 ? "forte" : "moyenne", situation: isMatched ? "confirmée" : "incertaine", effect: isMatched ? "positif" : "neutre" };
  });
  if (input.doctrine.evidenceCount < 3 || matched.length === 0) return { orientation: "indéterminée", confidence: Math.min(55, 25 + input.doctrine.evidenceCount * 8), confidenceLabel: "limitée", reasons: ["Historique encore insuffisant pour reproduire votre arbitrage."], missing, factors };
  const confidence = Math.min(90, Math.round(matched.reduce((sum, item) => sum + item.confidence, 0) / matched.length));
  return { orientation: input.cognitiveCase.signals.risk >= 8 ? "réservée" : "favorable", confidence, confidenceLabel: input.doctrine.evidenceCount >= 15 ? "étayée" : input.doctrine.evidenceCount >= 8 ? "modérée" : "limitée", reasons: matched.slice(0, 2).map((item) => item.label), missing, factors };
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
      ? "Doctrine émergente : chaque nouvelle décision affine les critères déjà visibles."
      : "Comparer les orientations du jumeau aux décisions et résultats réels.";

  return { maturity, maturityScore, decisionCount, doctrineCoverage, calibration, nextMilestone };
}

export function maturityLabel(maturity: TwinMaturity): string {
  return { initial: "Initialisation", learning: "En apprentissage", calibrated: "Calibré" }[maturity];
}
