import type {
  AgentContract,
  AgentContributionRecord,
  CognitiveCase,
  KnowledgeRecord,
  MemoryRecord
} from "../domain/canonical.ts";
import type { CognitiveExtraction } from "./conversation-runtime.ts";

export const defaultExecutiveAgents: AgentContract[] = [
  { id: "orion", name: "ORION", role: "Orchestrateur exécutif", specialty: "Synthèse et orchestration", capabilities: ["analysis", "orchestration", "decision"], status: "online", version: "2.2.0" },
  { id: "athena", name: "ATHENA", role: "Chief Strategy Officer", specialty: "Stratégie", capabilities: ["analysis", "strategy", "decision"], status: "online", version: "2.2.0" },
  { id: "turing", name: "TURING", role: "CTO", specialty: "Technologie et architecture", capabilities: ["analysis", "technology", "execution"], status: "online", version: "2.2.0" },
  { id: "seneca", name: "SENECA", role: "Chief Reflection Officer", specialty: "Critique et risques", capabilities: ["analysis", "reflection", "risk"], status: "online", version: "2.2.0" }
];

export type OrchestrationIntent = "strategy" | "technology" | "risk" | "decision" | "execution" | "general";

export interface AgentOrchestrationInput {
  message: string;
  cognitiveCase: CognitiveCase;
  agents: AgentContract[];
  extractions: CognitiveExtraction[];
  memories?: MemoryRecord[];
  knowledgeRecords?: KnowledgeRecord[];
}

export interface AgentOrchestrationResult {
  orchestratorId: string;
  intent: OrchestrationIntent;
  selectedAgentIds: string[];
  contributions: AgentContributionRecord[];
  synthesis: string;
  selectionRationale: string;
  confidence: number;
}

export function runAgentOrchestration(input: AgentOrchestrationInput): AgentOrchestrationResult {
  const online = input.agents.filter((agent) => agent.status === "online");
  const orion = online.find((agent) => agent.id === "orion");
  const specialists = online.filter((agent) => agent.id !== "orion");
  const intent = inferOrchestrationIntent(input);
  const scored = specialists
    .map((agent) => ({ agent, score: scoreAgent(agent, input, intent) }))
    .sort((a, b) => b.score - a.score || a.agent.id.localeCompare(b.agent.id));

  let selected = scored.filter((item) => item.score > 0).slice(0, 3);
  if (selected.length === 0) {
    selected = scored.filter((item) => item.agent.id === "athena" || item.agent.id === "seneca").slice(0, 2);
  }

  const contributions = selected.map(({ agent, score }) => buildContribution(agent, score, input));
  const selectedAgentIds = selected.map((item) => item.agent.id);
  const synthesis = buildSynthesis(input, contributions, intent);
  const confidence = contributions.length
    ? Math.round(contributions.reduce((sum, item) => sum + item.confidence, 0) / contributions.length)
    : input.cognitiveCase.signals.confidence;

  return {
    orchestratorId: orion?.id ?? "orion",
    intent,
    selectedAgentIds,
    contributions,
    synthesis,
    selectionRationale: buildSelectionRationale(intent, contributions, input),
    confidence
  };
}

export function preferredAgentForCapability(
  capability: string,
  agents: AgentContract[],
  selectedAgentIds: string[]
): AgentContract | undefined {
  const selected = selectedAgentIds
    .map((id) => agents.find((agent) => agent.id === id))
    .filter((agent): agent is AgentContract => Boolean(agent));
  return selected.find((agent) => agent.status === "online" && agent.capabilities.includes(capability))
    ?? agents.find((agent) => agent.status === "online" && agent.capabilities.includes(capability));
}

function inferOrchestrationIntent(input: AgentOrchestrationInput): OrchestrationIntent {
  const text = `${input.message} ${input.cognitiveCase.objective} ${input.cognitiveCase.context}`.toLowerCase();
  const kinds = new Set(input.extractions.map((item) => item.kind));
  if (kinds.has("decision") || /décid|choisir|arbitr|option|scénario|scenario/.test(text)) return "decision";
  if (kinds.has("risk") || /risque|contradiction|biais|incert|fragile|échec|failure/.test(text)) return "risk";
  if (/tech|architecture|api|logiciel|software|runtime|code|donnée|data|intégration|système/.test(text)) return "technology";
  if (kinds.has("action") || /plan|exécut|action|livrable|mise en œuvre|implementation/.test(text)) return "execution";
  if (/strat|marché|market|position|prix|pricing|parten|croissance|go-to-market|gtm/.test(text)) return "strategy";
  return "general";
}

function scoreAgent(agent: AgentContract, input: AgentOrchestrationInput, intent: OrchestrationIntent): number {
  const text = `${input.message} ${input.cognitiveCase.objective} ${input.cognitiveCase.context}`.toLowerCase();
  const extractionKinds = new Set(input.extractions.map((item) => item.kind));
  const knowledgeTypes = new Set((input.knowledgeRecords ?? []).filter((item) => item.caseId === input.cognitiveCase.id).map((item) => item.type));
  const memoryKinds = new Set((input.memories ?? []).filter((item) => item.caseId === input.cognitiveCase.id).map((item) => item.kind));
  let score = agent.capabilities.includes("analysis") ? 1 : 0;

  if (agent.id === "athena") {
    if (intent === "strategy" || intent === "decision") score += 5;
    if (/strat|marché|market|position|prix|pricing|parten|croissance|go-to-market|gtm/.test(text)) score += 4;
    if (extractionKinds.has("goal") || extractionKinds.has("hypothesis") || memoryKinds.has("hypothesis")) score += 3;
    if (input.cognitiveCase.state === "decide") score += 2;
  }

  if (agent.id === "turing") {
    if (intent === "technology" || intent === "execution") score += 5;
    if (/tech|architecture|api|logiciel|software|runtime|code|donnée|data|intégration|système/.test(text)) score += 5;
    if (input.extractions.some((item) => item.kind === "action" && /tech|architecture|api|code|système|runtime/.test(item.text.toLowerCase()))) score += 3;
  }

  if (agent.id === "seneca") {
    if (intent === "risk" || intent === "decision") score += 5;
    if (extractionKinds.has("risk") || knowledgeTypes.has("risk") || memoryKinds.has("risk")) score += 5;
    if (input.cognitiveCase.signals.risk >= 7) score += 4;
    if (/risque|contradiction|biais|incert|fragile|échec|failure|bloqu/.test(text)) score += 4;
  }

  return score;
}

function buildContribution(agent: AgentContract, score: number, input: AgentOrchestrationInput): AgentContributionRecord {
  const decision = input.extractions.find((item) => item.kind === "decision")?.text;
  const risk = input.extractions.find((item) => item.kind === "risk")?.text;
  const action = input.extractions.find((item) => item.kind === "action")?.text;
  const confidence = Math.min(94, Math.max(58, input.cognitiveCase.signals.confidence + score * 2));

  if (agent.id === "athena") {
    return {
      agentId: agent.id,
      agentName: agent.name,
      focus: "Cohérence stratégique",
      content: decision
        ? `Vérifier que « ${decision} » maximise l’objectif « ${input.cognitiveCase.objective} » et reste cohérent avec le positionnement.`
        : `Prioriser les options qui renforcent directement l’objectif « ${input.cognitiveCase.objective} » avant d’élargir le périmètre.`,
      confidence
    };
  }

  if (agent.id === "turing") {
    return {
      agentId: agent.id,
      agentName: agent.name,
      focus: "Faisabilité technologique",
      content: action
        ? `Valider dépendances, interfaces et critères de sortie avant d’exécuter « ${action} ».`
        : "Vérifier que l’architecture et les dépendances techniques soutiennent la décision sans créer un nouveau couplage structurel.",
      confidence
    };
  }

  return {
    agentId: agent.id,
    agentName: agent.name,
    focus: "Risques et contre-arguments",
    content: risk
      ? `Tester explicitement le risque « ${risk} » et définir le signal qui invaliderait l’hypothèse actuelle.`
      : "Chercher l’hypothèse la plus fragile du dossier et définir un signal observable capable de l’invalider.",
    confidence
  };
}

function buildSynthesis(input: AgentOrchestrationInput, contributions: AgentContributionRecord[], intent: OrchestrationIntent): string {
  if (contributions.length === 0) return "ORION recommande de conserver une analyse prudente faute de perspective spécialisée disponible.";
  const riskContribution = contributions.find((item) => item.agentId === "seneca");
  const techContribution = contributions.find((item) => item.agentId === "turing");
  const strategyContribution = contributions.find((item) => item.agentId === "athena");
  const parts = [
    strategyContribution ? "alignement stratégique à confirmer" : null,
    techContribution ? "faisabilité technique à verrouiller" : null,
    riskContribution ? "hypothèse critique à falsifier" : null
  ].filter(Boolean);
  const priority = input.cognitiveCase.signals.risk >= 7
    ? "réduire le risque avant engagement irréversible"
    : intent === "execution"
      ? "transformer l’analyse en prochain livrable observable"
      : intent === "decision"
        ? "formaliser l’arbitrage et son critère de révision"
        : "avancer avec un point de contrôle explicite";
  return `ORION recommande : ${parts.join(" ; ")}. Priorité : ${priority}.`;
}

function buildSelectionRationale(intent: OrchestrationIntent, contributions: AgentContributionRecord[], input: AgentOrchestrationInput): string {
  const focuses = contributions.map((item) => item.focus.toLowerCase());
  return `Intention ${intent} · ${contributions.length} perspective(s) interne(s) mobilisée(s) · risque dossier ${input.cognitiveCase.signals.risk}/10 · angles ${focuses.join(", ") || "général"}.`;
}
