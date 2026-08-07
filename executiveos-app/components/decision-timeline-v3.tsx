"use client";

import { useMemo, useState } from "react";
import { useExecutiveStore, type ReasoningRevision, type ReasoningStepId } from "@/store/executive-store";
import type { ActionItem, Challenge, Decision } from "@/types/domain";

type TimelineEvent = {
  id: string;
  kind: "revision" | "decision" | "action";
  stepId: ReasoningStepId;
  title: string;
  detail: string;
  createdAt: string;
  confidence?: number;
  risk?: number;
  stepVersion?: number;
};

type DecisionTimelineProps = {
  challenge: Challenge;
  decisions: Decision[];
  actions: ActionItem[];
  activeStepId: ReasoningStepId;
  onStepSelect: (stepId: ReasoningStepId) => void;
};

const STEP_LABELS: Record<ReasoningStepId, string> = {
  question: "Question",
  hypothesis: "Hypothèse",
  evidence: "Preuves",
  options: "Options",
  objections: "Objections",
  decision: "Décision",
  consequences: "Conséquences"
};

export function DecisionTimelineV3({ challenge, decisions, actions, activeStepId, onStepSelect }: DecisionTimelineProps) {
  const revisions = useExecutiveStore((state) => state.reasoningRevisions).filter((item) => item.challengeId === challenge.id);

  const events = useMemo<TimelineEvent[]>(() => {
    const revisionEvents: TimelineEvent[] = revisions.map((revision) => ({
      id: revision.id,
      kind: "revision",
      stepId: revision.stepId,
      title: `${STEP_LABELS[revision.stepId]} révisée`,
      detail: revision.content,
      createdAt: revision.createdAt,
      confidence: revision.confidence,
      risk: revision.risk,
      stepVersion: revision.version + 1
    }));

    const decisionEvents: TimelineEvent[] = decisions.map((decision) => ({
      id: decision.id,
      kind: "decision",
      stepId: "decision",
      title: "Décision enregistrée",
      detail: decision.finalDecision,
      createdAt: decision.createdAt,
      confidence: decision.confidence
    }));

    const actionEvents: TimelineEvent[] = actions.map((action, index) => ({
      id: action.id,
      kind: "action",
      stepId: "consequences",
      title: action.status === "done" ? "Conséquence exécutée" : "Action issue de la décision",
      detail: `${action.title} · ${action.owner} · ${action.status}`,
      createdAt: new Date(Date.now() - (actions.length - index) * 1000).toISOString()
    }));

    return [...revisionEvents, ...decisionEvents, ...actionEvents].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [actions, decisions, revisions]);

  const [selectedIndex, setSelectedIndex] = useState<number>(Math.max(0, events.length - 1));
  const safeIndex = Math.min(selectedIndex, Math.max(0, events.length - 1));
  const selected = events[safeIndex];
  const previous = safeIndex > 0 ? events[safeIndex - 1] : undefined;

  function select(index: number) {
    setSelectedIndex(index);
    const event = events[index];
    if (event) onStepSelect(event.stepId);
  }

  if (!events.length) {
    return (
      <section className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/82 p-5 md:p-6">
        <div className="text-[10px] font-black uppercase tracking-[.18em] text-[#8fb7ff]">Decision Timeline · UX3.3</div>
        <h2 className="mt-2 text-2xl font-semibold">L’histoire de la décision apparaîtra ici.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#8192ab]">Ajoute une révision au Reasoning Flow ou enregistre une décision : ExecutiveOS construira automatiquement une chronologie rejouable.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/82 p-5 md:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-[#8fb7ff]">Decision Timeline · UX3.3</div>
          <h2 className="mt-2 text-2xl font-semibold">Rejouer l’évolution de la décision</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8192ab]">Chaque événement est relié au Reasoning Flow. Sélectionner une version remet en évidence l’étape du raisonnement qui a changé.</p>
        </div>
        <div className="rounded-full border border-white/[.07] bg-white/[.025] px-3 py-1.5 font-mono text-xs text-[#91a2bd]">v{safeIndex + 1} / {events.length}</div>
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="flex min-w-max items-center gap-2">
          {events.map((event, index) => (
            <div key={event.id} className="flex items-center gap-2">
              <button onClick={() => select(index)} className={`min-w-[118px] rounded-2xl border px-3 py-3 text-left transition ${index === safeIndex ? "border-[#8f82ff]/45 bg-[#7c5cff]/10 ring-2 ring-[#7c5cff]/20" : event.stepId === activeStepId ? "border-[#8fb7ff]/25 bg-[#8fb7ff]/[.05]" : "border-white/[.07] bg-white/[.02] hover:bg-white/[.04]"}`}>
                <div className="flex items-center justify-between gap-2"><span className="font-mono text-[10px] text-[#667995]">v{index + 1}</span><span className="text-[9px] uppercase tracking-[.11em] text-[#8293ab]">{STEP_LABELS[event.stepId]}</span></div>
                <div className="mt-2 text-xs font-semibold text-[#dce4ef]">{event.title}</div>
                <div className="mt-1 text-[10px] text-[#5f718c]">{formatDate(event.createdAt)}</div>
              </button>
              {index < events.length - 1 && <span className="text-[#465873]">→</span>}
            </div>
          ))}
        </div>
      </div>

      <input aria-label="Version de la timeline" type="range" min={0} max={events.length - 1} value={safeIndex} onChange={(event) => select(Number(event.target.value))} className="mt-5 w-full accent-[#7c5cff]" />

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
        <article className="rounded-2xl border border-white/[.07] bg-[#091422] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#9d83ff]">Version sélectionnée · v{safeIndex + 1}</div><h3 className="mt-2 text-xl font-semibold">{selected.title}</h3></div><span className="rounded-full bg-white/[.04] px-2.5 py-1 text-[10px] uppercase tracking-[.12em] text-[#91a2bd]">{STEP_LABELS[selected.stepId]}</span></div>
          <p className="mt-4 text-sm leading-7 text-[#a7b4c6]">{selected.detail}</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-3"><Snapshot label="Confiance" value={selected.confidence !== undefined ? `${selected.confidence}%` : "—"}/><Snapshot label="Risque" value={selected.risk !== undefined ? `${selected.risk}/10` : "—"}/><Snapshot label="Version étape" value={selected.stepVersion ? `v${selected.stepVersion}` : "—"}/></div>
          <button onClick={() => onStepSelect(selected.stepId)} className="mt-5 rounded-xl border border-[#7c5cff]/30 bg-[#7c5cff]/10 px-4 py-2.5 text-sm font-semibold text-[#c8beff]">Ouvrir dans le Reasoning Flow ↑</button>
        </article>

        <article className="rounded-2xl border border-white/[.07] bg-[#091422] p-5">
          <div className="text-[10px] font-black uppercase tracking-[.14em] text-[#42d59d]">Diff · {previous ? `v${safeIndex} → v${safeIndex + 1}` : "état initial"}</div>
          {previous ? <VersionDiff previous={previous} current={selected} /> : <p className="mt-4 text-sm leading-6 text-[#71839e]">Premier événement disponible : il sert de point de départ à l’historique rejouable.</p>}
        </article>
      </div>
    </section>
  );
}

function VersionDiff({ previous, current }: { previous: TimelineEvent; current: TimelineEvent }) {
  const sameStep = previous.stepId === current.stepId;
  const confidenceDelta = previous.confidence !== undefined && current.confidence !== undefined ? current.confidence - previous.confidence : undefined;
  const riskDelta = previous.risk !== undefined && current.risk !== undefined ? current.risk - previous.risk : undefined;
  return <div className="mt-4 space-y-3 text-sm">
    <DiffLine sign="+" text={sameStep ? `Nouvelle version de ${STEP_LABELS[current.stepId]}` : `Nouvel événement : ${current.title}`} tone="good" />
    {!sameStep && <DiffLine sign="≈" text={`${STEP_LABELS[previous.stepId]} → ${STEP_LABELS[current.stepId]}`} tone="neutral" />}
    {confidenceDelta !== undefined && confidenceDelta !== 0 && <DiffLine sign={confidenceDelta > 0 ? "+" : "−"} text={`Confiance ${previous.confidence}% → ${current.confidence}% (${confidenceDelta > 0 ? "+" : ""}${confidenceDelta})`} tone={confidenceDelta > 0 ? "good" : "watch"} />}
    {riskDelta !== undefined && riskDelta !== 0 && <DiffLine sign={riskDelta < 0 ? "+" : "!"} text={`Risque ${previous.risk}/10 → ${current.risk}/10 (${riskDelta > 0 ? "+" : ""}${riskDelta})`} tone={riskDelta < 0 ? "good" : "watch"} />}
    <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3"><div className="text-[10px] font-black uppercase tracking-[.12em] text-[#667995]">Pourquoi cela a changé</div><p className="mt-2 text-xs leading-5 text-[#a6b3c5]">{current.detail}</p></div>
  </div>;
}

function DiffLine({ sign, text, tone }: { sign:string; text:string; tone:"good"|"watch"|"neutral" }) {
  const color = tone === "good" ? "text-[#7de5bd]" : tone === "watch" ? "text-[#ffd895]" : "text-[#9fb0c7]";
  return <div className="flex items-start gap-3 rounded-xl border border-white/[.06] bg-white/[.02] p-3"><span className={`font-mono font-bold ${color}`}>{sign}</span><span className="text-[#c4cfdd]">{text}</span></div>;
}

function Snapshot({ label, value }: { label:string; value:string }) { return <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3"><span className="block text-[10px] uppercase tracking-[.1em] text-[#667995]">{label}</span><strong className="mt-1 block text-sm text-[#dce4ef]">{value}</strong></div>; }

function formatDate(value: string) { return new Date(value).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }); }
