"use client";

import { useEffect, useState } from "react";

const GUIDE_KEY = "executiveos:ceo-guide:v1";

const STEPS = [
  { eyebrow: "1 · Un sujet = un dossier", title: "Commence par la décision qui compte", text: "Crée un dossier pour une question importante : recrutement, financement, lancement produit ou priorité commerciale. Tout le contexte restera au même endroit." },
  { eyebrow: "2 · Ton point de départ", title: "Lis seulement le brief du jour", text: "La vue Aujourd’hui te montre la situation, le point d’attention et la prochaine action. Tu n’as pas besoin d’ouvrir tous les modules." },
  { eyebrow: "3 · Ton copilote", title: "Demande un arbitrage à ORION", text: "Explique la décision à prendre comme tu le ferais à un associé. ORION structure les options, les risques et les actions sans te demander de maîtriser l’outil." },
  { eyebrow: "4 · Passage à l’action", title: "Décide, puis exécute", text: "Utilise Décider pour arbitrer et Agir pour suivre les responsabilités. Les sources, la mémoire et l’historique restent disponibles dans Plus." }
];

export function ExecutiveGuide() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!window.localStorage.getItem(GUIDE_KEY)) setOpen(true);
    function showGuide() { setStep(0); setOpen(true); }
    window.addEventListener("executiveos:show-guide", showGuide);
    return () => window.removeEventListener("executiveos:show-guide", showGuide);
  }, []);

  function close() {
    window.localStorage.setItem(GUIDE_KEY, "done");
    setOpen(false);
  }

  if (!open) return null;
  const current = STEPS[step];
  return <div role="dialog" aria-modal="true" aria-labelledby="guide-title" className="fixed inset-0 z-[100] grid place-items-end bg-black/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-6">
    <div className="w-full rounded-t-[30px] bg-[#fffefa] p-6 shadow-2xl sm:max-w-xl sm:rounded-[30px] sm:p-8">
      <div className="flex items-start justify-between gap-4"><span className="rounded-full bg-[#0568c9]/10 px-3 py-1 text-xs font-bold text-[#0568c9]">Guide du dirigeant · {step + 1}/{STEPS.length}</span><button onClick={close} aria-label="Fermer le guide" className="grid size-10 place-items-center rounded-full border border-black/10 text-xl">×</button></div>
      <div className="mt-8 text-xs font-black uppercase tracking-[.16em] text-[#0568c9]">{current.eyebrow}</div>
      <h2 id="guide-title" className="mt-3 text-3xl font-semibold tracking-[-.035em]">{current.title}</h2>
      <p className="mt-4 text-base leading-7 text-[#55585e]">{current.text}</p>
      <div className="mt-8 flex items-center justify-between gap-3"><div className="flex gap-1.5" aria-hidden="true">{STEPS.map((_, index) => <span key={index} className={`h-1.5 rounded-full ${index === step ? "w-8 bg-[#0568c9]" : "w-2 bg-black/15"}`}/>)}</div>{step < STEPS.length - 1 ? <button onClick={() => setStep(step + 1)} className="executive-button executive-primary">Suivant →</button> : <button onClick={close} className="executive-button executive-primary">Commencer</button>}</div>
    </div>
  </div>;
}

export function InfoTip({ label }: { label: string }) {
  return <span className="info-tip" tabIndex={0} aria-label={`Aide : ${label}`}><span aria-hidden="true">i</span><span role="tooltip">{label}</span></span>;
}
