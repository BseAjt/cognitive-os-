import type { StateCreator } from "zustand";
import type { DecisionActionPlanSlice, ExecutiveState } from "./types.ts";
import { evaluateDecisionWatch } from "../lib/decision-watch.ts";

export const createDecisionActionPlanSlice:StateCreator<ExecutiveState,[],[],DecisionActionPlanSlice>=(set)=>({
  decisionActionPlans:[],
  activateDecisionActionPlan:(result)=>set((state)=>{
    if(state.decisionActionPlans.some((item)=>item.executiveCycleId===result.plan.executiveCycleId)) return state;
    const objects=result.actions.map((action)=>({id:crypto.randomUUID(),caseId:action.caseId,type:"action" as const,title:action.title,confidence:result.decision.confidence,status:"active" as const,source:"action" as const,referenceId:action.id,createdAt:result.plan.createdAt,updatedAt:result.plan.createdAt}));
    const watch=evaluateDecisionWatch({plan:result.plan,decision:result.decision,actions:[...result.actions,...state.actions],sources:state.contextSources,evidence:state.contextEvidence,evaluatedAt:result.plan.createdAt});
    return {decisionActionPlans:[result.plan,...state.decisionActionPlans],decisionWatches:[watch,...state.decisionWatches.filter((item)=>item.planId!==result.plan.id)],decisions:[result.decision,...state.decisions],actions:[...result.actions,...state.actions],caseObjects:[{id:crypto.randomUUID(),caseId:result.decision.caseId,type:"decision" as const,title:result.decision.outcome,confidence:result.decision.confidence,status:"resolved" as const,source:"decision" as const,referenceId:result.decision.id,createdAt:result.plan.createdAt,updatedAt:result.plan.createdAt},...objects,...state.caseObjects],cases:state.cases.map((item)=>item.id===result.plan.caseId?{...item,state:"execute" as const}:item),events:[{id:crypto.randomUUID(),type:"DecisionActionPlanActivated",detail:`${result.actions.length} actions · checkpoint ${result.plan.checkpointAt}`,createdAt:result.plan.createdAt},...state.events]};
  })
});
