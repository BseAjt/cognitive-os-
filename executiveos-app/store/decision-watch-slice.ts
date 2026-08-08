import type { StateCreator } from "zustand";
import { evaluateDecisionWatch } from "../lib/decision-watch.ts";
import type { DecisionWatchSlice, ExecutiveState } from "./types.ts";

export const createDecisionWatchSlice:StateCreator<ExecutiveState,[],[],DecisionWatchSlice>=(set)=>({
  decisionWatches:[],
  evaluateDecisionPlan:(planId,evaluatedAt)=>set((state)=>{
    const plan=state.decisionActionPlans.find((item)=>item.id===planId);
    const decision=plan&&state.decisions.find((item)=>item.id===plan.decisionId);
    if(!plan||!decision) return state;
    const watch=evaluateDecisionWatch({plan,decision,actions:state.actions,sources:state.contextSources,evidence:state.contextEvidence,evaluatedAt});
    return {decisionWatches:[watch,...state.decisionWatches.filter((item)=>item.planId!==planId)],events:[{id:crypto.randomUUID(),type:"DecisionWatchEvaluated",detail:`${plan.caseId} · ${watch.status} · ${watch.signals.length} signal(s)`,createdAt:watch.evaluatedAt},...state.events]};
  })
});
