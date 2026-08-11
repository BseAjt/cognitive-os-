import type {
  ActionRecord,
  AgentRunRecord,
  CognitiveCase,
  CognitiveEventRecord,
  CognitiveProfileRecord,
  DecisionRecord,
  KnowledgeEntity,
  KnowledgeRecord,
  KnowledgeRelation,
  LearningEventRecord,
  MemoryRecord,
  ReflectionRecord
} from "../domain/canonical.ts";
import { defaultExecutiveAgents } from "../lib/agent-runtime.ts";
import type { ConversationMessage, ReasoningRevision } from "./types.ts";

const t = (day: string, hour = "09:00:00") => `2026-08-${day}T${hour}+02:00`;

export const initialCases: CognitiveCase[] = [
  {
    id: "executiveos",
    title: "Construire ExecutiveOS",
    objective: "Transformer ExecutiveOS en produit démontrable, cohérent et prêt à être présenté.",
    workingHypothesis: "Un Decision Operating System réduit le coût cognitif et augmente la qualité d’exécution des dirigeants.",
    context: "Le Conversation Runtime, la mémoire cognitive et l’Executive Runtime sont désormais réunis dans une même application Next.js.",
    state: "decide",
    signals: { impact: 10, urgency: 9, confidence: 81, cognitiveCost: 8, risk: 6 }
  },
  {
    id: "positioning",
    title: "Valider le positionnement marché",
    objective: "Créer une catégorie immédiatement comprise par un dirigeant, un investisseur ou un futur client.",
    workingHypothesis: "Decision Operating System est plus clair et différenciant qu’un simple assistant IA exécutif.",
    context: "Le produit doit relier compréhension, décision, action, mémoire et apprentissage dans un seul parcours.",
    state: "explore",
    signals: { impact: 9, urgency: 7, confidence: 76, cognitiveCost: 5, risk: 5 }
  },
  {
    id: "investor-demo",
    title: "Préparer la démonstration investisseur",
    objective: "Rendre la valeur d’ExecutiveOS visible en moins de cinq minutes.",
    workingHypothesis: "Une démonstration basée sur la continuité cognitive et une décision réelle rendra la catégorie évidente.",
    context: "La démo doit fonctionner sans configuration externe et montrer des données crédibles dès l’ouverture.",
    state: "execute",
    signals: { impact: 9, urgency: 8, confidence: 73, cognitiveCost: 6, risk: 4 }
  },
  {
    id: "architecture",
    title: "Industrialiser l’architecture",
    objective: "Obtenir une base technique maintenable, testable et déployable en continu.",
    workingHypothesis: "Un store canonique et des moteurs découplés réduisent fortement la dette de la phase prototype.",
    context: "Le runtime Phase 2 a été porté dans l’application Next.js et doit maintenant être consolidé.",
    state: "learn",
    signals: { impact: 8, urgency: 6, confidence: 86, cognitiveCost: 7, risk: 4 }
  }
];

export const initialMessages: ConversationMessage[] = [
  { id: "msg-1", caseId: "executiveos", role: "assistant", text: "Bonjour. Tu reprends ExecutiveOS au moment où le runtime cognitif et l’interface convergent. Le principal enjeu est maintenant de prouver que le produit forme un système cohérent, pas une collection de modules.", createdAt: t("05", "08:40:00") },
  { id: "msg-2", caseId: "executiveos", role: "user", text: "Je veux que toutes les capacités construites depuis le début soient visibles et réellement utilisables dans une seule application.", createdAt: t("05", "08:43:00") },
  { id: "msg-3", caseId: "executiveos", role: "assistant", text: "Assistant de décision recommande de prioriser trois preuves : continuité de contexte, décision structurée, puis transformation de la décision en actions orchestrées. La mémoire et le graphe servent de tissu commun entre ces étapes.", createdAt: t("05", "08:44:00") },
  { id: "msg-4", caseId: "positioning", role: "assistant", text: "Le positionnement le plus robuste est celui d’un Decision Operating System : ExecutiveOS comprend le contexte, structure les arbitrages, orchestre l’exécution et apprend des résultats.", createdAt: t("05", "11:15:00") },
  { id: "msg-5", caseId: "investor-demo", role: "assistant", text: "Pour la démo, commence par Accueil, ouvre un nœud du Brain, reprends une décision, transforme-la en action puis montre comment le graphe et la mémoire se mettent à jour.", createdAt: t("06", "10:05:00") }
];

export const initialAgents = defaultExecutiveAgents;

export const initialDecisions: DecisionRecord[] = [
  { id: "dec-1", caseId: "executiveos", recommendation: "Conserver ExecutiveOS comme produit unique et intégrer les moteurs derrière des parcours utilisateur.", outcome: "Architecture UX unifiée retenue", rationale: "La valeur est plus claire lorsque l’utilisateur navigue par objectifs — comprendre, décider, agir — plutôt que par moteurs techniques.", confidence: 91, createdAt: t("05", "14:20:00") },
  { id: "dec-2", caseId: "positioning", recommendation: "Positionner ExecutiveOS comme Decision Operating System.", outcome: "Positionnement retenu pour la démo", rationale: "La catégorie décrit mieux la boucle complète contexte → arbitrage → exécution → apprentissage qu’un copilote IA.", confidence: 84, createdAt: t("05", "16:10:00") },
  { id: "dec-3", caseId: "architecture", recommendation: "Faire du store canonique la source de vérité du runtime client.", outcome: "Modèle canonique adopté", rationale: "Cela évite les divergences entre vues et rend les projections graphe, mémoire et exécution calculables depuis un état commun.", confidence: 88, createdAt: t("06", "09:30:00") }
];

export const initialRuntimeActions: ActionRecord[] = [
  { id: "act-1", caseId: "executiveos", title: "Valider le parcours Accueil → Décider → Agir → Explorer", owner: "Assistant de décision", progress: 65, status: "doing", requiredCapability: "analysis", assignedAgentId: "orion", dueAt: t("08", "18:00:00") },
  { id: "act-2", caseId: "executiveos", title: "Vérifier l’architecture du runtime agentique", owner: "Perspective de faisabilité", progress: 80, status: "doing", requiredCapability: "technology", assignedAgentId: "turing", dueAt: t("08", "17:00:00") },
  { id: "act-3", caseId: "positioning", title: "Tester le pitch Decision Operating System sur trois profils dirigeants", owner: "Perspective stratégique", progress: 35, status: "doing", requiredCapability: "strategy", assignedAgentId: "athena", dueAt: t("11", "12:00:00") },
  { id: "act-4", caseId: "investor-demo", title: "Préparer un scénario de démonstration de cinq minutes", owner: "Assistant de décision", progress: 20, status: "todo", requiredCapability: "orchestration", assignedAgentId: "orion", dueAt: t("10", "18:00:00") },
  { id: "act-5", caseId: "architecture", title: "Supprimer les dépendances et sources Phase 2 devenues redondantes", owner: "Perspective de faisabilité", progress: 100, status: "done", requiredCapability: "technology", assignedAgentId: "turing", result: "Les capacités utiles ont été portées dans le runtime Next.js." },
  { id: "act-6", caseId: "executiveos", title: "Qualifier les risques de cohérence entre données persistées et nouveaux seeds", owner: "Perspective de prudence", progress: 0, status: "todo", requiredCapability: "risk", assignedAgentId: "seneca", dueAt: t("09", "15:00:00") }
];

export const initialEvents: CognitiveEventRecord[] = [
  { id: "evt-1", type: "ArchitectureUnified", detail: "Executive Runtime Phase 2 porté dans l’application Next.js.", createdAt: t("06", "09:00:00") },
  { id: "evt-2", type: "PositioningConfirmed", detail: "Decision Operating System retenu comme formulation principale.", createdAt: t("05", "16:10:00") },
  { id: "evt-3", type: "RiskDetected", detail: "Les onglets Comprendre et Paramètres ne doivent plus rester des placeholders.", createdAt: t("07", "16:45:00") },
  { id: "evt-4", type: "DemoDataRequested", detail: "Demande de données représentatives sur tous les onglets et de vérification fonctionnelle complète.", createdAt: t("07", "17:22:00") }
];

export const initialLearningEvents: LearningEventRecord[] = [
  { id: "learn-1", caseId: "executiveos", type: "KnowledgeLearned", title: "La navigation doit masquer la complexité technique", detail: "Les utilisateurs comprennent mieux Comprendre / Décider / Agir / Explorer que les noms internes des moteurs.", significance: "high", confidence: 93, source: "cognitive_diff", createdAt: t("05", "14:30:00") },
  { id: "learn-2", caseId: "executiveos", type: "ConfidenceChanged", title: "Confiance accrue dans l’intégration Phase 2", detail: "Le runtime peut être projeté depuis l’état canonique sans conserver une application parallèle.", significance: "high", confidence: 88, source: "cognitive_diff", createdAt: t("06", "09:45:00") },
  { id: "learn-3", caseId: "positioning", type: "BeliefReinforced", title: "La décision est le centre de gravité", detail: "Mémoire, agents et graphe deviennent plus lisibles lorsqu’ils sont reliés à une décision ou une action concrète.", significance: "medium", confidence: 82, source: "cognitive_diff", createdAt: t("06", "11:20:00") },
  { id: "learn-4", caseId: "investor-demo", type: "RiskDetected", title: "Une démo vide dégrade la perception produit", detail: "Chaque surface doit raconter une histoire immédiatement sans demander à l’utilisateur de créer d’abord les données.", significance: "high", confidence: 96, source: "cognitive_diff", createdAt: t("07", "16:50:00") }
];

export const initialReflections: ReflectionRecord[] = [
  { id: "ref-1", caseId: "executiveos", summary: "ExecutiveOS est passé d’un assemblage de moteurs à une boucle cognitive intégrée.", whatChanged: ["Le runtime Phase 2 vit dans Next.js", "La navigation est organisée par verbes", "Le graphe dérive de l’état réel"], whyItChanged: ["Réduire la fragmentation", "Rendre la proposition de valeur visible"], learned: ["La continuité cognitive est le meilleur point d’entrée", "Les données de démonstration font partie de l’expérience produit"], uncertainties: ["Niveau de persistance cloud nécessaire pour la prochaine phase"], decisionsToReconsider: ["Conserver ou non des vues techniques avancées accessibles en mode expert"], confidence: 88, significance: "high", source: "reflection_engine", createdAt: t("07", "09:10:00") },
  { id: "ref-2", caseId: "positioning", summary: "Le terme Cognitive OS reste utile comme vision, mais Decision Operating System est plus actionnable commercialement.", whatChanged: ["Positionnement recentré sur la décision"], whyItChanged: ["Réduire l’effort d’explication"], learned: ["La catégorie doit décrire un résultat avant de décrire la technologie"], uncertainties: ["Réaction de profils non technophiles"], decisionsToReconsider: [], confidence: 81, significance: "medium", source: "reflection_engine", createdAt: t("06", "15:20:00") }
];

export const initialCognitiveProfiles: CognitiveProfileRecord[] = [
  { id: "dna-1", caseId: "executiveos", calibration: 82, beliefStability: 74, revisionRate: 68, riskDiscipline: 79, learningQuality: 90, dominantPatterns: ["Vision systémique", "Itération rapide", "Recherche d’intégration", "Priorité au concret"], biasSignals: ["Risque de sur-construction", "Tendance à ouvrir plusieurs chantiers en parallèle"], sampleSize: 27, source: "cognitive_dna", createdAt: t("05", "18:00:00"), updatedAt: t("07", "16:30:00") },
  { id: "dna-2", caseId: "positioning", calibration: 78, beliefStability: 69, revisionRate: 72, riskDiscipline: 75, learningQuality: 84, dominantPatterns: ["Recherche de différenciation", "Validation par confrontation"], biasSignals: ["Préférence pour les catégories ambitieuses"], sampleSize: 11, source: "cognitive_dna", createdAt: t("05", "18:10:00"), updatedAt: t("06", "15:30:00") }
];

export const initialMemories: MemoryRecord[] = [
  { id: "mem-1", caseId: "executiveos", kind: "goal", content: "Construire un ExecutiveOS réellement utilisable, démontrable et cohérent de bout en bout.", confidence: 98, durable: true, source: "manual", createdAt: t("05", "08:30:00") },
  { id: "mem-2", caseId: "executiveos", kind: "decision", content: "L’Executive Runtime Next.js devient la base produit unique ; les prototypes séparés ne sont plus la source de vérité.", confidence: 95, durable: true, source: "migration", createdAt: t("06", "09:35:00") },
  { id: "mem-3", caseId: "executiveos", kind: "risk", content: "Une fonctionnalité visible mais non branchée au runtime doit être considérée comme incomplète.", confidence: 94, durable: true, source: "manual", createdAt: t("07", "16:45:00") },
  { id: "mem-4", caseId: "positioning", kind: "hypothesis", content: "Decision Operating System est une catégorie plus immédiatement compréhensible qu’AI Executive Assistant.", confidence: 84, durable: true, source: "unified_runtime", createdAt: t("05", "16:12:00") },
  { id: "mem-5", caseId: "investor-demo", kind: "action", content: "La démonstration doit montrer une boucle complète en moins de cinq minutes.", confidence: 91, durable: true, source: "manual", createdAt: t("06", "10:10:00") },
  { id: "mem-6", caseId: "architecture", kind: "context", content: "Le store Zustand canonique alimente décisions, actions, mémoire, graphe et événements.", confidence: 96, durable: true, source: "migration", createdAt: t("06", "09:40:00") }
];

export const initialKnowledgeRecords: KnowledgeRecord[] = [
  { id: "kr-1", caseId: "executiveos", type: "insight", title: "La continuité cognitive est la promesse centrale", confidence: 92, source: "manual", createdAt: t("05", "13:10:00") },
  { id: "kr-2", caseId: "executiveos", type: "decision", title: "Unifier le produit autour de parcours utilisateur", confidence: 91, source: "unified_runtime", createdAt: t("05", "14:20:00") },
  { id: "kr-3", caseId: "executiveos", type: "risk", title: "Éviter les surfaces UI non connectées", confidence: 95, source: "manual", createdAt: t("07", "16:45:00") },
  { id: "kr-4", caseId: "positioning", type: "insight", title: "Decision Operating System simplifie le récit commercial", confidence: 84, source: "unified_runtime", createdAt: t("05", "16:10:00") },
  { id: "kr-5", caseId: "investor-demo", type: "action", title: "Construire un parcours de démonstration cinq minutes", confidence: 90, source: "manual", createdAt: t("06", "10:05:00") },
  { id: "kr-6", caseId: "architecture", type: "context_item", title: "Runtime Phase 2 intégré au store canonique", confidence: 96, source: "migration", createdAt: t("06", "09:30:00") }
];

export const initialKnowledgeEntities: KnowledgeEntity[] = [
  { id: "org-executiveos", organizationId: "org-executiveos", type: "organization", title: "ExecutiveOS", status: "active", createdAt: t("05"), updatedAt: t("07") },
  { id: "goal-ready", organizationId: "org-executiveos", caseId: "executiveos", type: "goal", title: "Produit démontrable et prêt", status: "active", createdAt: t("05"), updatedAt: t("07") },
  { id: "case-executiveos", organizationId: "org-executiveos", caseId: "executiveos", type: "decision_case", title: "Construire ExecutiveOS", status: "decide", createdAt: t("05"), updatedAt: t("07") },
  { id: "decision-unify", organizationId: "org-executiveos", caseId: "executiveos", type: "decision", title: "Unifier le produit", status: "accepted", createdAt: t("05"), updatedAt: t("06") },
  { id: "action-uat", organizationId: "org-executiveos", caseId: "executiveos", type: "action", title: "Valider le parcours complet", status: "doing", createdAt: t("07"), updatedAt: t("07") },
  { id: "risk-placeholders", organizationId: "org-executiveos", caseId: "executiveos", type: "risk", title: "Surfaces non opérationnelles", status: "mitigating", createdAt: t("07"), updatedAt: t("07") },
  { id: "memory-continuity", organizationId: "org-executiveos", caseId: "executiveos", type: "memory", title: "Continuité cognitive", status: "durable", createdAt: t("05"), updatedAt: t("07") },
  { id: "learning-navigation", organizationId: "org-executiveos", caseId: "executiveos", type: "learning", title: "Navigation par verbes", status: "validated", createdAt: t("05"), updatedAt: t("07") },
  { id: "case-positioning", organizationId: "org-executiveos", caseId: "positioning", type: "decision_case", title: "Valider le positionnement marché", status: "explore", createdAt: t("05"), updatedAt: t("07") },
  { id: "market-category", organizationId: "org-executiveos", caseId: "positioning", type: "market", title: "Decision Intelligence / Executive AI", status: "active", createdAt: t("05"), updatedAt: t("07") }
];

export const initialKnowledgeRelations: KnowledgeRelation[] = [
  { id: "rel-1", organizationId: "org-executiveos", caseId: "executiveos", sourceId: "goal-ready", sourceType: "goal", targetId: "case-executiveos", targetType: "decision_case", relationType: "ADVANCES", confidence: 96, provenance: "demo-seed", validFrom: t("05") },
  { id: "rel-2", organizationId: "org-executiveos", caseId: "executiveos", sourceId: "case-executiveos", sourceType: "decision_case", targetId: "decision-unify", targetType: "decision", relationType: "SELECTS", confidence: 94, provenance: "demo-seed", validFrom: t("05") },
  { id: "rel-3", organizationId: "org-executiveos", caseId: "executiveos", sourceId: "decision-unify", sourceType: "decision", targetId: "action-uat", targetType: "action", relationType: "CREATES", confidence: 93, provenance: "demo-seed", validFrom: t("07") },
  { id: "rel-4", organizationId: "org-executiveos", caseId: "executiveos", sourceId: "action-uat", sourceType: "action", targetId: "risk-placeholders", targetType: "risk", relationType: "MITIGATES", confidence: 91, provenance: "demo-seed", validFrom: t("07") },
  { id: "rel-5", organizationId: "org-executiveos", caseId: "executiveos", sourceId: "memory-continuity", sourceType: "memory", targetId: "decision-unify", targetType: "decision", relationType: "SUPPORTED_BY", confidence: 88, provenance: "demo-seed", validFrom: t("05") },
  { id: "rel-6", organizationId: "org-executiveos", caseId: "executiveos", sourceId: "learning-navigation", sourceType: "learning", targetId: "decision-unify", targetType: "decision", relationType: "VALIDATES", confidence: 90, provenance: "demo-seed", validFrom: t("05") },
  { id: "rel-7", organizationId: "org-executiveos", caseId: "positioning", sourceId: "case-positioning", sourceType: "decision_case", targetId: "market-category", targetType: "market", relationType: "CONCERNS", confidence: 86, provenance: "demo-seed", validFrom: t("05") }
];

export const initialAgentRuns: AgentRunRecord[] = [
  { id: "run-1", caseId: "executiveos", orchestratorId: "orion", selectedAgentIds: ["athena", "turing", "seneca"], contributions: [
    { agentId: "athena", agentName: "Perspective stratégique", focus: "Stratégie", content: "Concentrer la démo sur une boucle de décision complète plutôt que sur le catalogue de capacités.", confidence: 89 },
    { agentId: "turing", agentName: "Perspective de faisabilité", focus: "Architecture", content: "Utiliser le store canonique comme source de vérité afin que chaque onglet lise les mêmes données.", confidence: 94 },
    { agentId: "seneca", agentName: "Perspective de prudence", focus: "Risques", content: "Une vue vide ou non interactive est un risque de crédibilité produit pendant la démonstration.", confidence: 92 }
  ], synthesis: "Assistant de décision · La priorité est de démontrer une continuité réelle entre contexte, décision, action et apprentissage.", confidence: 92, createdAt: t("07", "16:40:00") }
];

export const initialReasoningRevisions: ReasoningRevision[] = [
  { id: "rr-1", caseId: "executiveos", stepId: "question", version: 1, content: "Comment transformer les modules existants en un produit cohérent ?", confidence: 75, createdAt: t("05", "09:00:00") },
  { id: "rr-2", caseId: "executiveos", stepId: "hypothesis", version: 1, content: "La décision doit être le centre de gravité de l’expérience.", confidence: 82, createdAt: t("05", "10:00:00") },
  { id: "rr-3", caseId: "executiveos", stepId: "evidence", version: 1, content: "Les parcours organisés par verbes réduisent la complexité perçue et relient naturellement les moteurs.", confidence: 88, createdAt: t("05", "14:00:00") },
  { id: "rr-4", caseId: "executiveos", stepId: "decision", version: 1, content: "Unifier ExecutiveOS autour d’Accueil, Comprendre, Décider, Agir et Explorer.", confidence: 91, createdAt: t("05", "14:20:00") },
  { id: "rr-5", caseId: "executiveos", stepId: "consequences", version: 1, content: "Chaque onglet doit lire le même état canonique et contribuer à la même mémoire.", confidence: 90, createdAt: t("06", "09:45:00") }
];
