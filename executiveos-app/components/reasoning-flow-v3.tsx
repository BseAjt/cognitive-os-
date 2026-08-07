"use client";

import { useMemo, useState } from "react";
import type { DecisionFrame } from "@/lib/decision-room";
import { useExecutiveStore, type ReasoningStepId } from "@/store/executive-store";
import type { Challenge } from "@/types/domain";

type FlowStatus = "active" | "watch" | "stable" | "future";
type Step = { id: ReasoningStepId; label: string; title: string; detail: string; status: FlowStatus };

type ReasoningFlowProps = {
  challenge: Challenge;
  frame: DecisionFrame;
  activeStepId?: ReasoningStepId;
  onStepChange?: (stepId: ReasoningStepId) => void;
};

export function ReasoningFlowV3({ challenge, frame, activeStepId, onStepChange }: ReasoningFlowProps) {
  const reasoningRevisions = useExecutiveStore((state) => state.reasoningRevisions);
  const addReasoningRevision = useExecutiveStore((state) => state.addReasoningRevision);
  const steps = useMemo<Step[]>(() => [
    { id: "question", label: "Question", title: frame.question || challenge.title, detail: challenge.context, status: "active" },
    { id: "hypothesis", label: "Hypothèse", title: challenge.hypothesis, detail: "Hypothèse de travail actuelle. Elle peut évoluer à mesure que de nouvelles preuves apparaissent.", status: "active" },
    { id: "evidence", label: "Preuves", title: frame.missingInformation.length ? `${frame.missingInformation.length} éléments critiques à compléter` : "Contexte suffisamment documenté", detail: frame.missingInformation.length ? frame.missingInformation.join(" · ") : "Les informations nécessaires au cadrage sont actuellement suffisantes.", status: frame.missingInformation.length ? "watch" : "stable" },
    { id: "options", label: "Options", title: `${frame.options.length} scénarios comparés`, detail: frame.options.map((option) => `${option.title}${option.score !== null ? ` (${option.score})` : ""}`).join(" · "), status: "active" },
    { id: "objections", label: "Objections", title: frame.reviewTrigger, detail: frame.criteria.join(" · "), status: frame.requiresContext ? "watch" : "stable" },
    { id: "decision", label: "Décision", title: frame.recommendation ?? "Arbitrage encore ouvert", detail: frame.recommendation ? `Confiance ${frame.confidence ?? challenge.confidence}%` : "La décision reste ouverte tant que les éléments critiques ne sont pas consolidés.", status: frame.recommendation ? "stable" : "watch" },
    { id: "consequences", label: "Conséquences", title: "Impacts et actions reliés à la décision finale", detail: "Les conséquences seront enrichies à partir des actions, dépendances et résultats observés après arbitrage.", status: "future" }
  ], [challenge, frame]);

  const [internalSelectedId, setInternalSelectedId] = useState<ReasoningStepId>("question");
  const [draft, setDraft] = useState("");
  const selectedId = activeStepId ?? internalSelectedId;
  const selectStep = (stepId: ReasoningStepId) => {
    setInternalSelectedId(stepId);
    onStepChange?.(stepId);
  };
  const selected = steps.find((step) => step.id === selectedId) ?? steps[0];
  const revisionsForStep = (stepId: ReasoningStepId) => reasoningRevisions.filter((item) => item.challengeId === challenge.id && item.stepId === stepId);
  const selectedRevisions = revisionsForStep(selected.id);

  function addRevision() {
    const clean = draft.trim();
    if (!clean) return;
    addReasoningRevision({ challengeId: challenge.id, stepId: selected.id, content: clean, confidence: challenge.confidence, risk: challenge.risk });
    setDraft("");
  }

  return (
    <section className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/82 p-5 md:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-[#9d83ff]">Reasoning Flow · UX3.2</div>
          <h2 className="mt-2 text-2xl font-semibold">Du problème à la décision</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8192ab]">Chaque étape est cliquable et versionnée. Les révisions sont ajoutées sans écraser l’historique et sont persistées dans ExecutiveOS.</p>
        </div>
        <div className="text-xs text-[#667995]">Étape active · {selected.label} · v{selectedRevisions.length + 1}</div>
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="flex min-w-[1050px] items-stretch gap-3">
          {steps.map((step, index) => <FlowStep key={step.id} index={index + 1} {...step} selected={step.id === selected.id} version={revisionsForStep(step.id).length + 1} isLast={index === steps.length - 1} onClick={() => selectStep(step.id)} />)}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <article className="rounded-2xl border border-white/[.07] bg-[#091422] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#8fb7ff]">{selected.label}</div><h3 className="mt-2 text-xl font-semibold">{selected.title}</h3></div><StatusBadge status={selected.status} /></div>
          <p className="mt-4 text-sm leading-7 text-[#98a8bd]">{selected.detail}</p>
          <div className="mt-5 rounded-xl border border-white/[.06] bg-white/[.02] p-4"><div className="text-[10px] font-black uppercase tracking-[.13em] text-[#667995]">Version actuelle</div><div className="mt-2 font-mono text-xs text-[#aab7c9]">v{selectedRevisions.length + 1} · {selectedRevisions.length ? "révisée" : "état initial"}</div></div>
        </article>

        <article className="rounded-2xl border border-white/[.07] bg-[#091422] p-5">
          <div className="text-[10px] font-black uppercase tracking-[.14em] text-[#9d83ff]">Faire évoluer cette étape</div>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Ajouter une révision à « ${selected.label} »…`} className="mt-3 min-h-28 w-full resize-none rounded-xl border border-white/[.08] bg-[#0d192b] p-3 text-sm text-white outline-none placeholder:text-[#596b86] focus:border-[#7c5cff]/45" />
          <button onClick={addRevision} className="mt-3 rounded-xl bg-[#7c5cff] px-4 py-2.5 text-sm font-bold hover:bg-[#8b6dff]">Enregistrer une révision</button>
          <div className="mt-5 border-t border-white/[.06] pt-4"><div className="text-[10px] font-black uppercase tracking-[.13em] text-[#667995]">Historique persistant</div>{selectedRevisions.length ? <div className="mt-3 space-y-2">{[...selectedRevisions].reverse().map((revision) => <div key={revision.id} className="rounded-xl border border-white/[.06] bg-white/[.02] p-3"><div className="flex items-center justify-between gap-3"><span className="font-mono text-[10px] text-[#7d8da5]">v{revision.version + 1}</span><span className="text-[10px] text-[#596b86]">{new Date(revision.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span></div><p className="mt-2 text-xs leading-5 text-[#c5cfdd]">{revision.content}</p></div>)}</div> : <p className="mt-3 text-xs leading-5 text-[#667995]">Aucune révision : cette étape est encore dans son état initial.</p>}</div>
        </article>
      </div>
    </section>
  );
}

function FlowStep({ index, label, title, status, selected, version, isLast, onClick }: { index:number; label:string; title:string; status:FlowStatus; selected:boolean; version:number; isLast:boolean; onClick:()=>void }) {
  const styles = { active: "border-[#7c5cff]/30 bg-[#7c5cff]/[.06] text-[#c4b9ff]", watch: "border-[#ffbc57]/25 bg-[#ffbc57]/[.05] text-[#ffd895]", stable: "border-[#42d59d]/20 bg-[#42d59d]/[.04] text-[#7de5bd]", future: "border-white/[.06] bg-white/[.015] text-[#667995]" }[status];
  return <div className="flex min-w-0 flex-1 items-center gap-3"><button onClick={onClick} className={`h-full min-w-[130px] flex-1 rounded-2xl border p-4 text-left transition ${styles} ${selected ? "ring-2 ring-[#9d83ff]/35" : "hover:-translate-y-0.5 hover:bg-white/[.04]"}`}><div className="flex items-center justify-between gap-2"><span className="font-mono text-[10px] opacity-60">{String(index).padStart(2,"0")}</span><span className="rounded-md bg-black/10 px-1.5 py-0.5 font-mono text-[9px] opacity-75">v{version}</span></div><div className="mt-3 text-[10px] font-black uppercase tracking-[.13em]">{label}</div><p className="mt-2 line-clamp-3 text-xs leading-5 text-[#c8d2df]">{title}</p></button>{!isLast && <span className="text-[#465873]">→</span>}</div>;
}

function StatusBadge({ status }: { status: FlowStatus }) {
  const styles = { active: "bg-[#7c5cff]/12 text-[#c4b9ff]", watch: "bg-[#ffbc57]/10 text-[#ffd895]", stable: "bg-[#42d59d]/10 text-[#7de5bd]", future: "bg-white/[.05] text-[#71839e]" }[status];
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] ${styles}`}>{status}</span>;
}
