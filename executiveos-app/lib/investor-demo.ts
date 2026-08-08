import type {
  ActionRecord,
  CaseContextSynthesis,
  CognitiveCase,
  ContextEvidenceRecord,
  ContextSourceRecord,
  DecisionActionPlanRecord,
  DecisionRecord,
  DecisionWatchRecord,
  ExecutiveCycleRecord,
  IdeaRecord,
  LearningEventRecord,
  ProjectRecord,
  ReflectionRecord
} from "../domain/canonical.ts";

export const INVESTOR_DEMO_VERSION = "2026.08.2";

export interface InvestorDemoDataset {
  cases: CognitiveCase[];
  projects: ProjectRecord[];
  ideas: IdeaRecord[];
  activeCaseId: string;
  decisions: DecisionRecord[];
  actions: ActionRecord[];
  contextSources: ContextSourceRecord[];
  contextEvidence: ContextEvidenceRecord[];
  contextSyntheses: CaseContextSynthesis[];
  executiveCycles: ExecutiveCycleRecord[];
  decisionActionPlans: DecisionActionPlanRecord[];
  decisionWatches: DecisionWatchRecord[];
  learningEvents: LearningEventRecord[];
  reflections: ReflectionRecord[];
}

export interface ProductEvidenceMetrics {
  activeCases: number;
  sourcesConsolidated: number;
  evidenceStructured: number;
  decisionsSourced: number;
  actionsPiloted: number;
  divergencesDetected: number;
  decisionsReopened: number;
  traceabilityRate: number;
  estimatedHoursSaved: number;
  executionRate: number;
  projectsInFlight: number;
  ideasInPipeline: number;
  portfolioValue: number;
  promotedIdeas: number;
}

const CASES = [
  ["demo-launch", "Lancer Nova AI en Europe", "Arbitrer un lancement B2B sur trois marchés en conciliant traction, budget et risque réglementaire.", "Un pilote France–Benelux peut valider le product-market fit avant une expansion européenne.", "execute", 10, 9, 82, 7],
  ["demo-pricing", "Reconcevoir le pricing Enterprise", "Augmenter la valeur captée sans ralentir l'adoption des comptes stratégiques.", "Un pricing hybride plateforme + usage améliore la marge et la lisibilité.", "decide", 9, 8, 78, 6],
  ["demo-partner", "Choisir un partenaire de distribution", "Sélectionner le partenaire qui accélère l'accès au marché tout en protégeant la donnée client.", "Un partenariat limité à deux verticales réduit le risque de dépendance.", "execute", 8, 7, 76, 7],
  ["demo-platform", "Industrialiser la plateforme IA", "Décider du prochain investissement d'architecture avant le passage à l'échelle.", "Une couche d'observabilité et d'évaluation unifiée réduit le coût des incidents.", "learn", 8, 6, 88, 4],
  ["demo-hiring", "Structurer l'équipe de croissance", "Prioriser les recrutements qui débloquent le revenu des deux prochains trimestres.", "Un binôme Enterprise AE + Solutions Engineer précède le recrutement marketing.", "explore", 7, 7, 69, 5]
] as const;

const SOURCE_TOPICS = [
  ["Étude de marché", "Le segment cible progresse de 28 %. Les acheteurs privilégient une preuve de ROI en moins de 90 jours."],
  ["Entretien client", "Trois clients confirment un budget annuel compris entre 90 000 et 140 000 euros si le pilote atteint le KPI d'adoption."],
  ["Note finance", "Le budget disponible est de 480 000 euros. Le seuil de marge brute attendu est de 72 %."],
  ["Revue juridique", "Le déploiement nécessite une analyse d'impact et une conservation des preuves de décision."],
  ["Compte rendu produit", "Le produit couvre 86 % des besoins prioritaires. Deux intégrations restent critiques avant généralisation."],
  ["Signal concurrentiel", "Un concurrent annonce une baisse tarifaire de 18 %, ce qui fragilise l'hypothèse de prix initiale."],
  ["Comité de direction", "Le comité soutient une mise sur le marché progressive avec un checkpoint après six semaines."],
  ["Retour pilote", "L'adoption atteint 74 %, mais le délai d'intégration dépasse la cible de douze jours."]
] as const;

const at = (day: number, hour = 9) => `2026-07-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00.000Z`;

const PROJECTS = [
  ["project-nova", "Nova AI Europe", "Déployer l'offre IA sur les marchés européens prioritaires.", "Croissance", "CEO", "MAYA", "active", "now", 94, 92, 82, 7, 48, ["demo-launch", "demo-pricing", "demo-partner"], []],
  ["project-platform", "Trustworthy AI Platform", "Industrialiser une plateforme IA explicable, observable et souveraine.", "Produit", "CTO", "TURING", "active", "now", 88, 95, 86, 5, 64, ["demo-platform"], []],
  ["project-growth", "Revenue Engine 2027", "Construire le dispositif commercial reproductible pour l'Enterprise.", "Go-to-market", "CRO", "ATHENA", "validated", "next", 86, 89, 74, 6, 27, ["demo-hiring"], ["project-nova"]],
  ["project-copilot", "Executive Copilot", "Transformer les décisions de direction en exécution observable.", "Innovation", "CEO", "ORION", "validated", "next", 91, 98, 71, 7, 18, [], ["project-platform"]],
  ["project-marketplace", "Agent Marketplace", "Ouvrir un catalogue d'agents spécialisés et gouvernés.", "Écosystème", "CPO", "ADA", "discovery", "later", 79, 84, 58, 8, 8, [], ["project-platform", "project-copilot"]],
  ["project-academy", "Executive AI Academy", "Accélérer l'adoption par une académie de décision augmentée.", "Adoption", "COO", "SENECA", "discovery", "next", 68, 76, 63, 4, 12, [], ["project-copilot"]],
  ["project-regulated", "Sovereign Vertical", "Adapter la plateforme aux secteurs défense et services publics.", "Verticalisation", "CEO", "ATHENA", "on_hold", "later", 90, 87, 54, 9, 6, [], ["project-platform"]],
  ["project-intelligence", "Market Intelligence Network", "Détecter en continu les signaux qui fragilisent la stratégie.", "Intelligence", "CSO", "ORION", "active", "now", 84, 93, 79, 5, 39, [], ["project-nova"]]
] as const;

const IDEAS = [
  ["idea-board", "Board Room Mode", "Les comités perdent du temps à reconstruire le contexte.", "Un brief interactif avec décisions, objections et preuves projetées en séance.", "Gouvernance", "MAYA", "promoted", "now", 84, 92, 86, 78, "project-copilot", "demo-launch", ["board", "brief"]],
  ["idea-simulator", "Decision Simulator", "Les conséquences des options restent implicites.", "Simuler scénarios, hypothèses et seuils avant arbitrage.", "Produit", "TURING", "evaluating", "next", 91, 90, 68, 66, "project-copilot", undefined, ["simulation", "scenario"]],
  ["idea-mobile", "ExecutiveOS Pocket", "Les signaux décisifs arrivent hors du bureau.", "Capturer une idée vocale et recevoir le point de reprise sur mobile.", "Expérience", "ADA", "evaluating", "next", 72, 78, 82, 71, "project-copilot", undefined, ["mobile", "voice"]],
  ["idea-benchmark", "Decision Benchmark", "Les dirigeants ne savent pas calibrer leur processus de décision.", "Comparer anonymement vitesse, traçabilité et révisions par secteur.", "Data", "SENECA", "captured", "later", 88, 83, 52, 48, undefined, undefined, ["benchmark", "privacy"]],
  ["idea-agents", "Specialist Agent Store", "Chaque secteur nécessite des expertises spécifiques.", "Distribuer des agents certifiés avec constitution et périmètre auditable.", "Écosystème", "ADA", "promoted", "later", 93, 88, 61, 59, "project-marketplace", undefined, ["agents", "marketplace"]],
  ["idea-digital-twin", "Cognitive Twin Calibration", "Le système doit apprendre sans figer les biais de l'utilisateur.", "Mesurer préférences, calibration et évolution du raisonnement avec consentement.", "Cognitive AI", "ORION", "evaluating", "later", 96, 94, 49, 55, "project-platform", undefined, ["twin", "ethics"]],
  ["idea-red-team", "Autonomous Red Team", "Les décisions consensuelles masquent des risques.", "Déclencher automatiquement une contradiction argumentée avant les gates critiques.", "Risque", "SENECA", "promoted", "now", 85, 87, 89, 83, "project-intelligence", "demo-partner", ["risk", "challenge"]],
  ["idea-meeting", "Meeting-to-Decision", "Les réunions produisent des comptes rendus sans engagement clair.", "Extraire décisions, propriétaires, échéances et zones de désaccord.", "Productivité", "MAYA", "evaluating", "now", 76, 86, 91, 80, "project-copilot", undefined, ["meeting", "action"]],
  ["idea-sovereign", "Sovereign Deployment Kit", "Les secteurs régulés ne peuvent pas adopter une architecture standard.", "Packager déploiement souverain, audit, isolation et politiques sectorielles.", "Verticalisation", "TURING", "captured", "later", 74, 93, 57, 51, "project-regulated", undefined, ["sovereignty", "enterprise"]],
  ["idea-academy", "Decision Practice Lab", "L'adoption nécessite de nouvelles habitudes managériales.", "Faire pratiquer des cas de décision avec feedback de calibration.", "Adoption", "SENECA", "promoted", "next", 69, 72, 88, 77, "project-academy", undefined, ["learning", "adoption"]],
  ["idea-radar", "Weak Signal Radar", "Les décisions sont réévaluées trop tard.", "Surveiller sources internes et externes selon les hypothèses actives.", "Intelligence", "ATHENA", "promoted", "now", 82, 91, 84, 81, "project-intelligence", "demo-pricing", ["signals", "watch"]],
  ["idea-outcomes", "Outcome Ledger", "La valeur réelle des décisions est rarement mesurée.", "Relier chaque décision à ses résultats, coûts et apprentissages dans le temps.", "Finance", "ORION", "captured", "next", 79, 89, 73, 64, undefined, undefined, ["outcomes", "roi"]]
] as const;

export function createInvestorDemoDataset(): InvestorDemoDataset {
  const cases: CognitiveCase[] = CASES.map(([id, title, objective, workingHypothesis, state, impact, urgency, confidence, risk]) => ({
    id, title, objective, workingHypothesis, context: "Données fictives et réalistes préparées pour la démonstration investisseur.", state, signals: { impact, urgency, confidence, cognitiveCost: 6, risk }
  }));
  const projects: ProjectRecord[] = PROJECTS.map(([id,title,summary,theme,sponsor,owner,status,horizon,expectedValue,strategicFit,confidence,risk,progress,caseIds,dependencyIds]) => ({ id,title,summary,theme,sponsor,owner,status,horizon,expectedValue,strategicFit,confidence,risk,progress,caseIds:[...caseIds],dependencyIds:[...dependencyIds],createdAt:at(1),updatedAt:at(28) }));
  const ideas: IdeaRecord[] = IDEAS.map(([id,title,problem,proposition,theme,author,status,horizon,novelty,expectedValue,feasibility,confidence,linkedProjectId,promotedCaseId,tags]) => ({ id,title,problem,proposition,theme,author,status,horizon,novelty,expectedValue,feasibility,confidence,linkedProjectId,promotedCaseId,tags:[...tags],createdAt:at(2),updatedAt:at(28) }));

  const contextSources: ContextSourceRecord[] = [];
  const contextEvidence: ContextEvidenceRecord[] = [];
  for (const [caseIndex, cognitiveCase] of cases.entries()) {
    SOURCE_TOPICS.forEach(([title, content], sourceIndex) => {
      const sourceId = `demo-source-${caseIndex + 1}-${sourceIndex + 1}`;
      const createdAt = at(3 + sourceIndex + caseIndex, 8 + (sourceIndex % 4));
      contextSources.push({ id: sourceId, caseId: cognitiveCase.id, type: sourceIndex % 3 === 0 ? "document" : sourceIndex % 3 === 1 ? "meeting" : "message", title: `${title} · ${cognitiveCase.title}`, origin: `demo://${cognitiveCase.id}/${sourceIndex + 1}`, status: "ready", rawContent: content, summary: content, wordCount: content.split(/\s+/).length, createdAt, processedAt: createdAt });
      const claims = content.split(/(?<=[.!?])\s+/).filter(Boolean);
      for (let evidenceIndex = 0; evidenceIndex < 3; evidenceIndex += 1) {
        const claim = claims[evidenceIndex % claims.length] ?? content;
        contextEvidence.push({ id: `demo-evidence-${caseIndex + 1}-${sourceIndex + 1}-${evidenceIndex + 1}`, caseId: cognitiveCase.id, sourceId, claim, excerpt: claim, confidence: 82 + ((caseIndex + sourceIndex + evidenceIndex) % 15), position: evidenceIndex, createdAt });
      }
    });
  }

  const decisions: DecisionRecord[] = cases.flatMap((cognitiveCase, index) => {
    const base: DecisionRecord = { id: `demo-decision-${index + 1}-1`, caseId: cognitiveCase.id, recommendation: index === 0 ? "Lancer un pilote France–Benelux avec gate de réévaluation à six semaines." : `Valider l'option progressive pour ${cognitiveCase.title.toLowerCase()}.`, outcome: index === 0 ? "Pilote France–Benelux approuvé" : "Scénario progressif retenu", rationale: "Les preuves marché, finance, produit et risque convergent vers une option réversible.", confidence: 78 + index * 2, createdAt: at(15 + index) };
    return index < 4 ? [base, { ...base, id: `demo-decision-${index + 1}-2`, outcome: "Gate de contrôle approuvé", recommendation: "Maintenir un checkpoint explicite avant généralisation.", confidence: 84, createdAt: at(20 + index) }] : [base];
  });

  const actions: ActionRecord[] = cases.flatMap((cognitiveCase, caseIndex) => Array.from({ length: 6 }, (_, actionIndex) => ({
    id: `demo-action-${caseIndex + 1}-${actionIndex + 1}`, caseId: cognitiveCase.id,
    title: ["Valider les critères de succès", "Sécuriser le budget", "Finaliser le dispositif de risque", "Exécuter le pilote", "Mesurer les KPI", "Préparer le checkpoint"][actionIndex]!,
    owner: ["ATHENA", "CFO", "SENECA", "TURING", "ORION", "CEO"][actionIndex]!, progress: actionIndex < 2 ? 100 : actionIndex === 2 ? 75 : actionIndex === 3 ? 45 : 15,
    status: actionIndex < 2 ? "done" : caseIndex === 0 && actionIndex === 3 ? "blocked" : actionIndex < 4 ? "doing" : "todo",
    blockedReason: caseIndex === 0 && actionIndex === 3 ? "Le signal concurrentiel impose une révision du pricing." : undefined,
    dueAt: at(24 + actionIndex + caseIndex)
  })));

  const executiveCycles: ExecutiveCycleRecord[] = cases.map((cognitiveCase, index) => ({
    id: `demo-cycle-${index + 1}`, caseId: cognitiveCase.id, objective: cognitiveCase.objective, status: "completed", selectedAgentIds: ["athena", "turing", "seneca"],
    contributions: [
      { agentId: "athena", agentName: "ATHENA", mandate: "Stratégie", position: "support", analysis: "La trajectoire progressive maximise l'apprentissage tout en préservant les options.", confidence: 87, evidenceIds: [`demo-evidence-${index + 1}-1-1`], citations: ["S1"] },
      { agentId: "turing", agentName: "TURING", mandate: "Exécution", position: "conditional", analysis: "Le passage à l'échelle dépend des deux intégrations critiques et d'un KPI de délai.", confidence: 84, evidenceIds: [`demo-evidence-${index + 1}-5-1`], citations: ["S5"] },
      { agentId: "seneca", agentName: "SENECA", mandate: "Risques", position: "challenge", analysis: "Le signal concurrentiel et la contrainte réglementaire imposent un gate de réévaluation.", confidence: 91, evidenceIds: [`demo-evidence-${index + 1}-6-1`], citations: ["S6"] }
    ],
    divergences: index < 4 ? [{ topic: "Vitesse contre maîtrise du risque", agentIds: ["athena", "seneca"], description: "ATHENA privilégie la vitesse ; SENECA demande un gate de contrôle.", resolution: "Pilote limité et checkpoint à six semaines." }] : [],
    synthesis: "ORION recommande une décision progressive, sourcée et réversible.", recommendation: "Activer le scénario progressif avec indicateurs et checkpoint.", confidence: 86, missingEvidence: [], sourceIds: contextSources.filter((source) => source.caseId === cognitiveCase.id).map((source) => source.id), createdAt: at(14 + index)
  }));

  const decisionActionPlans: DecisionActionPlanRecord[] = cases.map((cognitiveCase, index) => ({ id: `demo-plan-${index + 1}`, caseId: cognitiveCase.id, executiveCycleId: `demo-cycle-${index + 1}`, decisionId: `demo-decision-${index + 1}-1`, recommendation: executiveCycles[index]!.recommendation!, status: "active", actionIds: actions.filter((action) => action.caseId === cognitiveCase.id).map((action) => action.id), dependencies: [], metrics: [{ id: `demo-metric-${index + 1}`, label: "Progression du plan", target: "100 %", current: `${Math.round(actions.filter((action) => action.caseId === cognitiveCase.id).reduce((sum, action) => sum + action.progress, 0) / 6)} %`, owner: "ORION" }], checkpointAt: at(28 + index), createdAt: at(16 + index) }));

  const decisionWatches: DecisionWatchRecord[] = decisionActionPlans.map((plan, index) => ({ id: `demo-watch-${index + 1}`, caseId: plan.caseId, planId: plan.id, decisionId: plan.decisionId, status: index < 3 ? "reopen" : index === 3 ? "watch" : "stable", signals: index < 3 ? [{ id: `demo-signal-${index + 1}`, type: "contradiction", severity: "critical", title: "Hypothèse fragilisée", detail: "Un signal postérieur à la décision contredit l'hypothèse initiale.", sourceId: `demo-source-${index + 1}-6`, evidenceId: `demo-evidence-${index + 1}-6-1`, citation: "S6" }] : [], summary: index < 3 ? "La décision doit être rouverte." : "La décision reste sous contrôle.", recommendedAction: index < 3 ? "Relancer un cycle ORION ciblé." : "Poursuivre le suivi.", evaluatedAt: at(26 + index) }));

  const contextSyntheses: CaseContextSynthesis[] = cases.map((cognitiveCase, index) => ({ caseId: cognitiveCase.id, summary: "Le marché, les clients, la finance et le produit soutiennent une trajectoire progressive [S1] [S2] [S3] [S5]. Le signal concurrentiel impose une réévaluation [S6].", keyFacts: ["Croissance du segment : 28 %", "Budget disponible : 480 k€", "Adoption pilote : 74 %"], openQuestions: ["Quel niveau de prix résiste au nouveau signal concurrentiel ?"], sourceIds: contextSources.filter((source) => source.caseId === cognitiveCase.id).map((source) => source.id), generatedAt: at(27 + index) }));

  const learningEvents: LearningEventRecord[] = cases.map((cognitiveCase, index) => ({ id: `demo-learning-${index + 1}`, caseId: cognitiveCase.id, type: "KnowledgeLearned", title: "La réversibilité accélère la décision", detail: "Un gate explicite permet d'avancer sans masquer l'incertitude.", significance: "high", confidence: 88, source: "cognitive_diff", createdAt: at(27 + index) }));
  const reflections: ReflectionRecord[] = cases.map((cognitiveCase, index) => ({ id: `demo-reflection-${index + 1}`, caseId: cognitiveCase.id, summary: "La décision a évolué après confrontation des signaux marché, produit et risque.", whatChanged: ["Le scénario est devenu progressif"], whyItChanged: ["Nouvelle preuve contradictoire"], learned: ["Conserver un checkpoint explicite"], uncertainties: ["Réaction concurrentielle"], decisionsToReconsider: index < 3 ? ["Prix et périmètre du lancement"] : [], confidence: 86, significance: "high", source: "reflection_engine", createdAt: at(28 + index) }));

  return { cases, projects, ideas, activeCaseId: cases[0]!.id, decisions, actions, contextSources, contextEvidence, contextSyntheses, executiveCycles, decisionActionPlans, decisionWatches, learningEvents, reflections };
}

export function calculateProductEvidence(dataset: Pick<InvestorDemoDataset, "cases" | "projects" | "ideas" | "contextSources" | "contextEvidence" | "decisions" | "actions" | "executiveCycles" | "decisionWatches">): ProductEvidenceMetrics {
  const sourceIds = new Set(dataset.contextSources.map((source) => source.id));
  const traceableEvidence = dataset.contextEvidence.filter((evidence) => sourceIds.has(evidence.sourceId)).length;
  const completedActions = dataset.actions.filter((action) => action.status === "done").length;
  return {
    activeCases: dataset.cases.length,
    sourcesConsolidated: dataset.contextSources.length,
    evidenceStructured: dataset.contextEvidence.length,
    decisionsSourced: dataset.decisions.length,
    actionsPiloted: dataset.actions.length,
    divergencesDetected: dataset.executiveCycles.reduce((sum, cycle) => sum + cycle.divergences.length, 0),
    decisionsReopened: dataset.decisionWatches.filter((watch) => watch.status === "reopen").length,
    traceabilityRate: dataset.contextEvidence.length ? Math.round((traceableEvidence / dataset.contextEvidence.length) * 100) : 0,
    estimatedHoursSaved: Math.round(dataset.contextSources.length * 0.75 + dataset.decisions.length * 2 + dataset.decisionWatches.filter((watch) => watch.status === "reopen").length * 3),
    executionRate: dataset.actions.length ? Math.round((completedActions / dataset.actions.length) * 100) : 0,
    projectsInFlight: dataset.projects.filter((project) => project.status === "active" || project.status === "validated").length,
    ideasInPipeline: dataset.ideas.filter((idea) => idea.status !== "rejected").length,
    portfolioValue: dataset.projects.length ? Math.round(dataset.projects.reduce((sum, project) => sum + project.expectedValue, 0) / dataset.projects.length) : 0,
    promotedIdeas: dataset.ideas.filter((idea) => idea.status === "promoted").length
  };
}

export const INVESTOR_DEMO_STEPS = [
  { id: "signal", label: "1. Signaux", detail: "40 sources deviennent 120 preuves traçables." },
  { id: "reasoning", label: "2. Raisonnement", detail: "ATHENA, TURING et SENECA confrontent leurs positions." },
  { id: "decision", label: "3. Décision", detail: "ORION produit une recommandation sourcée et réversible." },
  { id: "execution", label: "4. Exécution", detail: "La décision devient un plan de 6 actions pilotées." },
  { id: "watch", label: "5. Réévaluation", detail: "Un nouveau signal rouvre automatiquement la décision." }
] as const;
