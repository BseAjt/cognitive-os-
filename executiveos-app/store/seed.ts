import type { ActionRecord, AgentContract, CognitiveCase } from "../domain/canonical.ts";
import type { ConversationMessage } from "./types.ts";

export const initialCases: CognitiveCase[] = [
  {
    id: "executiveos",
    title: "Construire ExecutiveOS",
    objective: "Démontrer une nouvelle catégorie logicielle centrée sur la décision.",
    workingHypothesis: "Les dirigeants paieront pour réduire le coût cognitif de leurs décisions.",
    context: "Le Conversation Runtime devient le cœur du produit.",
    state: "decide",
    signals: { impact: 10, urgency: 8, confidence: 72, cognitiveCost: 7, risk: 7 }
  },
  {
    id: "positioning",
    title: "Valider le positionnement",
    objective: "Créer un message immédiatement compris par les dirigeants.",
    workingHypothesis: "Decision Operating System est une catégorie claire et mémorisable.",
    context: "ExecutiveOS est retenu comme nom produit.",
    state: "explore",
    signals: { impact: 7, urgency: 5, confidence: 84, cognitiveCost: 3, risk: 3 }
  }
];

export const initialMessages: ConversationMessage[] = [
  {
    id: "welcome",
    caseId: "executiveos",
    role: "assistant",
    text: "Bonjour Sébastien. Tu reprends ExecutiveOS. Le principal sujet est maintenant la validation du Conversation Runtime. Que souhaites-tu approfondir ?",
    createdAt: new Date().toISOString()
  }
];

export const initialAgents: AgentContract[] = [
  { id: "orion", name: "ORION", role: "Orchestrateur exécutif", specialty: "Synthèse et orchestration", capabilities: ["analysis", "orchestration", "decision"], status: "online", version: "2.0.0" },
  { id: "athena", name: "ATHENA", role: "Chief Strategy Officer", specialty: "Stratégie", capabilities: ["analysis", "strategy", "decision"], status: "online", version: "2.0.0" },
  { id: "turing", name: "TURING", role: "CTO", specialty: "Technologie et architecture", capabilities: ["analysis", "technology", "execution"], status: "online", version: "2.0.0" },
  { id: "seneca", name: "SENECA", role: "Chief Reflection Officer", specialty: "Critique et risques", capabilities: ["analysis", "reflection", "risk"], status: "online", version: "2.0.0" }
];

export const initialRuntimeActions: ActionRecord[] = [
  { id: "runtime-context", caseId: "executiveos", title: "Valider le contrat du Context Engine", owner: "Non affecté", progress: 0, status: "todo", requiredCapability: "analysis" },
  { id: "runtime-architecture", caseId: "executiveos", title: "Vérifier l’architecture du runtime agentique", owner: "Non affecté", progress: 0, status: "todo", requiredCapability: "technology" }
];
