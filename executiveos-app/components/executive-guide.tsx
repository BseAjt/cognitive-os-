"use client";

import { useEffect, useState } from "react";

const GUIDE_KEY = "executiveos:ceo-guide:v1";
const INVESTOR_GUIDE_KEY = "executiveos:investor-guide:v1";

const GLOSSARY = [
  ["Dossier cognitif", "Un sujet de décision suivi de la question initiale jusqu’au résultat et aux enseignements."],
  ["Brief vivant", "La synthèse à jour du dossier : situation, tension principale, recommandation et prochaine action."],
  ["Confiance", "Le degré de solidité estimé d’une décision au regard des faits, hypothèses et incertitudes disponibles."],
  ["Décision à rouvrir", "Une décision dont une hypothèse, une échéance ou un signal a changé et qui mérite un nouvel arbitrage."],
  ["Calibration", "La capacité à faire correspondre le niveau de confiance annoncé avec les résultats réellement observés."],
  ["Stabilité", "La cohérence des convictions dans le temps. Un changement justifié par de nouvelles preuves est positif."],
  ["Discipline du risque", "La qualité du suivi des risques, conditions d’arrêt et points de réévaluation."],
  ["Mémoire durable", "Les faits, décisions et apprentissages conservés pour ne pas recommencer le raisonnement à zéro."],
  ["Assistant de décision", "Le copilote de décision qui structure le contexte, confronte les options et propose une prochaine action."],
] as const;

const STEPS = [
  { eyebrow: "1 · Un sujet = un dossier", title: "Commence par la décision qui compte", text: "Crée un dossier pour une question importante : recrutement, financement, lancement produit ou priorité commerciale. Tout le contexte restera au même endroit." },
  { eyebrow: "2 · Ton point de départ", title: "Lis seulement le brief du jour", text: "La vue Aujourd’hui te montre la situation, le point d’attention et la prochaine action. Tu n’as pas besoin d’ouvrir tous les modules." },
  { eyebrow: "3 · Ton copilote", title: "Demande un arbitrage à Assistant de décision", text: "Explique la décision à prendre comme tu le ferais à un associé. Assistant de décision structure les options, les risques et les actions sans te demander de maîtriser l’outil." },
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

const INVESTOR_STEPS = [
  { eyebrow: "1 · Vue portefeuille", title: "Commence par les sociétés qui demandent ton attention", text: "La synthèse fait remonter les risques, décisions à rouvrir et engagements importants avant les détails opérationnels." },
  { eyebrow: "2 · Signaux vérifiables", title: "Distingue les faits des hypothèses", text: "Chaque recommandation reste reliée à ses sources, à son niveau de confiance et à la date où elle devra être réévaluée." },
  { eyebrow: "3 · Suivi de participation", title: "Ouvre une société pour comprendre sa trajectoire", text: "Tu retrouves les décisions du dirigeant, leur exécution et les changements de contexte sans entrer dans son pilotage quotidien." },
  { eyebrow: "4 · Préparation des comités", title: "Transforme les alertes en questions de board", text: "Assistant de décision rassemble les écarts, risques et engagements afin de préparer une revue ou un comité d’investissement." }
];

export function InvestorGuide() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!window.localStorage.getItem(INVESTOR_GUIDE_KEY)) setOpen(true);
    function showGuide() { setStep(0); setOpen(true); }
    window.addEventListener("executiveos:show-investor-guide", showGuide);
    return () => window.removeEventListener("executiveos:show-investor-guide", showGuide);
  }, []);

  function close() { window.localStorage.setItem(INVESTOR_GUIDE_KEY, "done"); setOpen(false); }
  if (!open) return null;
  const current = INVESTOR_STEPS[step];
  return <div role="dialog" aria-modal="true" aria-labelledby="investor-guide-title" className="fixed inset-0 z-[100] grid place-items-end bg-black/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-6">
    <div className="w-full rounded-t-[30px] bg-[#fffefa] p-6 text-[#1d1d1f] shadow-2xl sm:max-w-xl sm:rounded-[30px] sm:p-8">
      <div className="flex items-start justify-between gap-4"><span className="rounded-full bg-[#0568c9]/10 px-3 py-1 text-xs font-bold text-[#0568c9]">Guide de l’investisseur · {step + 1}/{INVESTOR_STEPS.length}</span><button onClick={close} aria-label="Fermer le guide investisseur" className="grid size-10 place-items-center rounded-full border border-black/10 text-xl">×</button></div>
      <div className="mt-8 text-xs font-black uppercase tracking-[.16em] text-[#0568c9]">{current.eyebrow}</div><h2 id="investor-guide-title" className="mt-3 text-3xl font-semibold tracking-[-.035em]">{current.title}</h2><p className="mt-4 text-base leading-7 text-[#55585e]">{current.text}</p>
      <div className="mt-8 flex items-center justify-between gap-3"><div className="flex gap-1.5" aria-hidden="true">{INVESTOR_STEPS.map((_, index) => <span key={index} className={`h-1.5 rounded-full ${index === step ? "w-8 bg-[#0568c9]" : "w-2 bg-black/15"}`}/>)}</div>{step < INVESTOR_STEPS.length - 1 ? <button onClick={() => setStep(step + 1)} className="executive-button executive-primary">Suivant →</button> : <button onClick={close} className="executive-button executive-primary">Voir mon portefeuille</button>}</div>
    </div>
  </div>;
}

export function InfoTip({ label }: { label: string }) {
  return <span className="info-tip" tabIndex={0} role="button" aria-label={`Aide : ${label}`} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}><span aria-hidden="true">i</span><span role="tooltip">{label}</span></span>;
}

export function HelpCenter({ profile }: { profile: "executive" | "investor" }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"start" | "glossary">("start");
  useEffect(() => {
    function showHelp() { setOpen(true); }
    window.addEventListener("executiveos:show-help", showHelp);
    return () => window.removeEventListener("executiveos:show-help", showHelp);
  }, []);
  if (!open) return null;
  const executiveSteps = ["Crée un dossier pour une décision réelle.", "Lis le brief Aujourd’hui et son centre d’attention.", "Utilise Arbitrer avec Assistant de décision, puis formalise la décision.", "Passe dans Exécuter et consigne le résultat dans Apprendre."];
  const investorSteps = ["Commence par les alertes du portefeuille.", "Ouvre une participation pour vérifier sa trajectoire.", "Distingue les faits des hypothèses et contrôle la confiance.", "Transforme les écarts en questions de board ou en décision à rouvrir."];
  const steps = profile === "executive" ? executiveSteps : investorSteps;
  return <div role="dialog" aria-modal="true" aria-labelledby="help-title" className="fixed inset-0 z-[110] grid place-items-end bg-black/55 backdrop-blur-sm sm:place-items-center sm:p-6">
    <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[30px] bg-[#fffefa] p-5 text-[#1d1d1f] shadow-2xl sm:max-w-2xl sm:rounded-[30px] sm:p-8">
      <div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#0568c9]">Documentation contextuelle</div><h2 id="help-title" className="mt-2 text-3xl font-semibold tracking-[-.035em]">Aide ExecutiveOS</h2><p className="mt-2 text-sm text-[#62666d]">Des réponses courtes, adaptées au profil {profile === "executive" ? "dirigeant" : "investisseur"}.</p></div><button onClick={() => setOpen(false)} aria-label="Fermer l’aide" className="grid size-10 shrink-0 place-items-center rounded-full border border-black/10 text-xl">×</button></div>
      <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-black/[.045] p-1"><button aria-pressed={tab === "start"} onClick={() => setTab("start")} className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${tab === "start" ? "bg-white shadow-sm" : "text-[#6e6e73]"}`}>Bien démarrer</button><button aria-pressed={tab === "glossary"} onClick={() => setTab("glossary")} className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${tab === "glossary" ? "bg-white shadow-sm" : "text-[#6e6e73]"}`}>Glossaire</button></div>
      {tab === "start" ? <div className="mt-6 space-y-3">{steps.map((item, index) => <div key={item} className="flex gap-4 rounded-2xl border border-black/[.08] bg-white/70 p-4"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#0568c9] text-xs font-bold text-white">{index + 1}</span><p className="text-sm leading-6">{item}</p></div>)}<button onClick={() => { setOpen(false); window.dispatchEvent(new CustomEvent(profile === "executive" ? "executiveos:show-guide" : "executiveos:show-investor-guide")); }} className="mt-2 w-full rounded-xl bg-[#0568c9] px-4 py-3 text-sm font-bold text-white">Lancer le didacticiel complet</button></div> : <div className="mt-6 divide-y divide-black/[.07]">{GLOSSARY.map(([term, definition]) => <div key={term} className="py-4"><strong className="text-sm">{term}</strong><p className="mt-1 text-sm leading-6 text-[#62666d]">{definition}</p></div>)}</div>}
    </div>
  </div>;
}
