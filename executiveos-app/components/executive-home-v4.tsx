"use client";

import { useEffect, useMemo, useState } from "react";
import { ExecutiveRuntimePanel } from "@/components/executive-runtime-panel";
import { ExecutiveWorkspace } from "@/components/executive-workspace";
import { ContextIngestionPanel } from "@/components/context-ingestion-panel";
import { IntegrationFabricPanel } from "@/components/integration-fabric-panel";
import { InvestorDemoDashboard } from "@/components/investor-demo-dashboard";
import { CollaborationPanel } from "@/components/collaboration-panel";
import { ProductControlCenter } from "@/components/product-control-center";
import { StrategyStudio } from "@/components/strategy-studio";
import { ExecutiveGuide, HelpCenter, InfoTip, InvestorGuide } from "@/components/executive-guide";
import { buildCognitiveRecall } from "@/lib/cognitive-recall";
import { buildExecutiveCaseBrief } from "@/lib/executive-brief";
import { buildCaseJourney, resolveEventDestination } from "@/lib/outcome-navigation";
import { runUnifiedRuntime } from "@/lib/unified-runtime";
import { useExecutiveStore } from "@/store/executive-store";
import type { CognitiveCase, CognitiveEventRecord } from "@/domain/canonical";

type ShellView = "dossiers" | "case" | "settings";
type UserProfile = "executive" | "investor";
type WorkspaceSection = "overview" | "context" | "strategy" | "analysis" | "execution" | "learning" | "history";

const WORKSPACE_SECTIONS: Array<{ id: WorkspaceSection; label: string; help: string }> = [
  { id: "overview", label: "Aujourd’hui", help: "Le résumé utile pour savoir où concentrer ton attention maintenant." },
  { id: "analysis", label: "Arbitrer", help: "Échanger avec ORION, comparer les options et formaliser une décision." },
  { id: "execution", label: "Exécuter", help: "Transformer la décision en responsabilités, échéances et résultats." },
  { id: "learning", label: "Apprendre", help: "Capitaliser ce qui a fonctionné et réutiliser les enseignements." }
];

const ADVANCED_SECTIONS: Array<{ id: WorkspaceSection; label: string }> = [
  { id: "context", label: "Sources & contexte" }, { id: "strategy", label: "Strategy Studio" }, { id: "history", label: "Historique" }
];

export function ExecutiveHomeV4() {
  const store = useExecutiveStore();
  const [shell, setShell] = useState<ShellView>("dossiers");
  const [prompt, setPrompt] = useState("");
  const [search, setSearch] = useState("");
  const [profile, setProfile] = useState<UserProfile>("executive");
  const activeCase = store.cases.find((item) => item.id === store.activeCaseId) ?? store.cases[0];

  useEffect(() => {
    const saved = window.localStorage.getItem("executiveos:user-profile:v1");
    if (saved === "investor" || saved === "executive") setProfile(saved);
  }, []);

  function changeProfile(next: UserProfile) {
    setProfile(next);
    setShell("dossiers");
    window.localStorage.setItem("executiveos:user-profile:v1", next);
    if (next === "investor" && store.demoMode !== "investor") store.loadInvestorDemo();
  }

  function openCase(id: string) {
    store.setActiveCase(id);
    setShell("case");
  }

  function submit() {
    const clean = prompt.trim();
    if (!clean || !activeCase) return;
    const recall = buildCognitiveRecall({
      cognitiveCase: activeCase,
      decisions: store.decisions,
      actions: store.actions,
      memories: store.memories,
      reasoningRevisions: store.reasoningRevisions,
      knowledgeEntities: store.knowledgeEntities,
      knowledgeRelations: store.knowledgeRelations,
      agentRuns: store.agentRuns
    });
    const sourceContext = store.contextSyntheses.find((item) => item.caseId === activeCase.id)?.summary;
    const result = runUnifiedRuntime({
      message: clean,
      cognitiveCase: activeCase,
      agents: store.agents,
      memories: store.memories.filter((memory) => memory.caseId === activeCase.id),
      knowledgeRecords: store.knowledgeRecords.filter((record) => record.caseId === activeCase.id),
      recallSummary: sourceContext ? `${recall.summary}\n\nCONTEXTE SOURCÉ\n${sourceContext}` : recall.summary
    });
    store.applyRuntimeCycle({ caseId: activeCase.id, userText: clean, result });
    setPrompt("");
    setShell("case");
    requestAnimationFrame(() => window.dispatchEvent(new CustomEvent("executiveos:open-analysis")));
  }

  const searchResults = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    if (query.length < 2) return [];
    const results: Array<{ id: string; caseId: string; kind: string; title: string; detail: string }> = [];
    for (const item of store.cases) if (`${item.title} ${item.objective} ${item.context}`.toLocaleLowerCase("fr").includes(query)) results.push({ id: `case:${item.id}`, caseId: item.id, kind: "Dossier", title: item.title, detail: item.objective });
    for (const item of store.decisions) if (`${item.outcome} ${item.rationale}`.toLocaleLowerCase("fr").includes(query)) results.push({ id: `decision:${item.id}`, caseId: item.caseId, kind: "Décision", title: item.outcome, detail: item.rationale });
    for (const item of store.actions) if (`${item.title} ${item.owner} ${item.result ?? ""}`.toLocaleLowerCase("fr").includes(query)) results.push({ id: `action:${item.id}`, caseId: item.caseId, kind: "Action", title: item.title, detail: `${item.owner} · ${item.progress}%` });
    for (const item of store.memories) if (item.content.toLocaleLowerCase("fr").includes(query)) results.push({ id: `memory:${item.id}`, caseId: item.caseId, kind: "Mémoire", title: item.content, detail: `${item.confidence}% de confiance` });
    for (const item of store.contextSources) if (`${item.title} ${item.rawContent}`.toLocaleLowerCase("fr").includes(query)) results.push({ id: `source:${item.id}`, caseId: item.caseId, kind: "Source", title: item.title, detail: item.type });
    return results.slice(0, 8);
  }, [search, store.cases, store.decisions, store.actions, store.memories, store.contextSources]);

  function openSearchResult(caseId: string) {
    openCase(caseId);
    setSearch("");
  }

  return <div className="min-h-screen overflow-x-hidden bg-[#07111f] text-white lg:grid lg:grid-cols-[238px_minmax(0,1fr)]">
    {profile === "executive" ? <ExecutiveGuide /> : <InvestorGuide />}
    <HelpCenter profile={profile} />
    <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/[.07] bg-[#091321] px-4 py-5 lg:flex">
      <button onClick={() => setShell("dossiers")} className="mb-8 flex items-center gap-3 px-2 text-left">
        <span className="grid size-10 place-items-center rounded-[14px] bg-gradient-to-br from-[#9b82ff] to-[#5b39e7] text-sm font-black">EO</span>
        <span><strong className="block text-[15px]">ExecutiveOS</strong><span className="text-[10px] uppercase tracking-[.12em] text-[#6f819e]">{profile === "executive" ? "Dirigeant" : "Investisseur"}</span></span>
      </button>
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-white/[.07] bg-black/10 p-1" aria-label="Choisir un profil"><button aria-pressed={profile === "executive"} onClick={() => changeProfile("executive")} className={`rounded-lg px-2 py-2 text-[11px] font-semibold ${profile === "executive" ? "bg-white/10 text-white" : "text-[#71839e]"}`}>Dirigeant</button><button aria-pressed={profile === "investor"} onClick={() => changeProfile("investor")} className={`rounded-lg px-2 py-2 text-[11px] font-semibold ${profile === "investor" ? "bg-white/10 text-white" : "text-[#71839e]"}`}>Investisseur</button></div>
      <nav className="space-y-1">
        <button onClick={() => setShell("dossiers")} className={`w-full rounded-xl px-3 py-2.5 text-left text-sm ${shell === "dossiers" ? "bg-white/[.08] text-white" : "text-[#8393ad] hover:bg-white/[.04]"}`}>{profile === "executive" ? "Mes dossiers" : "Mon portefeuille"}</button>
        <button onClick={() => window.dispatchEvent(new CustomEvent(profile === "executive" ? "executiveos:show-guide" : "executiveos:show-investor-guide"))} className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-[#8393ad] hover:bg-white/[.04]">Guide de démarrage</button>
        <button onClick={() => window.dispatchEvent(new CustomEvent("executiveos:show-help"))} className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-[#8393ad] hover:bg-white/[.04]">Aide & glossaire</button>
        <button onClick={() => setShell("settings")} className={`w-full rounded-xl px-3 py-2.5 text-left text-sm ${shell === "settings" ? "bg-white/[.08] text-white" : "text-[#8393ad] hover:bg-white/[.04]"}`}>Paramètres</button>
      </nav>
      {activeCase && <button onClick={() => setShell("case")} className="mt-6 rounded-2xl border border-white/[.07] bg-white/[.025] p-3.5 text-left">
        <span className="text-[10px] uppercase tracking-[.12em] text-[#6f819e]">Dossier actif</span>
        <strong className="mt-2 block text-sm">{activeCase.title}</strong>
        <span className="mt-2 block text-[11px] text-[#8294af]">Reprendre →</span>
      </button>}
      <div className="mt-auto rounded-2xl border border-white/[.07] bg-white/[.025] p-3.5"><div className="flex items-center gap-2 text-xs text-[#a5b4c9]"><span className="size-2 rounded-full bg-[#42d59d]"/> ORION disponible</div><p className="mt-2 text-[11px] leading-5 text-[#667995]">{store.cases.length} dossier(s) · {store.actions.filter((a) => a.status !== "done").length} action(s) ouverte(s).</p></div>
    </aside>

    <div className="min-w-0">
      <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#07111f]/90 px-4 py-3 backdrop-blur-2xl md:px-7">
        <div className="mx-auto flex max-w-[1540px] items-center gap-3">
          <div className="relative flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/[.08] bg-[#0d192b]/90 px-4 py-3"><span className="text-[#bfb2ff]">⌕</span><input aria-label="Rechercher dans ExecutiveOS" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un dossier, une décision, une action…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#65758f]"/>{search && <button aria-label="Effacer la recherche" onClick={() => setSearch("")} className="text-xs text-[#65758f]">Effacer</button>}
          {search.trim().length >= 2 && <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border border-white/[.08] bg-[#fffefa] p-2 shadow-2xl">{searchResults.length ? searchResults.map((result) => <button key={result.id} onClick={() => openSearchResult(result.caseId)} className="flex w-full items-start gap-3 rounded-xl p-3 text-left hover:bg-black/[.04]"><span className="mt-0.5 rounded-full bg-[#0071e3]/10 px-2 py-1 text-[9px] font-bold uppercase text-[#0066cc]">{result.kind}</span><span className="min-w-0"><strong className="block truncate text-sm">{result.title}</strong><span className="mt-1 block truncate text-xs text-[#6e6e73]">{result.detail}</span></span></button>) : <div className="p-4 text-sm text-[#6e6e73]">Aucun résultat. Essaie un autre mot-clé.</div>}</div>}</div>
          <div className="hidden min-w-0 flex-[1.25] items-center gap-3 rounded-2xl border border-white/[.08] bg-[#0d192b]/90 px-4 py-3 lg:flex"><span className="text-[#bfb2ff]">✦</span><input value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder={activeCase ? `Demander à ORION pour “${activeCase.title}”…` : "Crée d’abord un dossier"} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#65758f]"/><button onClick={submit} disabled={!prompt.trim()} className="rounded-lg bg-[#7c5cff] px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40">ORION</button></div>
          <div className="flex shrink-0 items-center gap-2 lg:hidden"><button aria-label={`Profil ${profile === "executive" ? "dirigeant" : "investisseur"}. Changer de profil`} onClick={() => changeProfile(profile === "executive" ? "investor" : "executive")} className="min-h-11 rounded-2xl border border-white/[.08] bg-white/[.03] px-3 text-[10px] font-bold">{profile === "executive" ? "CEO" : "INV"}</button><button aria-label="Ouvrir l’aide et le glossaire" onClick={() => window.dispatchEvent(new CustomEvent("executiveos:show-help"))} className="grid size-11 place-items-center rounded-2xl border border-white/[.08] bg-white/[.03] text-sm font-bold">?</button><button aria-label={profile === "executive" ? "Mes dossiers" : "Mon portefeuille"} onClick={() => setShell("dossiers")} className="grid size-11 place-items-center rounded-2xl border border-white/[.08] bg-white/[.03] text-lg">⌂</button></div><div className="hidden size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#d7cfff] to-[#8b73ef] text-xs font-black text-[#1b1239] sm:grid">SH</div>
        </div>
      </header>

      <main className="mx-auto max-w-[1540px] p-4 pb-24 md:p-7 xl:p-9">
        {shell === "dossiers" && (profile === "executive" ? <DossiersHome onOpen={openCase} /> : <InvestorHome onOpen={openCase} />)}
        {shell === "case" && activeCase && <CaseWorkspace cognitiveCase={activeCase} onBack={() => setShell("dossiers")} />}
        {shell === "settings" && <ProductControlCenter />}
      </main>
    </div>
  </div>;
}

function DossiersHome({ onOpen }: { onOpen: (id: string) => void }) {
  const store = useExecutiveStore();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [context, setContext] = useState("");

  function create() {
    const cleanTitle = title.trim();
    const cleanObjective = objective.trim();
    if (!cleanTitle || !cleanObjective) return;
    const id = store.createCase({ title: cleanTitle, objective: cleanObjective, context: context.trim() });
    setTitle(""); setObjective(""); setContext(""); setCreating(false); onOpen(id);
    requestAnimationFrame(() => window.dispatchEvent(new CustomEvent("executiveos:sync")));
  }

  return <section>
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div><div className="text-[10px] font-black uppercase tracking-[.2em] text-[#7c92b2]">ExecutiveOS · Dossier First</div><h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] md:text-5xl">Mes dossiers</h1><p className="mt-3 max-w-3xl text-lg leading-8 text-[#91a2bd]">Chaque sujet important vit ici, de la première question jusqu’au résultat et à l’apprentissage.</p></div>
      <button onClick={() => setCreating(true)} className="min-h-12 rounded-xl bg-[#7c5cff] px-5 py-3 text-sm font-bold shadow-lg shadow-[#7c5cff]/20">+ Nouveau dossier</button>
    </div>

    {creating && <div role="dialog" aria-modal="true" aria-labelledby="new-case-title" className="fixed inset-0 z-[70] flex items-end bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6">
      <form onSubmit={(event) => { event.preventDefault(); create(); }} className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] border border-[#7c5cff]/30 bg-[#0d192b] p-5 shadow-2xl sm:max-w-2xl sm:rounded-[28px] sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#b7a9ff]">Nouveau dossier cognitif</div><h2 id="new-case-title" className="mt-2 text-2xl font-semibold">Quel sujet veux-tu faire avancer ?</h2></div><button type="button" aria-label="Fermer la création" onClick={() => setCreating(false)} className="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 text-xl text-[#aab7ca]">×</button></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Titre" value={title} onChange={setTitle} placeholder="Ex. Dois-je lancer ce produit ?"/><Field label="Objectif" value={objective} onChange={setObjective} placeholder="Ex. Décider si le lancement crée assez de valeur."/><div className="md:col-span-2"><Field label="Contexte initial" value={context} onChange={setContext} placeholder="Ce que tu sais déjà, contraintes, horizon…"/></div></div>
        <button type="submit" disabled={!title.trim() || !objective.trim()} className="mt-5 min-h-12 w-full rounded-xl bg-[#7c5cff] px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40">Créer et ouvrir le dossier</button>
      </form>
    </div>}

    <div className="mt-7 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{store.cases.map((item) => <DossierCard key={item.id} item={item} onOpen={() => onOpen(item.id)} />)}</div>
    <details className="mt-8 rounded-2xl border border-black/10 bg-white/50 p-4"><summary className="cursor-pointer text-sm font-semibold">Voir les données de démonstration</summary><div className="mt-5"><InvestorDemoDashboard onOpenCase={onOpen} /></div></details>
    <button aria-label="Créer un dossier" onClick={() => setCreating(true)} className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 grid size-14 place-items-center rounded-full bg-[#7c5cff] text-3xl font-light shadow-2xl shadow-black/40 lg:hidden">+</button>
  </section>;
}

function InvestorHome({ onOpen }: { onOpen: (id: string) => void }) {
  const store = useExecutiveStore();
  const reopened = store.decisionWatches.filter((item) => item.status === "reopen").length;
  const blocked = store.actions.filter((item) => item.status === "blocked").length;
  const activeProjects = store.projects.filter((item) => item.status === "active" || item.status === "validated").length;

  return <section>
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="text-[10px] font-black uppercase tracking-[.2em] text-[#7c92b2]">ExecutiveOS · Investor View</div><h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] md:text-5xl">Mon portefeuille</h1><p className="mt-3 max-w-3xl text-lg leading-8 text-[#91a2bd]">Les participations, signaux et engagements qui méritent une décision — sans le bruit du pilotage quotidien.</p></div><button onClick={() => window.dispatchEvent(new CustomEvent("executiveos:show-investor-guide"))} className="min-h-12 rounded-xl border border-white/[.1] bg-white/[.04] px-5 py-3 text-sm font-bold">Comprendre cette vue</button></div>
    <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><InvestorSignal label="Initiatives suivies" help="Projets stratégiques actuellement observés dans l’ensemble du portefeuille." value={store.projects.length} detail={`${activeProjects} actives ou validées`} tone="neutral"/><InvestorSignal label="Décisions à rouvrir" help="Décisions dont une hypothèse ou un signal a changé et qui doivent être réexaminées." value={reopened} detail="Hypothèses fragilisées" tone={reopened ? "alert" : "good"}/><InvestorSignal label="Blocages critiques" help="Actions empêchées qui peuvent menacer un engagement, une échéance ou la trajectoire d’une participation." value={blocked} detail="Exécution à débloquer" tone={blocked ? "watch" : "good"}/><InvestorSignal label="Sociétés / dossiers" help="Nombre de trajectoires de sociétés ou de sujets d’investissement documentées." value={store.cases.length} detail="Trajectoires documentées" tone="neutral"/></div>
    <div className="mt-7 rounded-[30px] bg-[#fffefa] p-4 text-[#1d1d1f] shadow-2xl shadow-black/10 md:p-6"><InvestorDemoDashboard onOpenCase={onOpen}/></div>
    <p className="mt-4 text-xs leading-5 text-[#71839e]">Vue investisseur distincte : les chiffres de démonstration sont fictifs et identifiés comme tels. Une future connexion aux participations devra respecter les droits de partage définis par chaque dirigeant.</p>
  </section>;
}

function InvestorSignal({ label, help, value, detail, tone }: { label: string; help: string; value: number; detail: string; tone: "neutral" | "good" | "watch" | "alert" }) {
  const color = tone === "alert" ? "text-[#ff8793]" : tone === "watch" ? "text-[#ffd895]" : tone === "good" ? "text-[#7de5bd]" : "text-[#c8c0ff]";
  return <article className="rounded-[22px] border border-white/[.08] bg-[#0d192b]/88 p-5"><span className="text-[10px] font-black uppercase tracking-[.14em] text-[#71839e]">{label}<InfoTip label={help}/></span><strong className={`mt-3 block text-4xl tracking-[-.04em] ${color}`}>{value}</strong><span className="mt-2 block text-xs text-[#91a2bd]">{detail}</span></article>;
}

function DossierCard({ item, onOpen }: { item: CognitiveCase; onOpen: () => void }) {
  const store = useExecutiveStore();
  const decisions = store.decisions.filter((d) => d.caseId === item.id);
  const actions = store.actions.filter((a) => a.caseId === item.id);
  const learnings = store.learningEvents.filter((l) => l.caseId === item.id);
  const base = { explore: 20, decide: 45, execute: 70, learn: 90 }[item.state];
  const doneRatio = actions.length ? actions.filter((a) => a.status === "done").length / actions.length : 0;
  const progress = Math.min(100, Math.round(base + doneRatio * 10));
  return <button onClick={onOpen} className="rounded-[24px] border border-white/[.08] bg-[#0d192b]/88 p-5 text-left transition hover:-translate-y-0.5 hover:border-[#7c5cff]/40">
    <div className="flex items-start justify-between gap-3"><span className="rounded-full bg-white/[.05] px-2.5 py-1 text-[10px] uppercase tracking-[.1em] text-[#91a2bd]">{stateLabel(item.state)}</span><strong className="text-xl text-[#c8c0ff]">{progress}% <InfoTip label="Avancement indicatif calculé à partir de l’étape du dossier et des actions terminées."/></strong></div>
    <h2 className="mt-4 text-xl font-semibold">{item.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#91a2bd]">{item.objective}</p>
    <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full bg-gradient-to-r from-[#7657ff] to-[#42d59d]" style={{ width: `${progress}%` }}/></div>
    <div className="mt-4 flex gap-4 text-[11px] text-[#71839e]"><span>{decisions.length} décision(s)</span><span>{actions.filter((a) => a.status !== "done").length} action(s)</span><span>{learnings.length} learning(s)</span></div>
    <div className="mt-5 text-sm font-semibold text-[#b7a9ff]">Ouvrir le dossier →</div>
  </button>;
}

function CaseWorkspace({ cognitiveCase, onBack }: { cognitiveCase: CognitiveCase; onBack: () => void }) {
  const store = useExecutiveStore();
  const [editing, setEditing] = useState(false);
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("overview");
  const [title, setTitle] = useState(cognitiveCase.title);
  const [objective, setObjective] = useState(cognitiveCase.objective);
  const journey = useMemo(() => buildCaseJourney({ cognitiveCase, decisions: store.decisions, actions: store.actions, learningEvents: store.learningEvents, reflections: store.reflections }), [cognitiveCase, store.decisions, store.actions, store.learningEvents, store.reflections]);
  const brief = useMemo(() => buildExecutiveCaseBrief({ cognitiveCase, decisions: store.decisions, actions: store.actions, caseObjects: store.caseObjects, learningEvents: store.learningEvents, reflections: store.reflections, contextSources: store.contextSources, contextEvidence: store.contextEvidence, executiveCycles: store.executiveCycles, decisionActionPlans: store.decisionActionPlans, decisionWatches: store.decisionWatches }), [cognitiveCase, store.decisions, store.actions, store.caseObjects, store.learningEvents, store.reflections, store.contextSources, store.contextEvidence, store.executiveCycles, store.decisionActionPlans, store.decisionWatches]);

  useEffect(() => {
    function openAnalysis() { setActiveSection("analysis"); }
    window.addEventListener("executiveos:open-analysis", openAnalysis);
    return () => window.removeEventListener("executiveos:open-analysis", openAnalysis);
  }, []);

  function save() {
    store.applyCasePatch(cognitiveCase.id, { title: title.trim() || cognitiveCase.title, objective: objective.trim() || cognitiveCase.objective });
    setEditing(false);
  }

  function goTo(section: WorkspaceSection) {
    setActiveSection(section);
    requestAnimationFrame(() => document.getElementById("workspace-content")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return <section>
    <div className="mb-4 flex items-center justify-between gap-3"><button onClick={onBack} className="text-sm text-[#8393ad] hover:text-white">← Mes dossiers</button><div className="flex items-center gap-2 text-xs text-[#6e6e73]"><span className={`size-2 rounded-full ${brief.health === "critical" ? "bg-[#d70015]" : brief.health === "watch" ? "bg-[#a05a00]" : "bg-[#248a3d]"}`}/>{brief.health === "critical" ? "Attention requise" : brief.health === "watch" ? "Sous surveillance" : "Dossier stable"}</div></div>
    <div className="overflow-hidden rounded-[30px] border border-white/[.08] bg-[#0d192b]/88">
      <div className="p-5 md:p-7">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">{editing ? <div className="space-y-3"><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-white/[.08] bg-[#091422] px-4 py-3 text-2xl font-semibold outline-none"/><textarea value={objective} onChange={(e) => setObjective(e.target.value)} className="min-h-24 w-full rounded-xl border border-white/[.08] bg-[#091422] px-4 py-3 text-sm leading-6 outline-none"/><div className="flex gap-2"><button onClick={save} className="rounded-lg bg-[#7c5cff] px-4 py-2 text-xs font-bold">Enregistrer</button><button onClick={() => setEditing(false)} className="rounded-lg border border-white/[.08] px-4 py-2 text-xs">Annuler</button></div></div> : <><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#9d83ff]">Dossier cognitif · {stateLabel(cognitiveCase.state)}</div><h1 className="mt-3 text-3xl font-semibold tracking-[-.035em] md:text-4xl">{cognitiveCase.title}</h1><p className="mt-3 max-w-4xl text-base leading-7 text-[#91a2bd]">{cognitiveCase.objective}</p></>}</div>
        {!editing && <button onClick={() => setEditing(true)} className="rounded-xl border border-white/[.08] bg-white/[.03] px-4 py-2 text-xs font-semibold">Modifier le dossier</button>}
      </div>
      </div>
      <div className="flex flex-wrap items-stretch gap-px border-y border-white/[.08] bg-black/[.06]">{WORKSPACE_SECTIONS.map((item, index) => <button key={item.id} aria-pressed={activeSection === item.id} onClick={() => goTo(item.id)} className={`min-w-[46%] flex-1 px-4 py-3 text-left text-xs font-semibold transition sm:min-w-0 ${activeSection === item.id ? "bg-[#0071e3] text-white" : "bg-[#fffefa]/75 text-[#6e6e73] hover:bg-white"}`}><span className="mr-2 opacity-60">{index + 1}</span>{item.label} <InfoTip label={item.help}/></button>)}<details className="relative min-w-full bg-[#fffefa]/75 sm:min-w-0"><summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold text-[#6e6e73]">Plus ···</summary><div className="absolute right-0 z-30 mt-1 min-w-56 rounded-2xl border border-black/10 bg-[#fffefa] p-2 shadow-xl">{ADVANCED_SECTIONS.map((item) => <button key={item.id} onClick={() => goTo(item.id)} className="block w-full rounded-xl px-3 py-2.5 text-left text-xs font-semibold hover:bg-black/[.04]">{item.label}</button>)}</div></details></div>
    </div>

    <div id="workspace-content" className="scroll-mt-28 pt-6">
      {activeSection === "overview" && <CommandSurface brief={brief} journey={journey} onNavigate={goTo} caseId={cognitiveCase.id}/>}
      {activeSection === "context" && <WorkspaceView eyebrow="Contexte vivant" title="Les preuves derrière le raisonnement" description="Connecte une source ou ajoute une information : le brief et les recommandations se mettent à jour dans le même dossier."><IntegrationFabricPanel caseId={cognitiveCase.id}/><div className="h-5"/><ContextIngestionPanel caseId={cognitiveCase.id}/></WorkspaceView>}
      {activeSection === "strategy" && <StrategyStudio cognitiveCase={cognitiveCase}/>}
      {activeSection === "analysis" && <WorkspaceView eyebrow="Salle de décision" title="Raisonner, comparer et arbitrer" description="ORION convoque les capacités utiles dans le contexte exact du dossier."><ExecutiveWorkspace /></WorkspaceView>}
      {activeSection === "execution" && <WorkspaceView eyebrow="Mise en mouvement" title="De la décision au résultat observable" description="Pilote les responsabilités, les blocages et les livrables sans perdre le fil du raisonnement."><ExecutiveRuntimePanel mode="act" /></WorkspaceView>}
      {activeSection === "learning" && <WorkspaceView eyebrow="Mémoire active" title="Ce que ce dossier t’a réellement appris" description="Les résultats, révisions et signaux deviennent une intelligence réutilisable."><LearningPanel caseId={cognitiveCase.id} onNavigate={goTo} /></WorkspaceView>}
      {activeSection === "history" && <WorkspaceView eyebrow="Trajectoire cognitive" title="Rejouer chaque évolution importante" description="Chaque événement ramène vers l’objet et l’étape de travail correspondants."><HistoryPanel caseId={cognitiveCase.id} onNavigate={goTo} /></WorkspaceView>}
    </div>
  </section>;
}

function WorkspaceView({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <section>
    <div className="mb-4"><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#9d83ff]">{eyebrow}</div><h2 className="mt-2 text-2xl font-semibold tracking-[-.025em] md:text-3xl">{title}</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-[#8294af]">{description}</p></div>
    {children}
  </section>;
}

function CommandSurface({ brief, journey, onNavigate, caseId }: { brief: ReturnType<typeof buildExecutiveCaseBrief>; journey: ReturnType<typeof buildCaseJourney>; onNavigate: (section: WorkspaceSection) => void; caseId: string }) {
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.55fr)]">
    <div className="space-y-5">
      <article className="rounded-[28px] border border-[#0071e3]/20 bg-[linear-gradient(145deg,rgba(255,255,255,.98),rgba(232,241,250,.82))] p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#0066cc]">Brief vivant · maintenant</div><span className="rounded-full bg-white/70 px-3 py-1 text-[10px] font-semibold text-[#6e6e73]">{stateLabel(brief.state)}</span></div>
        <h2 className="mt-4 max-w-4xl text-2xl font-semibold tracking-[-.03em] md:text-3xl">{brief.executiveSummary}</h2>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-[#59636f]">{brief.recommendation}</p>
        <div className="mt-6 flex flex-wrap gap-3"><button onClick={() => onNavigate(brief.blockers.length ? "execution" : journey.latestDecision ? "execution" : "analysis")} className="rounded-full bg-[#0071e3] px-5 py-3 text-sm font-bold text-white">Continuer depuis ici →</button><button onClick={() => onNavigate("analysis")} className="rounded-full border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold">Demander un arbitrage à ORION</button></div>
      </article>
      <div className="grid gap-4 md:grid-cols-3"><SignalCard label="Décision active" value={brief.latestDecision} meta={brief.decisionConfidence ? `${brief.decisionConfidence}% de confiance` : "À formaliser"} onClick={() => onNavigate("analysis")}/><SignalCard label="Prochaine action" value={brief.nextAction} meta={brief.blockers.length ? `${brief.blockers.length} blocage(s)` : "Prête à avancer"} onClick={() => onNavigate("execution")}/><SignalCard label="Dernier apprentissage" value={brief.latestLearning} meta="Mémoire consolidée" onClick={() => onNavigate("learning")}/></div>
      <CollaborationPanel caseId={caseId}/>
    </div>
    <aside className="space-y-5">
      <Panel title="Centre d’attention">{brief.proactiveAlerts.length ? brief.proactiveAlerts.map((alert) => <button key={alert} onClick={() => onNavigate(alert.startsWith("Blocage") ? "execution" : "analysis")} className="block w-full rounded-2xl border border-[#d70015]/10 bg-[#d70015]/[.035] p-4 text-left text-sm leading-6 hover:border-[#d70015]/30">{alert}<span className="mt-2 block text-[10px] font-bold uppercase text-[#d70015]">Traiter →</span></button>) : <div className="rounded-2xl bg-[#248a3d]/[.06] p-4 text-sm leading-6 text-[#248a3d]">Aucune tension critique. Le dossier peut avancer sur sa prochaine action.</div>}</Panel>
      <Panel title="Depuis ta dernière visite">{brief.sinceLastSession.length ? brief.sinceLastSession.map((change) => <div key={change} className="flex gap-3 rounded-xl bg-white/60 p-3 text-sm"><span className="text-[#248a3d]">●</span><span>{change}</span></div>) : <p className="text-sm leading-6 text-[#71839e]">Aucun changement majeur. Tu reprends exactement au même point.</p>}<button onClick={() => onNavigate("history")} className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-semibold">Voir la trajectoire complète</button></Panel>
    </aside>
  </div>;
}

function SignalCard({ label, value, meta, onClick }: { label: string; value: string; meta: string; onClick: () => void }) { return <button onClick={onClick} className="rounded-[24px] border border-white/[.08] bg-[#0d192b]/88 p-5 text-left hover:-translate-y-0.5 hover:border-[#0071e3]/30"><span className="text-[10px] font-black uppercase tracking-[.14em] text-[#6e6e73]">{label}</span><strong className="mt-3 line-clamp-3 block text-base leading-6">{value}</strong><span className="mt-4 block text-xs font-semibold text-[#0066cc]">{meta} · Ouvrir →</span></button>; }

function CaseOverview({ journey, onNavigate }: { journey: ReturnType<typeof buildCaseJourney>; onNavigate: (section: WorkspaceSection) => void }) {
  const nextSection: WorkspaceSection = journey.nextAction ? "execution" : "analysis";
  return <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
    <article className="rounded-[26px] border border-[#7c5cff]/25 bg-[linear-gradient(135deg,rgba(124,92,255,.12),rgba(13,25,43,.94))] p-5 md:p-6">
      <div className="text-[10px] font-black uppercase tracking-[.18em] text-[#b7a9ff]">Là où tu en étais</div>
      <h2 className="mt-3 text-2xl font-semibold">{journey.latestDecision?.outcome ?? "Aucune décision encore formalisée"}</h2>
      <p className="mt-3 text-sm leading-6 text-[#aab7ca]">{journey.latestDecision?.rationale ?? journey.latestReflection?.summary ?? "Commence par poser la question, explorer les hypothèses et construire les options."}</p>
      <button onClick={() => onNavigate(nextSection)} className="mt-5 rounded-xl bg-[#7c5cff] px-5 py-3 text-sm font-bold">Continuer depuis ici →</button>
    </article>
    <div className="grid gap-3">
      <Outcome eyebrow="Décision" title={journey.latestDecision?.outcome ?? "À construire"} text={journey.latestDecision ? `${journey.latestDecision.confidence}% de confiance` : "Aucun arbitrage enregistré"} onClick={() => onNavigate("analysis")}/>
      <Outcome eyebrow="Prochaine action" title={journey.nextAction?.title ?? "À définir"} text={journey.nextAction ? `${journey.nextAction.owner} · ${journey.nextAction.progress}%` : "Le plan d’action sera créé après la décision"} onClick={() => onNavigate("execution")}/>
      <Outcome eyebrow="Dernier apprentissage" title={journey.latestLearning?.title ?? journey.latestReflection?.summary ?? "Pas encore d’apprentissage"} text={journey.latestLearning?.detail ?? "Les résultats réels alimenteront cette section"} onClick={() => onNavigate("learning")}/>
    </div>
  </div>;
}

function LearningPanel({ caseId, onNavigate }: { caseId: string; onNavigate: (section: WorkspaceSection) => void }) {
  const store = useExecutiveStore();
  const memories = store.memories.filter((item) => item.caseId === caseId);
  const learnings = store.learningEvents.filter((item) => item.caseId === caseId);
  const reflections = store.reflections.filter((item) => item.caseId === caseId);
  const profile = store.cognitiveProfiles.find((item) => item.caseId === caseId);
  return <div className="grid gap-5 xl:grid-cols-2">
    <Panel title="Ce que le dossier a appris">{learnings.map((item) => <Item key={item.id} title={item.title} text={item.detail} meta={item.significance}/>)}</Panel>
    <Panel title="Réflexions"><>{reflections.map((item) => <Item key={item.id} title={item.summary} text={[...item.learned, ...item.uncertainties].join(" · ")} meta={`${item.confidence}%`}/>)}</></Panel>
    <Panel title="Mémoire durable">{memories.map((item) => <Item key={item.id} title={item.kind} text={item.content} meta={`${item.confidence}%`}/>)}</Panel>
    <Panel title="Calibration" help="Ces scores décrivent la qualité du processus de décision, pas la performance financière du projet.">{profile ? <div className="grid grid-cols-2 gap-3"><Metric label="Calibration" help="Correspondance entre la confiance annoncée et les résultats observés." value={profile.calibration}/><Metric label="Stabilité" help="Cohérence des convictions dans le temps, avec révisions justifiées." value={profile.beliefStability}/><Metric label="Risque" help="Qualité du suivi des risques, seuils d’arrêt et réévaluations." value={profile.riskDiscipline}/><Metric label="Apprentissage" help="Capacité à transformer les résultats en enseignements réutilisables." value={profile.learningQuality}/></div> : <p className="text-sm text-[#71839e]">Pas assez de traces pour calibrer le dossier.</p>}</Panel>
    <button onClick={() => onNavigate("history")} className="xl:col-span-2 rounded-xl border border-white/[.08] bg-white/[.03] px-4 py-3 text-sm font-semibold">Voir tout l’historique →</button>
  </div>;
}

function HistoryPanel({ caseId, onNavigate }: { caseId: string; onNavigate: (section: WorkspaceSection) => void }) {
  const store = useExecutiveStore();
  const events = store.events.filter((event) => event.detail.includes(caseId) || event.type === "CaseCreated" || store.actions.some((a) => a.caseId === caseId && event.detail.includes(a.id))).slice(0, 30);
  function destination(event: CognitiveEventRecord): WorkspaceSection {
    const view = resolveEventDestination(event).view;
    if (view === "act") return "execution";
    if (view === "decision") return "analysis";
    if (view === "understand") return "learning";
    return "overview";
  }
  return <Panel title="Timeline du dossier">{events.length ? events.map((event) => <button key={event.id} onClick={() => onNavigate(destination(event))} className="block w-full rounded-2xl border border-white/[.07] bg-white/[.025] p-4 text-left hover:border-[#7c5cff]/40"><div className="flex justify-between gap-3"><strong className="text-sm">{event.type}</strong><span className="text-[10px] text-[#9d83ff]">Ouvrir →</span></div><p className="mt-2 text-sm text-[#91a2bd]">{event.detail}</p><span className="mt-2 block text-[10px] text-[#667995]">{new Date(event.createdAt).toLocaleString("fr-FR")}</span></button>) : <p className="text-sm text-[#71839e]">La timeline se remplira au fil du travail sur ce dossier.</p>}</Panel>;
}

function stateLabel(state: CognitiveCase["state"]) { return { explore: "Exploration", decide: "Décision", execute: "Exécution", learn: "Apprentissage" }[state]; }
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[.14em] text-[#71839e]">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-white/[.08] bg-[#091422] px-4 py-3 text-base outline-none placeholder:text-[#52647f]"/></label>; }
function Outcome({ eyebrow, title, text, onClick }: { eyebrow: string; title: string; text: string; onClick: () => void }) { return <button onClick={onClick} className="rounded-2xl border border-white/[.08] bg-[#0d192b]/88 p-4 text-left hover:border-[#7c5cff]/40"><span className="text-[10px] uppercase tracking-[.14em] text-[#7c92b2]">{eyebrow}</span><strong className="mt-2 block text-sm">{title}</strong><p className="mt-2 text-xs leading-5 text-[#8294af]">{text}</p></button>; }
function Panel({ title, help, children }: { title: string; help?: string; children: React.ReactNode }) { return <article className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/88 p-5 md:p-6"><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#9d83ff]">{title}{help && <InfoTip label={help}/>}</div><div className="mt-4 space-y-3">{children}</div></article>; }
function Item({ title, text, meta }: { title: string; text: string; meta: string }) { return <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex justify-between gap-3"><strong className="text-sm">{title}</strong><span className="text-[10px] uppercase text-[#667995]">{meta}</span></div><p className="mt-2 text-sm leading-6 text-[#91a2bd]">{text}</p></div>; }
function Metric({ label, help, value }: { label: string; help: string; value: number }) { return <div className="rounded-xl border border-white/[.06] bg-white/[.025] p-3"><span className="text-[10px] uppercase text-[#667995]">{label}<InfoTip label={help}/></span><strong className="mt-1 block text-2xl">{value}</strong></div>; }
