"use client";

import { useMemo, useState } from "react";
import { ExecutiveRuntimePanel } from "@/components/executive-runtime-panel";
import { ExecutiveWorkspace } from "@/components/executive-workspace";
import { ContextIngestionPanel } from "@/components/context-ingestion-panel";
import { IntegrationFabricPanel } from "@/components/integration-fabric-panel";
import { InvestorDemoDashboard } from "@/components/investor-demo-dashboard";
import { CollaborationPanel } from "@/components/collaboration-panel";
import { buildCognitiveRecall } from "@/lib/cognitive-recall";
import { buildCaseJourney, resolveEventDestination } from "@/lib/outcome-navigation";
import { runUnifiedRuntime } from "@/lib/unified-runtime";
import { useExecutiveStore } from "@/store/executive-store";
import type { CognitiveCase, CognitiveEventRecord } from "@/domain/canonical";

type ShellView = "dossiers" | "case" | "settings";
type WorkspaceSection = "overview" | "context" | "analysis" | "execution" | "learning" | "history";

const WORKSPACE_SECTIONS: Array<{ id: WorkspaceSection; label: string }> = [
  { id: "overview", label: "Vue d’ensemble" },
  { id: "context", label: "Sources & contexte" },
  { id: "analysis", label: "Analyse & décision" },
  { id: "execution", label: "Exécution" },
  { id: "learning", label: "Apprentissage" },
  { id: "history", label: "Historique" }
];

export function ExecutiveHomeV4() {
  const store = useExecutiveStore();
  const [shell, setShell] = useState<ShellView>("dossiers");
  const [prompt, setPrompt] = useState("");
  const activeCase = store.cases.find((item) => item.id === store.activeCaseId) ?? store.cases[0];

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
    requestAnimationFrame(() => document.getElementById("analysis")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return <div className="min-h-screen bg-[#07111f] text-white md:grid md:grid-cols-[238px_minmax(0,1fr)]">
    <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/[.07] bg-[#091321] px-4 py-5 md:flex">
      <button onClick={() => setShell("dossiers")} className="mb-8 flex items-center gap-3 px-2 text-left">
        <span className="grid size-10 place-items-center rounded-[14px] bg-gradient-to-br from-[#9b82ff] to-[#5b39e7] text-sm font-black">EO</span>
        <span><strong className="block text-[15px]">ExecutiveOS</strong><span className="text-[10px] uppercase tracking-[.12em] text-[#6f819e]">Cognitive OS</span></span>
      </button>
      <nav className="space-y-1">
        <button onClick={() => setShell("dossiers")} className={`w-full rounded-xl px-3 py-2.5 text-left text-sm ${shell === "dossiers" ? "bg-white/[.08] text-white" : "text-[#8393ad] hover:bg-white/[.04]"}`}>Mes dossiers</button>
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
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/[.08] bg-[#0d192b]/90 px-4 py-3"><span className="text-[#bfb2ff]">✦</span><input value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder={activeCase ? `Demander à ORION pour “${activeCase.title}”…` : "Crée d’abord un dossier"} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#65758f]"/><button onClick={submit} className="rounded-lg bg-[#7c5cff] px-3 py-1.5 text-xs font-bold">ORION</button></div>
          <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#d7cfff] to-[#8b73ef] text-xs font-black text-[#1b1239]">SH</div>
        </div>
      </header>

      <main className="mx-auto max-w-[1540px] p-4 md:p-7 xl:p-9">
        {shell === "dossiers" && <DossiersHome onOpen={openCase} />}
        {shell === "case" && activeCase && <CaseWorkspace cognitiveCase={activeCase} onBack={() => setShell("dossiers")} />}
        {shell === "settings" && <SettingsPanel />}
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
  }

  return <section>
    <InvestorDemoDashboard onOpenCase={onOpen} />
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div><div className="text-[10px] font-black uppercase tracking-[.2em] text-[#7c92b2]">ExecutiveOS · Dossier First</div><h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] md:text-5xl">Mes dossiers</h1><p className="mt-3 max-w-3xl text-lg leading-8 text-[#91a2bd]">Chaque sujet important vit ici, de la première question jusqu’au résultat et à l’apprentissage.</p></div>
      <button onClick={() => setCreating(true)} className="rounded-xl bg-[#7c5cff] px-5 py-3 text-sm font-bold">+ Nouveau dossier</button>
    </div>

    {creating && <div className="mt-6 rounded-[28px] border border-[#7c5cff]/30 bg-[#0d192b]/95 p-5 md:p-6">
      <div className="flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#b7a9ff]">Nouveau dossier cognitif</div><h2 className="mt-2 text-2xl font-semibold">Quel sujet veux-tu faire avancer ?</h2></div><button onClick={() => setCreating(false)} className="text-sm text-[#8393ad]">Fermer</button></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Titre" value={title} onChange={setTitle} placeholder="Ex. Dois-je lancer ce produit ?"/><Field label="Objectif" value={objective} onChange={setObjective} placeholder="Ex. Décider si le lancement crée assez de valeur."/><div className="md:col-span-2"><Field label="Contexte initial" value={context} onChange={setContext} placeholder="Ce que tu sais déjà, contraintes, horizon…"/></div></div>
      <button onClick={create} className="mt-5 rounded-xl bg-[#7c5cff] px-5 py-3 text-sm font-bold">Créer et ouvrir le dossier</button>
    </div>}

    <div className="mt-7 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{store.cases.map((item) => <DossierCard key={item.id} item={item} onOpen={() => onOpen(item.id)} />)}</div>
  </section>;
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
    <div className="flex items-start justify-between gap-3"><span className="rounded-full bg-white/[.05] px-2.5 py-1 text-[10px] uppercase tracking-[.1em] text-[#91a2bd]">{stateLabel(item.state)}</span><strong className="text-xl text-[#c8c0ff]">{progress}%</strong></div>
    <h2 className="mt-4 text-xl font-semibold">{item.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#91a2bd]">{item.objective}</p>
    <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full bg-gradient-to-r from-[#7657ff] to-[#42d59d]" style={{ width: `${progress}%` }}/></div>
    <div className="mt-4 flex gap-4 text-[11px] text-[#71839e]"><span>{decisions.length} décision(s)</span><span>{actions.filter((a) => a.status !== "done").length} action(s)</span><span>{learnings.length} learning(s)</span></div>
    <div className="mt-5 text-sm font-semibold text-[#b7a9ff]">Ouvrir le dossier →</div>
  </button>;
}

function CaseWorkspace({ cognitiveCase, onBack }: { cognitiveCase: CognitiveCase; onBack: () => void }) {
  const store = useExecutiveStore();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(cognitiveCase.title);
  const [objective, setObjective] = useState(cognitiveCase.objective);
  const journey = useMemo(() => buildCaseJourney({ cognitiveCase, decisions: store.decisions, actions: store.actions, learningEvents: store.learningEvents, reflections: store.reflections }), [cognitiveCase, store.decisions, store.actions, store.learningEvents, store.reflections]);

  function save() {
    store.applyCasePatch(cognitiveCase.id, { title: title.trim() || cognitiveCase.title, objective: objective.trim() || cognitiveCase.objective });
    setEditing(false);
  }

  function goTo(section: WorkspaceSection) {
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return <section>
    <button onClick={onBack} className="mb-4 text-sm text-[#8393ad] hover:text-white">← Mes dossiers</button>
    <div className="rounded-[28px] border border-white/[.08] bg-[#0d192b]/88 p-5 md:p-7">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">{editing ? <div className="space-y-3"><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-white/[.08] bg-[#091422] px-4 py-3 text-2xl font-semibold outline-none"/><textarea value={objective} onChange={(e) => setObjective(e.target.value)} className="min-h-24 w-full rounded-xl border border-white/[.08] bg-[#091422] px-4 py-3 text-sm leading-6 outline-none"/><div className="flex gap-2"><button onClick={save} className="rounded-lg bg-[#7c5cff] px-4 py-2 text-xs font-bold">Enregistrer</button><button onClick={() => setEditing(false)} className="rounded-lg border border-white/[.08] px-4 py-2 text-xs">Annuler</button></div></div> : <><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#9d83ff]">Dossier cognitif · {stateLabel(cognitiveCase.state)}</div><h1 className="mt-3 text-3xl font-semibold tracking-[-.035em] md:text-4xl">{cognitiveCase.title}</h1><p className="mt-3 max-w-4xl text-base leading-7 text-[#91a2bd]">{cognitiveCase.objective}</p></>}</div>
        {!editing && <button onClick={() => setEditing(true)} className="rounded-xl border border-white/[.08] bg-white/[.03] px-4 py-2 text-xs font-semibold">Modifier le dossier</button>}
      </div>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">{WORKSPACE_SECTIONS.map((item) => <button key={item.id} onClick={() => goTo(item.id)} className="whitespace-nowrap rounded-xl bg-white/[.04] px-4 py-2 text-xs font-semibold text-[#91a2bd] transition hover:bg-[#7c5cff] hover:text-white">{item.label}</button>)}</div>
    </div>

    <div className="mt-6 space-y-8">
      <WorkspaceBlock id="overview" eyebrow="01 · Vue d’ensemble" title="Reprendre exactement là où le dossier s’est arrêté" description="La synthèse opérationnelle du dossier, sa dernière décision, la prochaine action et le dernier apprentissage.">
        <CaseOverview journey={journey} onNavigate={goTo} />
        <div className="h-5"/>
        <CollaborationPanel caseId={cognitiveCase.id}/>
      </WorkspaceBlock>

      <WorkspaceBlock id="context" eyebrow="02 · Sources & contexte" title="Transformer les informations réelles en contexte exploitable" description="Notes, pages web et documents sont rattachés au dossier avec leur provenance, leurs preuves et une synthèse sourcée.">
        <IntegrationFabricPanel caseId={cognitiveCase.id}/>
        <div className="h-5"/>
        <ContextIngestionPanel caseId={cognitiveCase.id}/>
      </WorkspaceBlock>

      <WorkspaceBlock id="analysis" eyebrow="03 · Analyse & décision" title="Construire le raisonnement et arbitrer" description="ORION, le reasoning runtime et le canvas décisionnel travaillent ici dans le contexte du même dossier.">
        <ExecutiveWorkspace />
      </WorkspaceBlock>

      <WorkspaceBlock id="execution" eyebrow="04 · Exécution" title="Transformer la décision en résultats" description="Les actions du dossier sont affectées, exécutées et produisent des livrables consultables sans quitter le workspace.">
        <ExecutiveRuntimePanel mode="act" />
      </WorkspaceBlock>

      <WorkspaceBlock id="learning" eyebrow="05 · Apprentissage" title="Capitaliser ce que l’exécution a appris" description="Mémoire durable, learning events, réflexions et calibration restent rattachés au même dossier.">
        <LearningPanel caseId={cognitiveCase.id} onNavigate={goTo} />
      </WorkspaceBlock>

      <WorkspaceBlock id="history" eyebrow="06 · Historique" title="Rejouer la trajectoire du dossier" description="Les événements deviennent une timeline navigable vers les objets qu’ils ont créés ou modifiés.">
        <HistoryPanel caseId={cognitiveCase.id} onNavigate={goTo} />
      </WorkspaceBlock>
    </div>
  </section>;
}

function WorkspaceBlock({ id, eyebrow, title, description, children }: { id: WorkspaceSection; eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-28">
    <div className="mb-4"><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#9d83ff]">{eyebrow}</div><h2 className="mt-2 text-2xl font-semibold tracking-[-.025em] md:text-3xl">{title}</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-[#8294af]">{description}</p></div>
    {children}
  </section>;
}

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
    <Panel title="Calibration">{profile ? <div className="grid grid-cols-2 gap-3"><Metric label="Calibration" value={profile.calibration}/><Metric label="Stabilité" value={profile.beliefStability}/><Metric label="Risque" value={profile.riskDiscipline}/><Metric label="Apprentissage" value={profile.learningQuality}/></div> : <p className="text-sm text-[#71839e]">Pas assez de traces pour calibrer le dossier.</p>}</Panel>
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

function SettingsPanel() {
  const store = useExecutiveStore();
  const [email,setEmail]=useState("");
  const active = store.cases.find((item) => item.id === store.activeCaseId) ?? store.cases[0];
  const organization=store.organizations.find((item)=>item.id===store.activeOrganizationId);
  function invite(){if(!email.trim())return;store.inviteMember(email,"member");setEmail("");}
  return <section><div className="mb-6"><div className="text-[10px] font-black uppercase tracking-[.2em] text-[#7c92b2]">Paramètres</div><h1 className="mt-3 text-4xl font-semibold">ExecutiveOS</h1><p className="mt-3 text-lg text-[#91a2bd]">Organisation, collaboration et maintenance de l’espace.</p></div><div className="grid gap-5 lg:grid-cols-2">
    <Panel title="Organisation"><Item title={organization?.name??"Organisation"} text={`${store.organizationMembers.length} membre(s) · ${store.organizationInvitations.filter((item)=>item.status==="pending").length} invitation(s)`} meta={(organization?.plan??"demo").toUpperCase()}/><div className="flex gap-2"><input aria-label="E-mail du membre" value={email} onChange={(event)=>setEmail(event.target.value)} placeholder="collaborateur@entreprise.fr" className="min-w-0 flex-1 rounded-xl border border-white/[.08] bg-white/[.03] px-4 py-3 text-sm outline-none"/><button onClick={invite} className="rounded-xl bg-[#7c5cff] px-4 py-2 text-xs font-bold">Inviter</button></div>{store.organizationMembers.map((member)=><Item key={member.id} title={member.displayName} text={member.email} meta={member.role}/>)}</Panel>
    <Panel title="État"><Item title="Dossiers" text={`${store.cases.length} dossier(s) cognitifs`} meta="READY"/><Item title="Audit" text={`${store.auditLogs.length} événement(s) collaboratif(s)`} meta="ACTIF"/><Item title="Exécution" text={`${store.actions.length} action(s) · ${store.agents.length} agents`} meta="READY"/></Panel>
    <Panel title="Modes de données"><button onClick={store.loadInvestorDemo} className="block w-full rounded-xl border border-white/[.08] bg-white/[.03] px-4 py-3 text-left text-sm">Restaurer la démo investisseur</button><button onClick={() => { if (window.confirm("Créer un espace vierge ? Les données locales actuelles seront remplacées.")) store.createBlankWorkspace(); }} className="mt-2 block w-full rounded-xl border border-white/[.08] bg-white/[.03] px-4 py-3 text-left text-sm">Créer un espace vierge</button><button onClick={() => store.resetRuntimeActions()} className="mt-2 block w-full rounded-xl border border-white/[.08] bg-white/[.03] px-4 py-3 text-left text-sm">Réinitialiser les actions</button><button onClick={() => active && store.clearConversationHistory(active.id)} className="mt-2 block w-full rounded-xl border border-white/[.08] bg-white/[.03] px-4 py-3 text-left text-sm">Effacer la conversation du dossier actif</button></Panel>
    <Panel title="Journal d’audit">{store.auditLogs.slice(0,8).map((log)=><Item key={log.id} title={log.action} text={log.summary} meta={new Date(log.createdAt).toLocaleDateString("fr-FR")}/>)}</Panel>
  </div></section>;
}

function stateLabel(state: CognitiveCase["state"]) { return { explore: "Exploration", decide: "Décision", execute: "Exécution", learn: "Apprentissage" }[state]; }
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[.14em] text-[#71839e]">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-white/[.08] bg-[#091422] px-4 py-3 text-sm outline-none placeholder:text-[#52647f]"/></label>; }
function Outcome({ eyebrow, title, text, onClick }: { eyebrow: string; title: string; text: string; onClick: () => void }) { return <button onClick={onClick} className="rounded-2xl border border-white/[.08] bg-[#0d192b]/88 p-4 text-left hover:border-[#7c5cff]/40"><span className="text-[10px] uppercase tracking-[.14em] text-[#7c92b2]">{eyebrow}</span><strong className="mt-2 block text-sm">{title}</strong><p className="mt-2 text-xs leading-5 text-[#8294af]">{text}</p></button>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <article className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/88 p-5 md:p-6"><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#9d83ff]">{title}</div><div className="mt-4 space-y-3">{children}</div></article>; }
function Item({ title, text, meta }: { title: string; text: string; meta: string }) { return <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex justify-between gap-3"><strong className="text-sm">{title}</strong><span className="text-[10px] uppercase text-[#667995]">{meta}</span></div><p className="mt-2 text-sm leading-6 text-[#91a2bd]">{text}</p></div>; }
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-white/[.06] bg-white/[.025] p-3"><span className="text-[10px] uppercase text-[#667995]">{label}</span><strong className="mt-1 block text-2xl">{value}</strong></div>; }
