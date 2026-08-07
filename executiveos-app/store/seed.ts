import type { Challenge } from "@/types/domain";
import type { ConversationMessage } from "@/store/types";

export const initialChallenges: Challenge[] = [
  {
    id: "executiveos",
    title: "Construire ExecutiveOS",
    goal: "Démontrer une nouvelle catégorie logicielle centrée sur la décision.",
    hypothesis: "Les dirigeants paieront pour réduire le coût cognitif de leurs décisions.",
    impact: 10,
    urgency: 8,
    confidence: 72,
    cognitiveCost: 7,
    risk: 7,
    context: "Le Conversation Runtime devient le cœur du produit.",
    state: "decide"
  },
  {
    id: "positioning",
    title: "Valider le positionnement",
    goal: "Créer un message immédiatement compris par les dirigeants.",
    hypothesis: "Decision Operating System est une catégorie claire et mémorisable.",
    impact: 7,
    urgency: 5,
    confidence: 84,
    cognitiveCost: 3,
    risk: 3,
    context: "ExecutiveOS est retenu comme nom produit.",
    state: "explore"
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
