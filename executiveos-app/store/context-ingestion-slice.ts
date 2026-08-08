import type { StateCreator } from "zustand";
import { ingestContextSource as processSource, synthesizeCaseContext } from "../lib/context-ingestion.ts";
import type { ContextIngestionSlice, ExecutiveState } from "./types.ts";

export const createContextIngestionSlice:StateCreator<ExecutiveState,[],[],ContextIngestionSlice>=(set)=>({
  contextSources:[],contextEvidence:[],contextSyntheses:[],
  ingestContextSource:(input)=>{
    const id=crypto.randomUUID();
    const result=processSource(input,id);
    set((state)=>{
      const contextSources=[result.source,...state.contextSources];
      const contextEvidence=[...result.evidence,...state.contextEvidence];
      const synthesis=synthesizeCaseContext(input.caseId,contextSources,contextEvidence,result.source.processedAt);
      return {
        contextSources,contextEvidence,
        contextSyntheses:[synthesis,...state.contextSyntheses.filter((item)=>item.caseId!==input.caseId)],
        caseObjects:[...result.evidence.slice(0,4).map((item)=>({id:crypto.randomUUID(),caseId:input.caseId,type:"context" as const,title:item.claim,confidence:item.confidence,status:"active" as const,source:"conversation" as const,referenceId:item.id,createdAt:item.createdAt,updatedAt:item.createdAt})),...state.caseObjects],
        events:[{id:crypto.randomUUID(),type:"ContextSourceIngested",detail:`${input.caseId} · ${result.source.title} · ${result.evidence.length} preuve(s)`,createdAt:result.source.createdAt},...state.events]
      };
    });
    return id;
  },
  removeContextSource:(sourceId)=>set((state)=>{
    const source=state.contextSources.find((item)=>item.id===sourceId);
    if(!source) return state;
    const contextSources=state.contextSources.filter((item)=>item.id!==sourceId);
    const contextEvidence=state.contextEvidence.filter((item)=>item.sourceId!==sourceId);
    const removedEvidenceIds=new Set(state.contextEvidence.filter((item)=>item.sourceId===sourceId).map((item)=>item.id));
    const synthesis=synthesizeCaseContext(source.caseId,contextSources,contextEvidence);
    return {contextSources,contextEvidence,contextSyntheses:[synthesis,...state.contextSyntheses.filter((item)=>item.caseId!==source.caseId)],caseObjects:state.caseObjects.filter((item)=>!item.referenceId||!removedEvidenceIds.has(item.referenceId)),events:[{id:crypto.randomUUID(),type:"ContextSourceRemoved",detail:`${source.caseId} · ${source.title}`,createdAt:new Date().toISOString()},...state.events]};
  })
});
