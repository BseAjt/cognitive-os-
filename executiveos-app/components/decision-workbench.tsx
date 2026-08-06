"use client";

import { useMemo, useState } from "react";
import type { DecisionFrame } from "@/lib/decision-room";
import { ScenarioBuilder } from "@/components/scenario-builder";
import { ExecutiveCouncil } from "@/components/executive-council";
import {
  answerContextItem,
  assessContext,
  buildAdaptiveQuestions,
  workforceRestructuringContextSeed,
  type ContextItem
} from "@/lib/context-engine";

interface DecisionWorkbenchProps {
  frame: DecisionFrame;
  onContextSubmit: (summary: string) => void;
  onCreateAction: (title: string) => void;
}

export function DecisionWorkbench({ frame, onContextSubmit, onCreateAction }: DecisionWorkbenchProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [contextItems, setContextItems] = useState<ContextItem[]>(() =>
    frame.category === "workforce_restructuring"
      ? workforceRestructuringContextSeed.map((item) => ({ ...item, caseId: frame.question }))
      : frame.missingInformation.map((label, index) => ({
          id: `generic-${index}`,
          caseId: frame.question,
          domain: "strategy",
          kind: "uncertainty",
          key: `generic_${index}`,
          label,
          value: "",
          confidence: 0,
          requirement: "required",
          status: "missing"
        }))
  );

  const assessment = useMemo(() => assessContext(contextItems), [contextItems]);
  const questions = useMemo(() => buildAdaptiveQuestions(contextItems), [contextItems]);
  const nextQuestion = questions[0];

  function updateItem(item: ContextItem, value: string) {
    setSaved(false);
    setContextItems((current) => current.map((candidate) => candidate.id === item.id ? answerContextItem(candidate, value) : candidate));
  }

  function submitContext() {
    const documented = contextItems.filter((item) => item.status === "verified" && item.value.trim());
    const lines = documented.map((item) => `[${item.domain}] ${item.label} : ${item.value}${item.unit ? ` ${item.unit}` : ""} · source ${item.source ?? "non précisée"} · confiance ${item.confidence}%`);
    onContextSubmit([
      `Dossier contextuel pour la décision « ${frame.question} ».`,
      `Préparation globale : ${assessment.readiness}%.`,
      `Recommandation autorisée : ${assessment.recommendationAllowed ? "oui" : "non"}.`,
      ...lines,
      assessment.missingRequired.length ? `Informations bloquantes : ${assessment.missingRequired.map((item) => item.label).join(", ")}.` : "Aucune information bloquante restante."
    ].join("\n"));
    setSaved(true);
  }

  return (
    <>
      <article className="executive-card mt-5 overflow-hidden">
        <div className="border-b border-white/10 bg-[#101b2f] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-black tracking-[.14em] text-[#ffbc57]">CONTEXT ENGINE · DECISION WORKBENCH</div>
              <h2 className="mt-2 text-2xl font-semibold">{frame.question}</h2>
              <p className="mt-2 text-sm text-[#91a2bd]">Le moteur distingue les faits, hypothèses, contraintes et incertitudes, puis bloque toute recommandation tant que les données obligatoires ne sont pas vérifiées.</p>
            </div>
            <div className="flex flex-wrap gap-2">{frame.classifications.map((classification) => <span key={classification} className="rounded-full border border-[#ffbc57]/30 bg-[#ffbc57]/10 px-3 py-1 text-xs text-[#ffd895]">{classification}</span>)}</div>
          </div>
          {frame.requiredAgents.length > 0 && <p className="mt-3 text-sm text-[#91a2bd]">Conseil mobilisé : {frame.requiredAgents.join(" · ")}</p>}
        </div>

        <div className="grid gap-5 p-5 xl:grid-cols-[.72fr_1.28fr]">
          <section className="grid content-start gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
              <div className="flex items-end justify-between"><div><span className="text-xs font-black tracking-[.12em] text-[#8d7ce4]">CONTEXT READINESS</span><strong className="mt-2 block text-4xl">{assessment.readiness}%</strong></div><span className={`rounded-full px-3 py-1 text-xs ${assessment.recommendationAllowed ? "bg-[#42d59d]/15 text-[#7aefc2]" : "bg-[#ff7185]/15 text-[#ff9dab]"}`}>{assessment.recommendationAllowed ? "Recommandation possible" : "Recommandation bloquée"}</span></div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5"><div className="h-full bg-[#7c5cff] transition-all" style={{ width: `${assessment.readiness}%` }}/></div>
            </div>

            <div className="grid gap-2">
              {assessment.domains.map((domain) => <div key={domain.domain} className="rounded-xl border border-white/10 bg-white/[.02] p-3"><div className="flex items-center justify-between"><span className="text-sm font-medium">{domain.label}</span><span className="text-xs text-[#91a2bd]">{domain.readiness}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full bg-[#42d59d]" style={{ width: `${domain.readiness}%` }}/></div>{domain.requiredMissing > 0 && <p className="mt-2 text-xs text-[#ff9dab]">{domain.requiredMissing} donnée(s) bloquante(s)</p>}</div>)}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
              <strong>Scénarios initiaux</strong>
              <div className="mt-3 grid gap-2">{frame.options.map((option, index) => <button key={option.title} onClick={() => setSelectedOption(index)} className={`rounded-xl border p-3 text-left ${selectedOption === index ? "border-[#7c5cff] bg-[#7c5cff]/12" : "border-white/10 bg-white/[.02]"}`}><div className="flex items-center justify-between gap-3"><span className="font-medium">{option.title}</span>{option.score !== null && <span className="text-xs">{option.score}/100</span>}</div><p className="mt-1 text-xs leading-5 text-[#91a2bd]">{option.description}</p></button>)}</div>
            </div>
          </section>

          <section>
            {nextQuestion && <div className="mb-4 rounded-2xl border border-[#7c5cff]/40 bg-[#7c5cff]/10 p-4"><div className="text-xs font-black tracking-[.12em] text-[#b6a7ff]">PROCHAINE QUESTION ADAPTATIVE</div><p className="mt-2 text-lg font-semibold">{nextQuestion.prompt}</p><p className="mt-1 text-xs text-[#aebbd0]">{nextQuestion.rationale}</p></div>}

            <div className="grid max-h-[760px] gap-3 overflow-auto pr-1">
              {contextItems.map((item) => <label key={item.id} className={`grid gap-2 rounded-2xl border p-4 ${item.status === "verified" ? "border-[#42d59d]/25 bg-[#42d59d]/5" : item.status === "contested" ? "border-[#ff7185]/35 bg-[#ff7185]/5" : "border-white/10 bg-white/[.02]"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2"><div><span className="text-sm font-medium">{item.label}</span><span className="ml-2 rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wide text-[#91a2bd]">{item.domain} · {item.kind}</span></div><span className={`text-xs ${item.requirement === "required" ? "text-[#ffbc57]" : "text-[#91a2bd]"}`}>{item.requirement} · {item.status}</span></div>
                <textarea value={item.value} onChange={(event) => updateItem(item, event.target.value)} placeholder={`Renseigner ${item.label.toLowerCase()}…`} className="min-h-20 resize-y rounded-xl border border-white/10 bg-[#0d1727] p-3 text-sm outline-none focus:border-[#7c5cff]"/>
                <div className="flex flex-wrap justify-between gap-2 text-[11px] text-[#91a2bd]"><span>Source : {item.source ?? "à documenter"}</span><span>Propriétaire : {item.owner ?? "à assigner"} · confiance {item.confidence}%</span></div>
              </label>)}
            </div>

            <div className="mt-4 flex flex-wrap gap-3"><button onClick={submitContext} className="executive-button executive-primary">{saved ? "Dossier enregistré" : "Enregistrer le dossier contextuel"}</button><button onClick={() => onCreateAction(selectedOption === null ? `Compléter les ${assessment.missingRequired.length} informations bloquantes` : `Instruire le scénario : ${frame.options[selectedOption].title}`)} className="executive-button executive-ghost">Créer la prochaine action</button></div>
            <p className="mt-4 text-xs leading-5 text-[#91a2bd]">Déclencheur de révision : {frame.reviewTrigger}</p>
          </section>
        </div>
      </article>

      <ScenarioBuilder frame={frame} contextItems={contextItems} readiness={assessment} onCreateAction={onCreateAction} />
      <ExecutiveCouncil frame={frame} contextItems={contextItems} readiness={assessment} onCreateAction={onCreateAction} />
    </>
  );
}
