"use client";

import { useState } from "react";
import { DecisionTimelineV3 } from "@/components/decision-timeline-v3";
import { ImpactAnalysisV3 } from "@/components/impact-analysis-v3";
import { OrionDecisionCopilotV3 } from "@/components/orion-decision-copilot-v3";
import { ReasoningFlowV3 } from "@/components/reasoning-flow-v3";
import type { DecisionFrame } from "@/lib/decision-room";
import type { ReasoningStepId } from "@/store/executive-store";
import type { ActionItem, Challenge, Decision } from "@/types/domain";

type DecisionCanvasProps = {
  challenge: Challenge;
  frame: DecisionFrame;
  decisions: Decision[];
  actions: ActionItem[];
  onCreateAction: (title: string) => void;
};

export function DecisionCanvas({ challenge, frame, decisions, actions, onCreateAction }: DecisionCanvasProps) {
  const [activeStepId, setActiveStepId] = useState<ReasoningStepId>("question");
  const latestDecision = decisions[0];
  const confidence = frame.confidence ?? challenge.confidence;
  const status = frame.requiresContext ? "Contexte incomplet" : latestDecision ? "Décidée" : "Prête à arbitrer";

  return (
    <section className="space-y-5">
      <article className="relative overflow-hidden rounded-[28px] border border-white/[.08] bg-[linear-gradient(145deg,rgba(19,31,51,.98),rgba(9,19,33,.98))] p-6 md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-[#7c5cff]/12 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#7c5cff]/12 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.14em] text-[#c2b6ff]">Decision Canvas · UX3</span>
            <span className="rounded-full border border-white/[.08] px-2.5 py-1 text-[10px] uppercase tracking-[.12em] text-[#8091aa]">{frame.category.replaceAll("_", " ")}</span>
            <span className={`rounded-full px-2.5 py-1 text-[10px] ${frame.requiresContext ? "bg-[#ffbc57]/10 text-[#ffd895]" : "bg-[#42d59d]/10 text-[#7de5bd]"}`}>{status}</span>
          </div>
          <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.18em] text-[#6f819e]">Question à trancher</div>
              <h1 className="mt-2 max-w-5xl text-3xl font-semibold tracking-[-.035em] md:text-5xl">{frame.question || challenge.title}</h1>
              <p className="mt-4 max-w-4xl text-sm leading-7 text-[#94a6c0]">{challenge.context}</p>
            </div>
            <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
              <Metric label="Confiance" value={`${confidence}%`} />
              <Metric label="Risque" value={`${challenge.risk}/10`} />
              <Metric label="État" value={challenge.state} />
            </div>
          </div>
        </div>
      </article>

      <ReasoningFlowV3 challenge={challenge} frame={frame} activeStepId={activeStepId} onStepChange={setActiveStepId} />

      <DecisionTimelineV3 challenge={challenge} decisions={decisions} actions={actions} activeStepId={activeStepId} onStepSelect={setActiveStepId} />

      <ImpactAnalysisV3 challenge={challenge} frame={frame} decisions={decisions} actions={actions} />

      <OrionDecisionCopilotV3 challenge={challenge} frame={frame} decisions={decisions} actions={actions} onCreateAction={onCreateAction} />

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-5">
          <CanvasSection eyebrow="Contexte" title="Ce que nous essayons d’accomplir">
            <p className="text-sm leading-7 text-[#b7c3d5]">{challenge.goal}</p>
            <div className="mt-4 rounded-2xl border border-white/[.06] bg-white/[.02] p-4">
              <div className="text-[10px] font-black uppercase tracking-[.14em] text-[#7c92b2]">Hypothèse actuelle</div>
              <p className="mt-2 text-sm leading-6 text-[#d8e0ed]">{challenge.hypothesis}</p>
            </div>
          </CanvasSection>

          <CanvasSection eyebrow="Options" title="Scénarios envisagés">
            <div className="grid gap-3 md:grid-cols-3">
              {frame.options.map((option, index) => (
                <article key={option.title} className={`rounded-2xl border p-4 ${index === 1 ? "border-[#7c5cff]/35 bg-[#7c5cff]/7" : "border-white/[.07] bg-white/[.02]"}`}>
                  <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-[.13em] text-[#8393ad]">Option {index + 1}</span>{option.score !== null && <span className="rounded-lg bg-white/[.05] px-2 py-1 font-mono text-xs text-[#b9c5d6]">{option.score}</span>}</div>
                  <h3 className="mt-3 font-semibold text-[#edf2f9]">{option.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#8192ab]">{option.description}</p>
                </article>
              ))}
            </div>
          </CanvasSection>

          <CanvasSection eyebrow="Critères" title="Ce qui doit guider l’arbitrage">
            <div className="grid gap-2 md:grid-cols-2">{frame.criteria.map((criterion, index) => <div key={criterion} className="flex items-start gap-3 rounded-xl border border-white/[.06] bg-white/[.02] p-3"><span className="font-mono text-[10px] text-[#5f718c]">{String(index + 1).padStart(2, "0")}</span><span className="text-sm text-[#c5cfdd]">{criterion}</span></div>)}</div>
          </CanvasSection>
        </div>

        <div className="space-y-5">
          <CanvasSection eyebrow="ORION" title="Recommandation actuelle" tone="violet">
            <p className="text-base leading-7 text-[#dce4f0]">{frame.recommendation ?? "ORION ne recommande pas encore une décision irréversible : des informations critiques manquent."}</p>
            <div className="mt-4 rounded-2xl border border-white/[.07] bg-[#0a1525] p-4"><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#6f819e]">Déclencheur de revue</div><p className="mt-2 text-xs leading-5 text-[#91a2bd]">{frame.reviewTrigger}</p></div>
          </CanvasSection>

          <CanvasSection eyebrow="Incertitudes" title="Ce qui manque encore" tone="amber">
            <div className="space-y-2">{frame.missingInformation.map((item) => <div key={item} className="flex items-start gap-2 rounded-xl border border-[#ffbc57]/10 bg-[#ffbc57]/[.035] p-3"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#ffbc57]"/><span className="text-sm leading-5 text-[#d9cfbc]">{item}</span></div>)}</div>
          </CanvasSection>

          <CanvasSection eyebrow="Décision" title="Historique & exécution" tone="green">
            {latestDecision ? <div className="rounded-2xl border border-[#42d59d]/12 bg-[#42d59d]/[.035] p-4"><strong className="text-[#dff9ef]">{latestDecision.finalDecision}</strong><p className="mt-2 text-xs leading-5 text-[#91a2bd]">{latestDecision.rationale}</p></div> : <p className="text-sm text-[#8192ab]">Aucune décision finale enregistrée pour ce sujet.</p>}
            <div className="mt-4 space-y-2">{actions.slice(0, 3).map(action => <div key={action.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[.06] bg-white/[.02] p-3"><span className="text-sm text-[#c8d2df]">{action.title}</span><span className="text-[10px] uppercase text-[#6f819e]">{action.status}</span></div>)}</div>
            <button onClick={() => onCreateAction(frame.recommendation ?? `Clarifier : ${frame.question}`)} className="mt-4 w-full rounded-xl bg-[#7c5cff] px-4 py-2.5 text-sm font-bold hover:bg-[#8b6dff]">Créer la prochaine action</button>
          </CanvasSection>
        </div>
      </div>
    </section>
  );
}

function CanvasSection({ eyebrow, title, children, tone = "default" }: { eyebrow: string; title: string; children: React.ReactNode; tone?: "default" | "violet" | "amber" | "green" }) {
  const color = tone === "violet" ? "text-[#9d83ff]" : tone === "amber" ? "text-[#ffbc57]" : tone === "green" ? "text-[#42d59d]" : "text-[#8fb7ff]";
  return <article className="rounded-[24px] border border-white/[.08] bg-[#0d192b]/82 p-5 md:p-6"><div className={`text-[10px] font-black uppercase tracking-[.18em] ${color}`}>{eyebrow}</div><h2 className="mt-2 text-xl font-semibold tracking-[-.02em]">{title}</h2><div className="mt-4">{children}</div></article>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 border-b border-white/[.06] py-2 last:border-0"><span className="text-xs text-[#73859f]">{label}</span><strong className="text-sm capitalize text-[#dfe6f2]">{value}</strong></div>;
}
