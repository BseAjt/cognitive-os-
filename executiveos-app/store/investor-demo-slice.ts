import type { StateCreator } from "zustand";
import { createInvestorDemoDataset, INVESTOR_DEMO_VERSION } from "../lib/investor-demo.ts";
import type { ExecutiveState, InvestorDemoSlice } from "./types.ts";

export const createInvestorDemoSlice: StateCreator<ExecutiveState, [], [], InvestorDemoSlice> = (set) => ({
  demoMode: "workspace",
  demoVersion: INVESTOR_DEMO_VERSION,
  projects: [],
  ideas: [],
  loadInvestorDemo: () => set((state) => {
    const demo = createInvestorDemoDataset();
    return {
      ...demo,
      demoMode: "investor" as const,
      demoVersion: INVESTOR_DEMO_VERSION,
      messages: [], caseObjects: [], agentRuns: [], memories: [], knowledgeRecords: [], knowledgeEntities: [], knowledgeRelations: [], reasoningRevisions: [], cognitiveProfiles: [],
      integrationConnections: [], integrationSyncRuns: [], kernelTransactions: [], kernelEvents: [],
      events: [{ id: crypto.randomUUID(), type: "InvestorDemoLoaded", detail: `Dataset investisseur ${INVESTOR_DEMO_VERSION} · ${demo.cases.length} dossiers`, createdAt: new Date().toISOString() }]
    };
  }),
  createBlankWorkspace: () => set({
    demoMode: "blank", activeCaseId: "", cases: [], projects: [], ideas: [], messages: [], caseObjects: [], decisions: [], actions: [], events: [], agentRuns: [], learningEvents: [], reflections: [], cognitiveProfiles: [], reasoningRevisions: [], memories: [], knowledgeRecords: [], knowledgeEntities: [], knowledgeRelations: [], kernelTransactions: [], kernelEvents: [], contextSources: [], contextEvidence: [], contextSyntheses: [], executiveCycles: [], decisionActionPlans: [], decisionWatches: [], integrationConnections: [], integrationSyncRuns: []
  })
});
