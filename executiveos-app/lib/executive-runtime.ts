import type {
  ActionRecord,
  AgentContract,
  CognitiveCase,
  CognitiveEventRecord,
  DecisionRecord
} from "../domain/canonical.ts";

const transitions: Record<ActionRecord["status"], ActionRecord["status"][]> = {
  todo: ["doing", "blocked", "done"],
  doing: ["done", "blocked", "todo"],
  blocked: ["todo", "doing"],
  done: []
};

export function validateAgentContract(agent: AgentContract): string[] {
  const errors: string[] = [];
  if (!agent.id) errors.push("Missing id");
  if (!agent.name) errors.push("Missing name");
  if (!agent.role) errors.push("Missing role");
  if (!agent.specialty) errors.push("Missing specialty");
  if (!Array.isArray(agent.capabilities) || agent.capabilities.length === 0) errors.push("Missing capabilities");
  if (!["online", "busy", "offline"].includes(agent.status)) errors.push("Invalid status");
  return errors;
}

export function canHandle(agent: AgentContract, capability: string): boolean {
  return agent.status === "online" && agent.capabilities.includes(capability);
}

export function transitionAction(action: ActionRecord, nextStatus: ActionRecord["status"]): ActionRecord {
  if (!transitions[action.status].includes(nextStatus)) {
    throw new Error(`Invalid transition ${action.status} -> ${nextStatus}`);
  }
  return {
    ...action,
    status: nextStatus,
    progress: nextStatus === "done" ? 100 : nextStatus === "doing" ? Math.max(action.progress, 25) : action.progress
  };
}

export function assignAction(action: ActionRecord, agents: AgentContract[]): ActionRecord {
  if (action.assignedAgentId) return action;
  const capability = action.requiredCapability ?? "analysis";
  const agent = agents.find((item) => canHandle(item, capability));
  if (!agent) {
    return {
      ...action,
      status: "blocked",
      blockedReason: `Aucun agent en ligne pour ${capability}`
    };
  }
  return {
    ...action,
    assignedAgentId: agent.id,
    owner: agent.name,
    blockedReason: undefined
  };
}

export function buildActionOutcome(action: ActionRecord): string {
  const capability = action.requiredCapability ?? "analysis";
  const title = action.title;
  const outputs: Record<string, string> = {
    strategy: `Synthèse stratégique produite pour « ${title} » : objectif clarifié, hypothèses prioritaires identifiées et prochain test recommandé.`,
    technology: `Audit technique produit pour « ${title} » : dépendances vérifiées, principaux risques d’architecture identifiés et critères de sortie définis.`,
    risk: `Revue de risque produite pour « ${title} » : risque principal explicité, signal d’alerte défini et mesure de mitigation proposée.`,
    orchestration: `Plan d’exécution produit pour « ${title} » : séquence des étapes, responsabilité et point de contrôle définis.`,
    decision: `Note d’arbitrage produite pour « ${title} » : options structurées, compromis explicités et recommandation prête à être revue.`,
    execution: `Livrable d’exécution produit pour « ${title} » avec résultat vérifiable et prochaine étape proposée.`,
    analysis: `Analyse produite pour « ${title} » : constats clés consolidés, zones d’incertitude identifiées et recommandation de suivi formulée.`
  };
  return `${outputs[capability] ?? outputs.analysis} Réalisé par ${action.owner}.`;
}

export function executeAction(action: ActionRecord, agents: AgentContract[]): ActionRecord {
  const assigned = assignAction(action, agents);
  if (assigned.status === "blocked") return assigned;
  const running = assigned.status === "todo" ? transitionAction(assigned, "doing") : assigned;
  if (running.status !== "doing") return running;
  return {
    ...transitionAction(running, "done"),
    result: buildActionOutcome(running)
  };
}

export interface RuntimeGraphNode {
  id: string;
  type: "case" | "decision" | "action" | "agent" | "event";
  label: string;
  status?: string;
}

export interface RuntimeGraphEdge {
  id: string;
  source: string;
  target: string;
  type: "contains" | "creates" | "owns" | "supports";
}

export function buildRuntimeGraph(input: {
  cases: CognitiveCase[];
  decisions: DecisionRecord[];
  actions: ActionRecord[];
  agents: AgentContract[];
  events: CognitiveEventRecord[];
}) {
  const nodes: RuntimeGraphNode[] = [];
  const edges: RuntimeGraphEdge[] = [];

  for (const cognitiveCase of input.cases) {
    nodes.push({ id: `case:${cognitiveCase.id}`, type: "case", label: cognitiveCase.title, status: cognitiveCase.state });
  }
  for (const decision of input.decisions) {
    nodes.push({ id: `decision:${decision.id}`, type: "decision", label: decision.outcome, status: "recorded" });
    edges.push({ id: `decision-case:${decision.id}`, source: `decision:${decision.id}`, target: `case:${decision.caseId}`, type: "supports" });
  }
  for (const action of input.actions) {
    nodes.push({ id: `action:${action.id}`, type: "action", label: action.title, status: action.status });
    edges.push({ id: `action-case:${action.id}`, source: `case:${action.caseId}`, target: `action:${action.id}`, type: "creates" });
    if (action.assignedAgentId) {
      edges.push({ id: `agent-action:${action.id}`, source: `agent:${action.assignedAgentId}`, target: `action:${action.id}`, type: "owns" });
    }
  }
  for (const agent of input.agents) {
    nodes.push({ id: `agent:${agent.id}`, type: "agent", label: agent.name, status: agent.status });
  }
  for (const event of input.events.slice(0, 12)) {
    nodes.push({ id: `event:${event.id}`, type: "event", label: event.detail, status: event.type });
  }

  return { nodes, edges, stats: { nodes: nodes.length, edges: edges.length } };
}
