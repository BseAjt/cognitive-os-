import type { CognitiveCase } from "@/domain/canonical";
import type { ConversationMessage } from "@/store/types";

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
