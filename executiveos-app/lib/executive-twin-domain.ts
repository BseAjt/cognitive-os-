export type EntityType =
  | "organization" | "organizational_unit" | "person" | "goal" | "kpi" | "project"
  | "decision_case" | "context_item" | "scenario" | "assessment" | "decision" | "review_trigger" | "outcome"
  | "risk" | "opportunity" | "action" | "commitment" | "experience" | "evidence" | "memory" | "learning" | "insight"
  | "customer" | "supplier" | "product" | "process" | "application" | "contract" | "market" | "twin_profile";

export type RelationType =
  | "PART_OF" | "MEMBER_OF" | "REPORTS_TO" | "OWNS" | "SPONSORS"
  | "SUPPORTS" | "MEASURES" | "ADVANCES" | "CONFLICTS_WITH" | "DEPENDS_ON"
  | "CONCERNS" | "USES_CONTEXT" | "CONSIDERS" | "ASSESSED_BY" | "SELECTS" | "REJECTS" | "RESULTS_IN" | "REQUIRES_REVIEW_WHEN"
  | "DERIVED_FROM" | "SUPPORTED_BY" | "CONTRADICTED_BY" | "SUPERSEDES" | "VALIDATES" | "INVALIDATES" | "LEARNED_FROM"
  | "CREATES" | "ASSIGNED_TO" | "BLOCKS" | "MITIGATES" | "MONITORS" | "ACHIEVES" | "AFFECTS";

export interface BaseEntity {
  id: string;
  organizationId: string;
  type: EntityType;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  source?: string;
}

export interface GraphRelation {
  id: string;
  organizationId: string;
  sourceId: string;
  sourceType: EntityType;
  targetId: string;
  targetType: EntityType;
  relationType: RelationType;
  confidence: number;
  provenance: string;
  validFrom: string;
  validTo?: string;
}

export interface ExecutiveTwinSeed {
  entities: BaseEntity[];
  relations: GraphRelation[];
  briefing: {
    twinHealth: number;
    openDecisions: number;
    criticalRisks: number;
    invalidatedHypotheses: number;
    dueCommitments: number;
    newKnowledge: number;
    recommendation: string;
  };
}

const now = "2026-08-06T15:00:00.000Z";
const org = "org-novaris";

export const executiveTwinSeed: ExecutiveTwinSeed = {
  briefing: {
    twinHealth: 72,
    openDecisions: 3,
    criticalRisks: 2,
    invalidatedHypotheses: 1,
    dueCommitments: 4,
    newKnowledge: 18,
    recommendation: "Finaliser le contexte financier et social avant tout arbitrage irréversible."
  },
  entities: [
    entity("org-novaris", "organization", "Novaris Systems", "active"),
    entity("person-ceo", "person", "Sébastien · CEO", "active"),
    entity("goal-profitability", "goal", "Restaurer une rentabilité durable", "at_risk"),
    entity("kpi-runway", "kpi", "Cash runway · 7 mois", "warning"),
    entity("risk-capabilities", "risk", "Perte de compétences critiques", "critical"),
    entity("decision-workforce", "decision_case", "Trajectoire de transformation des coûts et effectifs", "context_building"),
    entity("context-revenue", "context_item", "Chiffre d’affaires en baisse de 18 %", "verified"),
    entity("context-operations", "context_item", "Impact opérationnel de la réduction d’effectifs", "contested"),
    entity("scenario-containment", "scenario", "Réduction des coûts sans départs contraints", "provisional"),
    entity("scenario-mobility", "scenario", "Départs volontaires et mobilité interne", "provisional"),
    entity("memory-freeze", "memory", "Le gel des recrutements a ralenti les coûts mais accru la charge", "validated"),
    entity("learning-reorg", "learning", "Protéger les compétences critiques avant toute réorganisation", "validated"),
    entity("action-context", "action", "Documenter la cible d’économies et le périmètre des postes", "todo")
  ],
  relations: [
    relation("r1", "person-ceo", "person", "org-novaris", "organization", "MEMBER_OF", 100, "Seed organization"),
    relation("r2", "person-ceo", "person", "goal-profitability", "goal", "OWNS", 100, "Executive mandate"),
    relation("r3", "goal-profitability", "goal", "decision-workforce", "decision_case", "CONCERNS", 95, "Decision dossier"),
    relation("r4", "kpi-runway", "kpi", "goal-profitability", "goal", "MEASURES", 98, "CFO forecast"),
    relation("r5", "risk-capabilities", "risk", "decision-workforce", "decision_case", "AFFECTS", 90, "DRH assessment"),
    relation("r6", "decision-workforce", "decision_case", "context-revenue", "context_item", "USES_CONTEXT", 96, "Management reporting"),
    relation("r7", "decision-workforce", "decision_case", "context-operations", "context_item", "USES_CONTEXT", 55, "Operations review"),
    relation("r8", "decision-workforce", "decision_case", "scenario-containment", "scenario", "CONSIDERS", 100, "Scenario Builder"),
    relation("r9", "decision-workforce", "decision_case", "scenario-mobility", "scenario", "CONSIDERS", 100, "Scenario Builder"),
    relation("r10", "memory-freeze", "memory", "decision-workforce", "decision_case", "SUPPORTED_BY", 82, "Organizational Memory"),
    relation("r11", "learning-reorg", "learning", "risk-capabilities", "risk", "LEARNED_FROM", 88, "Prior reorganization outcome"),
    relation("r12", "decision-workforce", "decision_case", "action-context", "action", "CREATES", 100, "Decision workflow")
  ]
};

function entity(id: string, type: EntityType, title: string, status: string): BaseEntity {
  return { id, organizationId: org, type, title, status, createdAt: now, updatedAt: now, source: "Release 1 demonstration seed" };
}

function relation(id: string, sourceId: string, sourceType: EntityType, targetId: string, targetType: EntityType, relationType: RelationType, confidence: number, provenance: string): GraphRelation {
  return { id, organizationId: org, sourceId, sourceType, targetId, targetType, relationType, confidence, provenance, validFrom: now };
}

export function validateExecutiveTwinSeed(seed: ExecutiveTwinSeed): string[] {
  const errors: string[] = [];
  const ids = new Set(seed.entities.map((item) => item.id));
  if (ids.size !== seed.entities.length) errors.push("Entity identifiers must be unique.");
  seed.relations.forEach((edge) => {
    if (!ids.has(edge.sourceId)) errors.push(`Missing source entity ${edge.sourceId}.`);
    if (!ids.has(edge.targetId)) errors.push(`Missing target entity ${edge.targetId}.`);
    if (edge.confidence < 0 || edge.confidence > 100) errors.push(`Invalid confidence on ${edge.id}.`);
  });
  return errors;
}

export function entityCounts(seed: ExecutiveTwinSeed): Record<string, number> {
  return seed.entities.reduce<Record<string, number>>((counts, item) => ({ ...counts, [item.type]: (counts[item.type] ?? 0) + 1 }), {});
}