"use client";

import { useExecutiveStore } from "@/store/executive-store";

export function DecisionWatchPanel({caseId}:{caseId:string}) {
  const store=useExecutiveStore();
  const plans=store.decisionActionPlans.filter((item)=>item.caseId===caseId);
  const activePlan=plans.find((item)=>item.status==="active")??plans[0];
  const watch=activePlan&&store.decisionWatches.find((item)=>item.planId===activePlan.id);
  if(!activePlan) return null;
  return <article className={`executive-card p-5 ${watch?.status==="reopen"?"border-red-400/35":watch?.status==="watch"?"border-amber-300/30":"border-[#42d59d]/20"}`}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-black tracking-[.14em] text-[#42d59d]">DECISION WATCH · B7.5</div><p className="mt-1 text-xs text-[#71839e]">Surveille les nouvelles preuves, blocages et checkpoints qui fragilisent la décision.</p></div><button onClick={()=>store.evaluateDecisionPlan(activePlan.id)} className="executive-button executive-ghost text-xs">Réévaluer maintenant</button></div>
    {watch?<><div className="mt-4 flex flex-wrap items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${watch.status==="reopen"?"bg-red-400/15 text-red-200":watch.status==="watch"?"bg-amber-300/15 text-amber-100":"bg-[#42d59d]/15 text-[#7ce6bb]"}`}>{watch.status}</span><strong className="text-sm">{watch.summary}</strong><span className="ml-auto text-[10px] text-[#71839e]">{new Date(watch.evaluatedAt).toLocaleString("fr-FR")}</span></div><div className="mt-4 grid gap-3 lg:grid-cols-2">{watch.signals.map((signal)=><div key={signal.id} className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4"><div className="flex items-center justify-between gap-2"><strong className="text-sm">{signal.title}</strong>{signal.citation&&<span className="rounded bg-[#7c5cff]/20 px-2 py-1 text-[10px] font-black text-[#c8c0ff]">{signal.citation}</span>}</div><p className="mt-2 text-xs leading-5 text-[#a9b7ca]">{signal.detail}</p></div>)}</div><p className="mt-4 rounded-2xl border border-[#7c5cff]/20 bg-[#7c5cff]/10 p-4 text-sm font-semibold leading-6">Assistant de décision · {watch.recommendedAction}</p></>:<p className="mt-4 rounded-2xl border border-dashed border-white/[.08] p-5 text-sm text-[#71839e]">Lance la première évaluation pour établir la baseline de surveillance.</p>}
  </article>;
}
