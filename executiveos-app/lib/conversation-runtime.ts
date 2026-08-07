import type { CognitiveCase } from "../domain/canonical.ts";
import { runDecisionRuntime, type DecisionFrame } from "./decision-runtime.ts";

export type CognitiveKind = "goal" | "hypothesis" | "risk" | "decision" | "action" | "question" | "context";
export type RuntimeIntent = "continue" | "idea" | "decision" | "problem" | "meeting" | "general";

export interface CognitiveExtraction {
  kind: CognitiveKind;
  text: string;
  confidence: number;
}

export interface RuntimeResult {
  intent: RuntimeIntent;
  extractions: CognitiveExtraction[];
  response: string;
  nextAction: string;
  casePatch: Partial<CognitiveCase>;
  decisionFrame?: DecisionFrame;
}

const DECISION_PATTERNS = [
  /\bdois-je\b/, /\bdois je\b/, /\bdevrais-je\b/, /\bfaut-il\b/, /\best-ce que je dois\b/,
  /\best-ce qu['’]on devrait\b/, /\best-ce une bonne idée de\b/,
  /\best-il (?:pertinent|préférable|opportun|raisonnable) de\b/, /\bvaut-il mieux\b/,
  /\bque choisir\b/, /\bquel choix\b/, /\bquelle option\b.*\b(?:choisir|retenir|prendre)\b/,
  /\bquel scénario\b.*\b(?:choisir|retenir)\b/, /\bchoisir entre\b/, /\bnous devons choisir\b/,
  /\bje dois décider\b/, /\bje veux décider\b/,
  /\bje me demande si\b.*\b(?:dois|devons|devrait|devrions|faut)\b/,
  /\bdevrions-nous\b/, /\bdoit-on\b/, /\bshould i\b/, /\bshould we\b/,
  /\bi need to decide whether\b/, /\bwould it be better to\b/
];

export function runConversationRuntime(message: string, cognitiveCase: CognitiveCase): RuntimeResult {
  const normalized = message.trim();
  if (!normalized) {
    return { intent: "general", extractions: [], response: "Décris la situation ou la décision que tu veux traiter.", nextAction: "Formuler le sujet en une phrase.", casePatch: {} };
  }

  const lower = normalized.toLowerCase();
  const intent = detectIntent(lower);
  const sentences = normalized.split(/(?<=[.!?])\s+|\n+/).map((value) => value.trim()).filter(Boolean);
  const extractions = sentences.map((sentence) => classify(sentence, intent));
  const risk = extractions.find((item) => item.kind === "risk");
  const hypothesis = extractions.find((item) => item.kind === "hypothesis");
  const decision = extractions.find((item) => item.kind === "decision");
  const action = extractions.find((item) => item.kind === "action");
  const decisionRuntime = intent === "decision" ? runDecisionRuntime(normalized, cognitiveCase) : undefined;
  const decisionFrame = decisionRuntime?.frame;

  const casePatch: Partial<CognitiveCase> = {
    context: normalized,
    state: intent === "decision" || decision ? "decide" : action ? "execute" : cognitiveCase.state,
    signals: {
      ...cognitiveCase.signals,
      confidence: hypothesis ? Math.max(35, cognitiveCase.signals.confidence - 8) : cognitiveCase.signals.confidence,
      risk: risk ? Math.min(10, cognitiveCase.signals.risk + 2) : cognitiveCase.signals.risk,
      urgency: intent === "decision" || decision || action ? Math.min(10, cognitiveCase.signals.urgency + 1) : cognitiveCase.signals.urgency
    }
  };

  const nextAction = decisionRuntime?.nextAction
    ?? action?.text
    ?? buildNextAction(intent, cognitiveCase, risk, hypothesis);
  const response = decisionFrame ? buildDecisionResponse(decisionFrame) : buildResponse(intent, cognitiveCase, extractions, nextAction);

  return { intent, extractions, response, nextAction, casePatch, decisionFrame };
}

export function detectIntent(lower: string): RuntimeIntent {
  if (DECISION_PATTERNS.some((pattern) => pattern.test(lower))) return "decision";
  if (/j['’]ai une idée|nouvelle idée|idée de/.test(lower)) return "idea";
  if (/j['’]ai un problème|problème|bloqué|blocage|incident|crise/.test(lower)) return "problem";
  if (/réunion|compte rendu|meeting|comité|atelier/.test(lower)) return "meeting";
  if (/continue|reprendre|où en étions|où en étais|rappelle-moi/.test(lower)) return "continue";
  return "general";
}

function classify(sentence: string, intent: RuntimeIntent): CognitiveExtraction {
  const lower = sentence.toLowerCase();
  if (intent === "decision" && DECISION_PATTERNS.some((pattern) => pattern.test(lower))) return item("decision", sentence, 95);
  if (/risque|danger|incertain|bloqu|peur|crainte|menace/.test(lower)) return item("risk", sentence, 84);
  if (/je pense|j['’]imagine|hypothèse|probable|peut-être|je crois/.test(lower)) return item("hypothesis", sentence, 80);
  if (/je décide|nous décidons|décision prise|nous retenons/.test(lower)) return item("decision", sentence, 88);
  if (/il faut|prochaine étape|je dois|nous devons|action|avant vendredi|d'ici|d’ici/.test(lower)) return item("action", sentence, 86);
  if (/objectif|je veux obtenir|résultat attendu|but est/.test(lower)) return item("goal", sentence, 82);
  if (sentence.includes("?")) return item("question", sentence, 92);
  return item("context", sentence, 74);
}

function item(kind: CognitiveKind, text: string, confidence: number): CognitiveExtraction {
  return { kind, text: text.trim(), confidence };
}

function buildNextAction(intent: RuntimeIntent, cognitiveCase: CognitiveCase, risk?: CognitiveExtraction, hypothesis?: CognitiveExtraction): string {
  if (risk) return `Réduire l'incertitude liée à : ${risk.text}`;
  if (hypothesis) return `Définir une expérience pour tester : ${hypothesis.text}`;
  if (intent === "idea") return "Formuler le problème utilisateur et identifier la première hypothèse à tester.";
  if (intent === "meeting") return "Valider les décisions, propriétaires et échéances issus de la réunion.";
  if (intent === "continue") return cognitiveCase.context || "Reprendre la dernière action ouverte du dossier.";
  return "Préciser ce qui doit être vrai pour considérer ce dossier comme réussi.";
}

function buildDecisionResponse(frame: DecisionFrame): string {
  const options = frame.options
    .map((option, index) => `${index + 1}. ${option.title}${option.score === null ? "" : ` — ${option.score}/100`} : ${option.description}`)
    .join("\n");

  if (frame.requiresContext) {
    return [
      `Décision critique détectée : ${frame.question}`,
      `Classification : ${frame.classifications.join(" / ")}.`,
      `Conseil requis : ${frame.requiredAgents.join(", ")}.`,
      "",
      "Je ne formule pas de recommandation à ce stade : le contexte disponible est insuffisant pour une décision réglementée et à fort impact humain.",
      "",
      `Scénarios à instruire :\n${options}`,
      "",
      `Informations indispensables : ${frame.missingInformation.join(", ")}.`,
      `Prochaine étape : ${frame.reviewTrigger}`
    ].join("\n");
  }

  return [
    `Décision cadrée : ${frame.question}`,
    "",
    `Options comparées :\n${options}`,
    "",
    `Recommandation : ${frame.recommendation}`,
    `Confiance : ${frame.confidence}%`,
    `Informations manquantes : ${frame.missingInformation.join(", ")}.`,
    `Déclencheur de révision : ${frame.reviewTrigger}`
  ].join("\n");
}

function buildResponse(intent: RuntimeIntent, cognitiveCase: CognitiveCase, extractions: CognitiveExtraction[], nextAction: string): string {
  const labels = [...new Set(extractions.map((item) => item.kind))];
  const opening = {
    continue: `Tu reprends « ${cognitiveCase.title} ».`,
    idea: "J'ai transformé ton idée en premiers objets de raisonnement.",
    decision: "J'ai identifié une décision à structurer.",
    problem: "J'ai isolé le problème, ses risques et la prochaine réduction d'incertitude.",
    meeting: "J'ai analysé cette réunion comme une source de décisions et d'actions.",
    general: "J'ai intégré ce nouveau contexte au dossier actif."
  }[intent];
  return `${opening} Éléments détectés : ${labels.join(", ") || "contexte"}. Prochaine meilleure action : ${nextAction}`;
}
