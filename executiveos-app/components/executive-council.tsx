"use client";

import { useMemo, useState } from "react";
import type { ContextItem, ContextReadiness } from "@/lib/context-engine";
import type { DecisionFrame } from "@/lib/decision-room";
import { conveneExecutiveCouncil } from "@/lib/executive-council";
import { buildScenarioPortfolio } from "@/lib/scenario-builder";

interface ExecutiveCouncilProps {
  frame: DecisionFrame;
  contextItems: ContextItem[];
  readiness: ContextReadiness;
  onCreateAction: (title: string) => void;
}

export function ExecutiveCouncil({ frame, contextItems, readiness, onCreateAction }: ExecutiveCouncilProps) {
  const portfolio = useMemo(() => buildScenarioPortfolio(frame, contextItems, readiness), [frame, contextItems, readiness]);
  const council = useMemo(() => conveneExecutiveCouncil(contextItems, readiness, portfolio), [contextItems, readiness, portfolio]);
  const [activeAgent, setActiveAgent] = useState("CFO");
  const active = council.assessments.find((assessment) => assessment.agent === activeAgent) ?? council.assessments[0];

  return (
    <article className="executive-card mt-5 overflow-hidden">
      <div className="border-b border-white/10 bg-[#101b2f] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black tracking-[.14em] text-[#42d59d]">EXECUTIVE COUNCIL · ORION</div>
            <h2 className="mt-2 text-2xl font-semibold">Débat exécutif structuré</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#91a2bd]">Chaque agent évalue le même dossier selon son mandat. ORION expose les objections, les désaccords et les conditions qui doivent être satisfaites avant décision.</p>
          </div>
          <div className="text-right"><span className="text-xs text-[#91a2bd]">Consensus exploitable</span><strong className="mt-1 block text-3xl">{council.consensusLevel}%</strong></div>
        </div>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[.75fr_1.25fr]">
        <section className="grid content-start gap-3">
          {council.assessments.map((assessment) => <button key={assessment.agent} onClick={() => setActiveAgent(assessment.agent)} className={`rounded-2xl border p-4 text-left ${activeAgent === assessment.agent ? "border-[#42d59d]/60 bg-[#42d59d]/10" : "border-white/10 bg-white/[.02]"}`}>
            <div className="flex items-center justify-between gap-3"><div><strong>{assessment.agent}</strong><span className="ml-2 text-xs text-[#91a2bd]">{assessment.role}</span></div><span className="text-xs text-[#91a2bd]">{assessment.confidence}%</span></div>
            <div className="mt-2 flex flex-wrap gap-2"><span className={`rounded-full px-2 py-1 text-[11px] ${assessment.position === "oppose" ? "bg-[#ff7185]/15 text-[#ff9dab]" : assessment.position === "insufficient_context" ? "bg-[#ffbc57]/15 text-[#ffd895]" : "bg-[#7c5cff]/15 text-[#c0b4ff]"}`}>{assessment.position}</span>{assessment.preferredScenarioId && <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-[#aebbd0]">{assessment.preferredScenarioId}</span>}</div>
          </button>)}
        </section>

        <section className="grid content-start gap-4">
          {active && <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="flex items-center justify-between"><div><span className="text-xs font-black tracking-[.12em] text-[#8d7ce4]">AVIS DE {active.agent}</span><h3 className="mt-1 text-xl font-semibold">{active.role}</h3></div><span className="text-sm text-[#91a2bd]">Confiance {active.confidence}%</span></div><div className="mt-4 grid gap-3">{active.findings.map((finding, index) => <div key={`${finding.type}-${index}`} className="rounded-xl border border-white/10 bg-[#0d1727] p-3"><div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-wide text-[#9d83ff]">{finding.type}</span><span className="text-xs text-[#91a2bd]">{finding.severity}</span></div><p className="mt-2 text-sm leading-6 text-[#d6dfed]">{finding.text}</p></div>)}</div>{active.conditions.length > 0 && <div className="mt-4"><strong className="text-sm">Conditions</strong><ul className="mt-2 grid gap-2 text-sm text-[#aebbd0]">{active.conditions.map((condition) => <li key={condition}>• {condition}</li>)}</ul></div>}</div>}

          <div className="rounded-2xl border border-[#42d59d]/25 bg-[#42d59d]/5 p-4"><div className="text-xs font-black tracking-[.12em] text-[#7aefc2]">SYNTHÈSE ORION</div><p className="mt-2 leading-7 text-[#dce7f5]">{council.orionSynthesis}</p>{council.provisionalDirection && <p className="mt-3 text-sm font-semibold text-[#b8f3dc]">{council.provisionalDirection}</p>}</div>

          {council.divergences.length > 0 && <div className="rounded-2xl border border-[#ff7185]/30 bg-[#ff7185]/5 p-4"><div className="text-xs font-black tracking-[.12em] text-[#ff9dab]">DIVERGENCES À ARBITRER</div><div className="mt-3 grid gap-3">{council.divergences.map((divergence) => <div key={divergence.topic}><strong>{divergence.topic}</strong><p className="mt-1 text-sm leading-6 text-[#d6dfed]">{divergence.description}</p><p className="mt-1 text-xs text-[#ffb5c0]">{divergence.resolutionNeeded}</p></div>)}</div></div>}

          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="flex items-center justify-between"><strong>Prochaines actions du Conseil</strong><span className={`rounded-full px-2 py-1 text-xs ${council.recommendationAllowed ? "bg-[#42d59d]/15 text-[#7aefc2]" : "bg-[#ff7185]/15 text-[#ff9dab]"}`}>{council.recommendationAllowed ? "Décision possible" : "Décision suspendue"}</span></div><div className="mt-3 grid gap-2">{council.nextActions.map((action) => <button key={action} onClick={() => onCreateAction(action)} className="rounded-xl border border-white/10 bg-[#0d1727] p-3 text-left text-sm hover:border-[#7c5cff]/50">+ {action}</button>)}</div></div>
        </section>
      </div>
    </article>
  );
}
