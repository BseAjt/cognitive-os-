import type { ActionItem, AgentContract, Challenge, CognitiveEvent, Decision } from "@/types/domain";

const transitions: Record<ActionItem["status"], ActionItem["status"][]> = {
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

export function transitionAction(action: ActionItem, nextStatus: ActionItem["status"]): ActionItem {
  if (!transitions[action.status].includes(nextStatus)) {
    throw new Error(`Invalid transition ${action.status} -> ${nextStatus}`);
  }
  return {
    ...action,
    status: nextStatus,
    progress: nextStatus === "done" ? 100 : nextStatus === "doing" ? Math.max(action.progress, 25) : action.progress
  };
}

export function assignAction(action: ActionItem, agents: AgentContract[]): ActionItem {
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

export function executeAction(action: ActionItem, agents: AgentContract[]): ActionItem {
  const assigned = assignAction(action, agents);
  if (assigned.status === "blocked") return assigned;
  const running = assigned.status === "todo" ? transitionAction(assigned, "doing") : assigned;
  if (running.status !== "doing") return running;
  return {
    ...transitionAction(running, "done"),
    result: `Exécutée par ${running.owner}`
  };
}

export interface RuntimeGraphNode {
  id: string;
  type: "challenge" | "decision" | "action" | "agent" | "event";
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
  challenges: Challenge[];
  decisions: Decision[];
  actions: ActionItem[];
  agents: AgentContract[];
  events: CognitiveEvent[];
}) {
  const nodes: RuntimeGraphNode[] = [];
  const edges: RuntimeGraphEdge[] = [];

  for (const challenge of input.challenges) {
    nodes.push({ id: `challenge:${challenge.id}`, type: "challenge", label: challenge.title, status: challenge.state });
  }
  for (const decision of input.decisions) {
    nodes.push({ id: `decision:${decision.id}`, type: "decision", label: decision.finalDecision, status: "recorded" });
    edges.push({ id: `decision-challenge:${decision.id}`, source: `decision:${decision.id}`, target: `challenge:${decision.challengeId}`, type: "supports" });
  }
  for (const action of input.actions) {
    nodes.push({ id: `action:${action.id}`, type: "action", label: action.title, status: action.status });
    edges.push({ id: `action-challenge:${action.id}`, source: `challenge:${action.challengeId}`, target: `action:${action.id}`, type: "creates" });
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
