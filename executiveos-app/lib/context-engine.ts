export type ContextDomain = "strategy" | "finance" | "people" | "operations" | "market" | "legal" | "history" | "governance";
export type ContextKind = "fact" | "hypothesis" | "constraint" | "preference" | "uncertainty";
export type ContextRequirement = "required" | "important" | "optional";
export type ContextStatus = "missing" | "draft" | "verified" | "stale" | "contested";

export interface ContextItem {
  id: string;
  caseId: string;
  domain: ContextDomain;
  kind: ContextKind;
  key: string;
  label: string;
  value: string;
  unit?: string;
  source?: string;
  owner?: string;
  confidence: number;
  requirement: ContextRequirement;
  status: ContextStatus;
  capturedAt?: string;
  validUntil?: string;
}

export interface ContextQuestion {
  id: string;
  domain: ContextDomain;
  key: string;
  prompt: string;
  placeholder: string;
  requirement: ContextRequirement;
  rationale: string;
}

export interface ContextDomainSummary {
  domain: ContextDomain;
  label: string;
  readiness: number;
  requiredMissing: number;
  total: number;
}

export interface ContextAssessment {
  readiness: number;
  recommendationAllowed: boolean;
  domains: ContextDomainSummary[];
  missingRequired: ContextItem[];
  stale: ContextItem[];
  contested: ContextItem[];
  nextQuestion?: ContextQuestion;
}

export interface ContextReadiness extends ContextAssessment {
  blockingItems: ContextItem[];
}

const domainLabels: Record<ContextDomain, string> = {
  strategy: "Stratégie",
  finance: "Finance",
  people: "Humain & organisation",
  operations: "Opérations",
  market: "Marché & clients",
  legal: "Juridique",
  history: "Historique",
  governance: "Gouvernance"
};

const requirementWeight: Record<ContextRequirement, number> = { required: 5, important: 2, optional: 1 };
const statusScore: Record<ContextStatus, number> = { missing: 0, draft: 0.45, verified: 1, stale: 0.3, contested: 0.15 };

export function assessContext(items: ContextItem[]): ContextReadiness {
  const domains = (Object.keys(domainLabels) as ContextDomain[]).map((domain) => {
    const domainItems = items.filter((item) => item.domain === domain);
    const maximum = domainItems.reduce((sum, item) => sum + requirementWeight[item.requirement], 0);
    const achieved = domainItems.reduce((sum, item) => sum + requirementWeight[item.requirement] * statusScore[item.status] * Math.max(0.25, item.confidence / 100), 0);
    return {
      domain,
      label: domainLabels[domain],
      readiness: maximum ? Math.round((achieved / maximum) * 100) : 100,
      requiredMissing: domainItems.filter((item) => item.requirement === "required" && item.status !== "verified").length,
      total: domainItems.length
    };
  });

  const maximum = items.reduce((sum, item) => sum + requirementWeight[item.requirement], 0);
  const achieved = items.reduce((sum, item) => sum + requirementWeight[item.requirement] * statusScore[item.status] * Math.max(0.25, item.confidence / 100), 0);
  const missingRequired = items.filter((item) => item.requirement === "required" && item.status !== "verified");
  const stale = items.filter((item) => item.status === "stale");
  const contested = items.filter((item) => item.status === "contested");
  const blockingItems = items.filter(
    (item) => (item.requirement === "required" && item.status !== "verified") || item.status === "stale" || item.status === "contested"
  );

  return {
    readiness: maximum ? Math.round((achieved / maximum) * 100) : 0,
    recommendationAllowed: blockingItems.length === 0,
    domains,
    missingRequired,
    stale,
    contested,
    blockingItems,
    nextQuestion: buildAdaptiveQuestions(items)[0]
  };
}

export function buildAdaptiveQuestions(items: ContextItem[]): ContextQuestion[] {
  return items
    .filter((item) => item.status !== "verified")
    .sort((a, b) => requirementWeight[b.requirement] - requirementWeight[a.requirement])
    .map((item) => ({
      id: `question-${item.id}`,
      domain: item.domain,
      key: item.key,
      prompt: questionFor(item),
      placeholder: placeholderFor(item),
      requirement: item.requirement,
      rationale: item.requirement === "required" ? "Information bloquante avant recommandation." : "Améliore la qualité de l’analyse."
    }));
}

export function answerContextItem(item: ContextItem, value: string, source = "Saisie dirigeant"): ContextItem {
  const clean = value.trim();
  return {
    ...item,
    value: clean,
    source,
    confidence: clean ? Math.max(item.confidence, 70) : 0,
    status: clean ? "verified" : "missing",
    capturedAt: clean ? new Date().toISOString() : undefined
  };
}

function questionFor(item: ContextItem): string {
  const prompts: Record<string, string> = {
    strategic_objective: "Quel résultat stratégique cette décision doit-elle produire ?",
    cash_runway_months: "Combien de mois de trésorerie restent disponibles ?",
    target_savings_million: "Quel montant d’économies doit être atteint ?",
    affected_roles_count: "Combien de postes et quelles populations sont potentiellement concernés ?",
    critical_skills: "Quelles compétences doivent absolument être préservées ?",
    alternatives_reviewed: "Quelles alternatives ont déjà été étudiées ?",
    operational_impact: "Quels services, clients ou opérations seraient affectés ?",
    legal_jurisdiction: "Dans quel pays et quel cadre juridique la décision s’applique-t-elle ?",
    social_dialogue_status: "Quel est l’état du dialogue social et des consultations ?",
    decision_deadline: "À quelle date la décision doit-elle être prise ?",
    decision_owner: "Qui porte la décision finale ?",
    prior_decisions: "Quelles décisions comparables ont déjà été prises ?"
  };
  return prompts[item.key] || `Précise : ${item.label}`;
}

function placeholderFor(item: ContextItem): string {
  if (item.unit === "months") return "Ex. 7 mois";
  if (item.unit === "million_EUR") return "Ex. 2,5 M€";
  return `Renseigner ${item.label.toLowerCase()}`;
}

export const workforceRestructuringContextSeed: ContextItem[] = [
  { id: "ctx-objective", caseId: "executiveos", domain: "strategy", kind: "preference", key: "strategic_objective", label: "Objectif stratégique", value: "Restaurer une marge opérationnelle durable sans compromettre les activités critiques.", source: "Comité exécutif", owner: "CEO", confidence: 92, requirement: "required", status: "verified", capturedAt: "2026-08-01T09:00:00.000Z" },
  { id: "ctx-runway", caseId: "executiveos", domain: "finance", kind: "fact", key: "cash_runway_months", label: "Horizon de trésorerie", value: "7", unit: "months", source: "Prévision CFO juillet 2026", owner: "CFO", confidence: 86, requirement: "required", status: "verified", capturedAt: "2026-07-31T18:00:00.000Z", validUntil: "2026-09-30T00:00:00.000Z" },
  { id: "ctx-savings", caseId: "executiveos", domain: "finance", kind: "constraint", key: "target_savings_million", label: "Économies cibles", value: "", unit: "million_EUR", owner: "CFO", confidence: 0, requirement: "required", status: "missing" },
  { id: "ctx-scope", caseId: "executiveos", domain: "people", kind: "uncertainty", key: "affected_roles_count", label: "Périmètre d’effectifs", value: "", owner: "DRH", confidence: 0, requirement: "required", status: "missing" },
  { id: "ctx-skills", caseId: "executiveos", domain: "people", kind: "constraint", key: "critical_skills", label: "Compétences critiques", value: "Architecture produit, support grands comptes et expertise sécurité.", source: "Cartographie RH", owner: "DRH", confidence: 75, requirement: "required", status: "draft", capturedAt: "2026-07-20T10:00:00.000Z" },
  { id: "ctx-alternatives", caseId: "executiveos", domain: "people", kind: "fact", key: "alternatives_reviewed", label: "Alternatives étudiées", value: "Gel des recrutements et réduction des dépenses externes engagés ; mobilité et départs volontaires non chiffrés.", source: "Revue de coûts", owner: "DRH", confidence: 72, requirement: "required", status: "draft", capturedAt: "2026-08-02T14:00:00.000Z" },
  { id: "ctx-operations", caseId: "executiveos", domain: "operations", kind: "uncertainty", key: "operational_impact", label: "Impact opérationnel", value: "Risque possible sur le support client, non simulé.", source: "Operations", owner: "COO", confidence: 48, requirement: "required", status: "contested", capturedAt: "2026-08-03T11:00:00.000Z" },
  { id: "ctx-market", caseId: "executiveos", domain: "market", kind: "fact", key: "revenue_change_percent", label: "Tendance du chiffre d’affaires", value: "-18 % sur douze mois, avec forte concentration sur trois comptes.", source: "CRM + Finance", owner: "CRO", confidence: 91, requirement: "important", status: "verified", capturedAt: "2026-07-31T17:00:00.000Z" },
  { id: "ctx-jurisdiction", caseId: "executiveos", domain: "legal", kind: "constraint", key: "legal_jurisdiction", label: "Cadre juridique", value: "France", source: "Siège social", owner: "Legal", confidence: 100, requirement: "required", status: "verified", capturedAt: "2026-08-01T08:00:00.000Z" },
  { id: "ctx-dialogue", caseId: "executiveos", domain: "legal", kind: "uncertainty", key: "social_dialogue_status", label: "Dialogue social", value: "", owner: "DRH / Legal", confidence: 0, requirement: "required", status: "missing" },
  { id: "ctx-history", caseId: "executiveos", domain: "history", kind: "fact", key: "prior_decisions", label: "Décisions comparables", value: "Gel des recrutements décidé en mars ; objectifs d’économies non atteints en juin.", source: "Decision Ledger", owner: "ORION", confidence: 95, requirement: "important", status: "verified", capturedAt: "2026-08-01T12:00:00.000Z" },
  { id: "ctx-deadline", caseId: "executiveos", domain: "governance", kind: "constraint", key: "decision_deadline", label: "Échéance", value: "30 septembre 2026", source: "Conseil d’administration", owner: "CEO", confidence: 100, requirement: "required", status: "verified", capturedAt: "2026-08-01T09:00:00.000Z" },
  { id: "ctx-owner", caseId: "executiveos", domain: "governance", kind: "fact", key: "decision_owner", label: "Décideur final", value: "CEO après consultation du COMEX et des instances compétentes", source: "Gouvernance", owner: "CEO", confidence: 100, requirement: "required", status: "verified", capturedAt: "2026-08-01T09:00:00.000Z" }
];
