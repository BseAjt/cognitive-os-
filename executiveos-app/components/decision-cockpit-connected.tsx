"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { DecisionFrame } from "@/lib/decision-room";
import type { ContextItem, ContextReadiness } from "@/lib/context-engine";
import { buildScenarioPortfolio } from "@/lib/scenario-builder";
import { conveneExecutiveCouncil } from "@/lib/executive-council";
import { buildDecisionCockpit, serializeDecisionRecord } from "@/lib/decision-cockpit";

interface Props {
  frame: DecisionFrame;
  contextItems: ContextItem[];
  readiness: ContextReadiness;
  onRecord: (summary: string) => void;
  onCreateAction: (title: string) => void;
}

export function ConnectedDecisionCockpit({ frame, contextItems, readiness, onRecord, onCreateAction }: Props) {
  const portfolio = useMemo(() => buildScenarioPortfolio(frame, contextItems, readiness), [frame, contextItems, readiness]);
  const council = useMemo(() => conveneExecutiveCouncil(contextItems, readiness, portfolio), [contextItems, readiness, portfolio]);
  const [selectedScenarioId, setSelectedScenarioId] = useState(portfolio.recommendedScenarioId ?? portfolio.scenarios[0]?.id ?? null);
  const [rationale, setRationale] = useState("Privilégier une trajectoire réversible tout en protégeant les compétences critiques et la continuité client.");
  const [owner, setOwner] = useState("CEO");
  const [deadline, setDeadline] = useState("2026-09-30");
  const [saved, setSaved] = useState(false);
  const cockpit = useMemo(() => buildDecisionCockpit(readiness, portfolio, council, selectedScenarioId), [readiness, portfolio, council, selectedScenarioId]);
  const selected = portfolio.scenarios.find((scenario) => scenario.id === selectedScenarioId);

  function save() {
    if (!selected) return;
    onRecord(serializeDecisionRecord(frame.question, cockpit, selected.title, rationale, owner, deadline));
    setSaved(true);
  }

  return <article className="executive-card mt-5 overflow-hidden">
    <div className="border-b border-white/10 bg-[#12172a] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-xs font-black tracking-[.14em] text-[#ffbc57]">DECISION COCKPIT</div><h2 className="mt-2 text-2xl font-semibold">Arbitrer, décider et rendre la décision révisable</h2><p className="mt-2 text-sm text-[#91a2bd]">Vue consolidée du contexte, des scénarios, des avis du Conseil et des mécanismes de révision.</p></div><span className={`rounded-full px-3 py-1 text-xs ${cockpit.decisionAllowed ? "bg-[#42d59d]/15 text-[#7aefc2]" : "bg-[#ff7185]/15 text-[#ff9dab]"}`}>{cockpit.decisionAllowed ? "Prêt à décider" : "Décision bloquée"}</span></div></div>
    <div className="grid gap-5 p-5 xl:grid-cols-[.8fr_1.2fr]">
      <section className="grid content-start gap-4">
        <div className="grid grid-cols-3 gap-3"><Metric label="Contexte" value={`${cockpit.readiness}%`} /><Metric label="Consensus" value={`${cockpit.consensus}%`} /><Metric label="Statut" value={cockpit.status} /></div>
        <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4"><strong>Gates de décision</strong><div className="mt-3 grid gap-2">{cockpit.gates.map((gate) => <div key={gate.id} className="rounded-xl border border-white/10 p-3"><div className="flex justify-between gap-3"><span className="font-medium">{gate.label}</span><span className={`text-xs ${gate.status === "passed" ? "text-[#7aefc2]" : gate.status === "warning" ? "text-[#ffd895]" : "text-[#ff9dab]"}`}>{gate.status}</span></div><p className="mt-1 text-xs leading-5 text-[#91a2bd]">{gate.detail}</p></div>)}</div></div>
        <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4"><strong>Scénario à arbitrer</strong><div className="mt-3 grid gap-2">{portfolio.scenarios.map((scenario) => <button key={scenario.id} onClick={() => { setSelectedScenarioId(scenario.id); setSaved(false); }} className={`rounded-xl border p-3 text-left ${selectedScenarioId === scenario.id ? "border-[#ffbc57]/60 bg-[#ffbc57]/8" : "border-white/10"}`}><span className="font-medium">{scenario.title}</span><span className="ml-2 text-xs text-[#91a2bd]">{scenario.score === null ? "non scoré" : `${scenario.score}/100`}</span></button>)}</div></div>
      </section>
      <section className="grid content-start gap-4">
        <div className="grid gap-3 md:grid-cols-2"><label className="grid gap-2 text-sm">Décideur<input value={owner} onChange={(event) => setOwner(event.target.value)} className="rounded-xl border border-white/10 bg-[#0d1727] p-3" /></label><label className="grid gap-2 text-sm">Échéance<input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="rounded-xl border border-white/10 bg-[#0d1727] p-3" /></label></div>
        <label className="grid gap-2 text-sm">Rationale du dirigeant<textarea value={rationale} onChange={(event) => { setRationale(event.target.value); setSaved(false); }} className="min-h-28 rounded-xl border border-white/10 bg-[#0d1727] p-3" /></label>
        <div className="grid gap-4 lg:grid-cols-2"><Panel title="Conditions">{cockpit.conditions.map((item) => <span key={item}>• {item}</span>)}</Panel><Panel title="Opinions dissidentes">{cockpit.dissentingViews.length ? cockpit.dissentingViews.map((item) => <span key={item}>• {item}</span>) : <span>Aucune objection bloquante.</span>}</Panel></div>
        <div className="rounded-2xl border border-white/10 p-4"><strong>Déclencheurs de révision</strong><div className="mt-3 grid gap-2 md:grid-cols-2">{cockpit.reviewTriggers.map((trigger) => <div key={trigger.id} className="rounded-xl bg-white/[.03] p-3 text-sm"><span className="font-medium">{trigger.label}</span><p className="mt-1 text-xs text-[#91a2bd]">{trigger.metric} · {trigger.operator} {trigger.threshold} · {trigger.owner}</p></div>)}</div></div>
        <div className="rounded-2xl border border-white/10 p-4"><strong>Indicateurs de résultat</strong><div className="mt-3 grid gap-2">{cockpit.outcomeMetrics.map((metric) => <div key={metric.label} className="flex justify-between gap-4 rounded-xl bg-white/[.03] p-3 text-sm"><span>{metric.label}</span><span className="text-right text-[#91a2bd]">{metric.target} · {metric.owner}</span></div>)}</div></div>
        <div className="rounded-2xl border border-[#ffbc57]/30 bg-[#ffbc57]/5 p-4"><strong>Position du cockpit</strong><p className="mt-2 text-sm leading-6 text-[#d6dfed]">{cockpit.rationale}</p><div className="mt-4 flex flex-wrap gap-3"><button onClick={save} className="executive-button executive-primary">{saved ? "Dossier enregistré" : cockpit.decisionAllowed ? "Enregistrer la décision" : "Enregistrer le brouillon"}</button><button onClick={() => onCreateAction(cockpit.decisionAllowed ? `Exécuter la décision : ${selected?.title}` : "Lever les gates bloquants du Decision Cockpit")} className="executive-button executive-ghost">Créer le plan de suivi</button></div></div>
      </section>
    </div>
  </article>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-white/[.02] p-3"><span className="block text-xs text-[#91a2bd]">{label}</span><strong className="mt-1 block text-lg">{value}</strong></div>; }
function Panel({ title, children }: { title: string; children: ReactNode }) { return <div className="rounded-2xl border border-white/10 p-4"><strong>{title}</strong><div className="mt-3 grid gap-2 text-sm text-[#aebbd0]">{children}</div></div>; }
