"use client";

import type { DecisionFrame } from "@/lib/decision-room";
import type { Challenge } from "@/types/domain";

type ReasoningFlowProps = {
  challenge: Challenge;
  frame: DecisionFrame;
};

export function ReasoningFlowV3({ challenge, frame }: ReasoningFlowProps) {
  const steps = [
    { id: "question", label: "Question", title: frame.question || challenge.title, status: "active" },
    { id: "hypothesis", label: "Hypothèse", title: challenge.hypothesis, status: "active" },
    { id: "evidence", label: "Preuves", title: frame.missingInformation.length ? `${frame.missingInformation.length} éléments critiques à compléter` : "Contexte suffisamment documenté", status: frame.missingInformation.length ? "watch" : "stable" },
    { id: "options", label: "Options", title: `${frame.options.length} scénarios comparés`, status: "active" },
    { id: "objections", label: "Objections", title: frame.reviewTrigger, status: frame.requiresContext ? "watch" : "stable" },
    { id: "decision", label: "Décision", title: frame.recommendation ?? "Arbitrage encore ouvert", status: frame.recommendation ? "stable" : "watch" },
    { id: "consequences", label: "Conséquences", title: "Impacts et actions seront reliés à la décision finale", status: "future" }
  ] as const;

  return (
    <section className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/82 p-5 md:p-6">
      <div className="text-[10px] font-black uppercase tracking-[.18em] text-[#9d83ff]">Reasoning Flow · UX3.2</div>
      <h2 className="mt-2 text-2xl font-semibold">Du problème à la décision</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8192ab]">Première fondation de UX3.2 : chaque étape du raisonnement devient un objet explicite, lisible et relié à la décision.</p>
      <div className="mt-6 overflow-x-auto pb-2">
        <div className="flex min-w-[1050px] items-stretch gap-3">
          {steps.map((step, index) => <FlowStep key={step.id} index={index + 1} {...step} isLast={index === steps.length - 1} />)}
        </div>
      </div>
    </section>
  );
}

function FlowStep({ index, label, title, status, isLast }: { index:number; label:string; title:string; status:"active"|"watch"|"stable"|"future"; isLast:boolean }) {
  const styles = {
    active: "border-[#7c5cff]/30 bg-[#7c5cff]/[.06] text-[#c4b9ff]",
    watch: "border-[#ffbc57]/25 bg-[#ffbc57]/[.05] text-[#ffd895]",
    stable: "border-[#42d59d]/20 bg-[#42d59d]/[.04] text-[#7de5bd]",
    future: "border-white/[.06] bg-white/[.015] text-[#667995]"
  }[status];
  return <div className="flex min-w-0 flex-1 items-center gap-3"><article className={`h-full min-w-[130px] flex-1 rounded-2xl border p-4 ${styles}`}><div className="font-mono text-[10px] opacity-60">{String(index).padStart(2,"0")}</div><div className="mt-3 text-[10px] font-black uppercase tracking-[.13em]">{label}</div><p className="mt-2 text-xs leading-5 text-[#c8d2df]">{title}</p></article>{!isLast && <span className="text-[#465873]">→</span>}</div>;
}
