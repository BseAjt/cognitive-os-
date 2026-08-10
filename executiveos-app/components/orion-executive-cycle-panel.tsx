"use client";

import { useState } from "react";
import { buildDecisionToAction } from "@/lib/decision-to-action";
import { requestOrionExecutiveCycle } from "@/lib/orion-cycle-outcome";
import { useExecutiveStore } from "@/store/executive-store";

export function OrionExecutiveCyclePanel({caseId}:{caseId:string}) {
  const store=useExecutiveStore();
  const active=store.cases.find((item)=>item.id===caseId);
  const [objective,setObjective]=useState(active?.objective??"");
  const [error,setError]=useState("");
  const [running,setRunning]=useState(false);
  const cycles=store.executiveCycles.filter((item)=>item.caseId===caseId);
  const latest=cycles[0];
  const plan=latest?store.decisionActionPlans.find((item)=>item.executiveCycleId===latest.id):undefined;
  const planActions=plan?plan.actionIds.map((id)=>store.actions.find((item)=>item.id===id)).filter((item)=>item!==undefined):[];
  if(!active)return null;

  async function run(){
    if(running)return;
    setRunning(true);
    try {
      setError("");
      const cycle=await requestOrionExecutiveCycle({objective,cognitiveCase:active!,sources:store.contextSources,evidence:store.contextEvidence},store.agents);
      store.prependExecutiveCycle(cycle);
      if(cycle.status==="completed")store.activateDecisionActionPlan(buildDecisionToAction({cognitiveCase:active!,cycle}));
    }
    catch(value){ setError(value instanceof Error?value.message:"Cycle ORION impossible."); }
    finally { setRunning(false); }
  }

  function activate(){
    try { setError(""); store.activateDecisionActionPlan(buildDecisionToAction({cognitiveCase:active!,cycle:latest!})); }
    catch(value){ setError(value instanceof Error?value.message:"Plan d’exécution impossible."); }
  }

  return <div className="space-y-5">
    <article className="executive-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-black tracking-[.14em] text-[#42d59d]">B7.3 · ORION EXECUTIVE CYCLE</div><h3 className="mt-2 text-xl font-semibold">Convoquer l’équipe sur un mandat sourcé</h3><p className="mt-1 text-xs text-[#71839e]">Perspectives persistantes · divergences visibles · recommandation sous gate.</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs text-[#91a2bd]">{cycles.length} cycle(s)</span></div>
      <div className="mt-4 flex gap-3 max-sm:flex-col"><input value={objective} onChange={(event)=>setObjective(event.target.value)} disabled={running} placeholder="Quel arbitrage ORION doit-il préparer ?" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#091422] px-4 py-3 text-sm outline-none disabled:opacity-60"/><button onClick={run} disabled={running||!objective.trim()} className="rounded-xl bg-[#42b98d] px-5 py-3 text-sm font-bold text-[#071711] disabled:cursor-not-allowed disabled:opacity-50">{running?"Conseil en cours…":"Lancer et créer le plan"}</button></div>{running&&<p role="status" className="mt-3 text-xs text-[#8de4c3]">ATHENA, TURING et SENECA analysent le dossier, se confrontent, puis ORION arbitre.</p>}{error&&<p role="alert" className="mt-3 text-xs text-red-300">{error}</p>}
      {latest?<div className="mt-5 space-y-4"><div className={`rounded-2xl border p-4 ${latest.status==="completed"?"border-[#42d59d]/25 bg-[#42d59d]/5":"border-amber-300/25 bg-amber-300/5"}`}><div className="flex items-center justify-between gap-3"><strong className="text-sm">Synthèse ORION</strong><span className="text-xs uppercase text-[#91a2bd]">{latest.status} · {latest.confidence}%</span></div><p className="mt-2 text-sm leading-6 text-[#d6dfed]">{latest.synthesis}</p>{latest.recommendation&&<p className="mt-3 text-sm font-semibold text-[#8de4c3]">{latest.recommendation}</p>}{latest.missingEvidence.map((item)=><p key={item} className="mt-2 text-xs text-amber-200">• {item}</p>)}</div><div className="grid gap-3 lg:grid-cols-3">{latest.contributions.map((item)=><div key={item.agentId} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="flex items-center justify-between"><strong className="text-sm">{item.agentName}</strong><span className="text-[10px] uppercase text-[#9d83ff]">{item.position}</span></div><p className="mt-1 text-[10px] text-[#71839e]">{item.mandate}</p><p className="mt-3 text-xs leading-5 text-[#cbd5e5]">{item.analysis}</p></div>)}</div>{latest.divergences.map((item)=><div key={item.topic} className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4"><strong className="text-sm text-amber-100">Divergence · {item.topic}</strong><p className="mt-2 text-xs leading-5 text-[#cbd5e5]">{item.description}</p><p className="mt-2 text-xs text-amber-200">À résoudre : {item.resolution}</p></div>)}</div>:<p className="mt-5 rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-[#71839e]">Aucun cycle exécutif pour ce dossier.</p>}
    </article>

    {latest&&<article className="executive-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-black tracking-[.14em] text-[#f4c76d]">B7.4 · DECISION-TO-ACTION</div><h3 className="mt-2 text-xl font-semibold">Transformer la décision en exécution mesurable</h3><p className="mt-1 text-xs text-[#71839e]">Responsables · échéances · dépendances · indicateurs · checkpoint ORION.</p></div>{plan?<span className="rounded-full border border-[#42d59d]/25 bg-[#42d59d]/5 px-3 py-1 text-xs uppercase text-[#8de4c3]">plan actif</span>:<button onClick={activate} disabled={latest.status!=="completed"} className="rounded-xl bg-[#f4c76d] px-5 py-3 text-sm font-bold text-[#211805] disabled:cursor-not-allowed disabled:opacity-35">Activer le plan</button>}</div>
      {plan?<div className="mt-5 space-y-4"><div className="grid gap-3 lg:grid-cols-3">{planActions.map((action,index)=><div key={action.id} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="text-[10px] font-black uppercase tracking-[.12em] text-[#f4c76d]">Action {index+1}</div><strong className="mt-2 block text-sm leading-5">{action.title}</strong><p className="mt-3 text-xs text-[#91a2bd]">{action.owner} · échéance {action.dueAt?new Date(action.dueAt).toLocaleDateString("fr-FR"):"à définir"}</p>{index>0&&<p className="mt-2 text-[10px] text-[#71839e]">Dépend de l’action {index}</p>}</div>)}</div><div className="grid gap-3 md:grid-cols-2">{plan.metrics.map((metric)=><div key={metric.id} className="rounded-2xl border border-[#7c5cff]/20 bg-[#7c5cff]/5 p-4"><span className="text-[10px] font-black uppercase tracking-[.12em] text-[#b7a9ff]">Indicateur · {metric.owner}</span><div className="mt-2 flex items-end justify-between gap-3"><strong className="text-sm">{metric.label}</strong><span className="text-xs text-[#c8c0ff]">{metric.current} → {metric.target}</span></div></div>)}</div><p className="text-xs text-[#91a2bd]">Checkpoint ORION : {new Date(plan.checkpointAt).toLocaleDateString("fr-FR")} · les actions sont disponibles dans la section Exécution.</p></div>:<p className="mt-5 rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-[#71839e]">{latest.status==="completed"?"La recommandation est prête à devenir un plan d’action traçable.":"Le cycle est bloqué : complétez les preuves avant de créer des actions."}</p>}
    </article>}
  </div>;
}
