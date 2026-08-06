"use client";

import { useMemo, useState } from "react";
import type { DecisionFrame } from "@/lib/decision-room";

interface DecisionWorkbenchProps {
  frame: DecisionFrame;
  onContextSubmit: (summary: string) => void;
  onCreateAction: (title: string) => void;
}

export function DecisionWorkbench({ frame, onContextSubmit, onCreateAction }: DecisionWorkbenchProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const completion = useMemo(() => {
    if (!frame.missingInformation.length) return 100;
    const completed = frame.missingInformation.filter((item) => answers[item]?.trim()).length;
    return Math.round((completed / frame.missingInformation.length) * 100);
  }, [answers, frame.missingInformation]);

  function submitContext() {
    const lines = frame.missingInformation
      .filter((item) => answers[item]?.trim())
      .map((item) => `${item} : ${answers[item].trim()}`);
    if (!lines.length) return;
    onContextSubmit(`Contexte documenté pour la décision « ${frame.question} » :\n${lines.join("\n")}`);
    setSaved(true);
  }

  return (
    <article className="executive-card mt-5 overflow-hidden">
      <div className="border-b border-white/10 bg-[#101b2f] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black tracking-[.14em] text-[#ffbc57]">DECISION WORKBENCH</div>
            <h2 className="mt-2 text-2xl font-semibold">{frame.question}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {frame.classifications.map((classification) => (
              <span key={classification} className="rounded-full border border-[#ffbc57]/30 bg-[#ffbc57]/10 px-3 py-1 text-xs text-[#ffd895]">{classification}</span>
            ))}
          </div>
        </div>
        {frame.requiredAgents.length > 0 && (
          <p className="mt-3 text-sm text-[#91a2bd]">Conseil mobilisé : {frame.requiredAgents.join(" · ")}</p>
        )}
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[.9fr_1.1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Scénarios à instruire</h3>
            <span className="text-xs text-[#91a2bd]">Sélection provisoire</span>
          </div>
          <div className="grid gap-3">
            {frame.options.map((option, index) => (
              <button
                key={option.title}
                onClick={() => setSelectedOption(index)}
                className={`rounded-2xl border p-4 text-left transition ${selectedOption === index ? "border-[#7c5cff] bg-[#7c5cff]/12" : "border-white/10 bg-white/[.025] hover:border-white/20"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <strong>{option.title}</strong>
                  {option.score !== null && <span className="rounded-full bg-white/5 px-2 py-1 text-xs">{option.score}/100</span>}
                </div>
                <p className="mt-2 text-sm leading-6 text-[#aebbd0]">{option.description}</p>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.025] p-4">
            <strong>Position du moteur</strong>
            <p className="mt-2 text-sm leading-6 text-[#aebbd0]">
              {frame.recommendation ?? "Aucune recommandation n’est formulée tant que le contexte requis n’est pas documenté."}
            </p>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Contexte nécessaire</h3>
            <span className="text-xs text-[#91a2bd]">{completion}% complété</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div className="h-full bg-[#7c5cff] transition-all" style={{ width: `${completion}%` }} />
          </div>

          <div className="mt-4 grid max-h-[520px] gap-3 overflow-auto pr-1">
            {frame.missingInformation.map((item) => (
              <label key={item} className="grid gap-2 rounded-2xl border border-white/10 bg-white/[.02] p-3">
                <span className="text-sm font-medium">{item}</span>
                <textarea
                  value={answers[item] ?? ""}
                  onChange={(event) => setAnswers((current) => ({ ...current, [item]: event.target.value }))}
                  placeholder="Saisir les éléments connus…"
                  className="min-h-20 resize-y rounded-xl border border-white/10 bg-[#0d1727] p-3 text-sm outline-none focus:border-[#7c5cff]"
                />
              </label>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={submitContext} disabled={completion === 0} className="executive-button executive-primary disabled:cursor-not-allowed disabled:opacity-40">
              {saved ? "Contexte enregistré" : "Enregistrer le contexte"}
            </button>
            <button
              onClick={() => onCreateAction(selectedOption === null ? "Compléter le dossier de décision" : `Instruire le scénario : ${frame.options[selectedOption].title}`)}
              className="executive-button executive-ghost"
            >
              Créer une action
            </button>
          </div>

          <p className="mt-4 text-xs leading-5 text-[#91a2bd]">Déclencheur de révision : {frame.reviewTrigger}</p>
        </section>
      </div>
    </article>
  );
}
