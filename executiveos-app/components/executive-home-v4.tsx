"use client";

import { useMemo, useState } from "react";
import { ExecutiveRuntimePanel } from "@/components/executive-runtime-panel";
import { ExecutiveWorkspace } from "@/components/executive-workspace";
import { entityCounts, executiveTwinSeed } from "@/lib/executive-twin-domain";
import { buildCognitiveRecall } from "@/lib/cognitive-recall";
import { runUnifiedRuntime } from "@/lib/unified-runtime";
import { useExecutiveStore } from "@/store/executive-store";

type View = "home" | "understand" | "decision" | "act" | "explore" | "settings";
type BrainNode = {
  id: string;
  label: string;
  kind: string;
  status: "stable" | "active" | "watch";
  score: number;
  summary: string;
  detail: string;
  target: View;
  x: number;
  y: number;
};

const NAV: Array<{ id: View; label: string }> = [
  { id: "home", label: "Accueil" },
  { id: "understand", label: "Comprendre" },
  { id: "decision", label: "Décider" },
  { id: "act", label: "Agir" },
  { id: "explore", label: "Explorer" },
  { id: "settings", label: "Paramètres" },
];

export function ExecutiveHomeV4() {
  const [view, setView] = useState<View>("home");
  const [selectedId, setSelectedId] = useState("decisions");
  const [prompt, setPrompt] = useState("");
  const store = useExecutiveStore();
  const counts = useMemo(() => entityCounts(executiveTwinSeed), []);
  const briefing = executiveTwinSeed.briefing;

  const nodes = useMemo<BrainNode[]>(() => [
    { id: "goals", label: "Objectifs", kind: "Direction", status: "stable", score: 88, summary: `${store.cases.length} dossiers cognitifs actifs`, detail: "Les objectifs prioritaires restent compatibles avec la trajectoire produit actuelle.", target: "act", x: 18, y: 30 },
    { id: "decisions", label: "Décisions", kind: "Arbitrage", status: "active", score: Math.max(55, 92 - store.decisions.length * 2), summary: `${store.decisions.length} décision(s) mémorisée(s)`, detail: "Les décisions sont reliées aux dossiers, à leur justification et aux actions qui en découlent.", target: "decision", x: 46, y: 18 },
    { id: "actions", label: "Actions", kind: "Exécution", status: "active", score: Math.max(60, 94 - store.actions.filter((a) => a.status !== "done").length * 4), summary: `${store.actions.filter((a) => a.status !== "done").length} action(s) ouverte(s)`, detail: "Le Task Engine peut affecter, démarrer et exécuter les actions selon les capacités des agents.", target: "act", x: 74, y: 32 },
    { id: "memory", label: "Mémoire", kind: "Contexte", status: "stable", score: Math.min(96, 76 + store.memories.length * 3), summary: `${store.memories.length} mémoire(s) durable(s)`, detail: "Les mémoires, learnings et réflexions restituent le raisonnement accumulé.", target: "understand", x: 31, y: 67 },
    { id: "risk", label: "Risques", kind: "Vigilance", status: store.knowledgeRecords.some((r) => r.type === "risk") ? "watch" : "stable", score: Math.max(50, 94 - store.knowledgeRecords.filter((r) => r.type === "risk").length * 10), summary: `${store.knowledgeRecords.filter((r) => r.type === "risk").length} risque(s) explicite(s)`, detail: "Les risques restent visibles avant tout engagement irréversible et alimentent les réflexions.", target: "understand", x: 64, y: 68 },
  ], [store.cases.length, store.decisions.length, store.actions, store.memories.length, store.knowledgeRecords]);

  const selected = nodes.find((node) => node.id === selectedId) ?? nodes[0];
  const executiveScore = Math.round(nodes.reduce((sum, node) => sum + node.score, 0) / nodes.length);

  function submit() {
    const clean = prompt.trim();
    if (!clean) return;
    const active = store.cases.find((item) => item.id === store.activeCaseId) ?? store.cases[0];
    if (!active) return;
    const recall = buildCognitiveRecall({
      cognitiveCase: active,
      decisions: store.decisions,
      actions: store.actions,
      memories: store.memories,
      reasoningRevisions: store.reasoningRevisions,
      knowledgeEntities: store.knowledgeEntities,
      knowledgeRelations: store.knowledgeRelations,
      agentRuns: store.agentRuns
    });
    const result = runUnifiedRuntime({
      message: clean,
      cognitiveCase: active,
      agents: store.agents,
      memories: store.memories.filter((memory) => memory.caseId === active.id),
      knowledgeRecords: store.knowledgeRecords.filter((record) => record.caseId === active.id),
      recallSummary: recall.summary
    });
    store.applyRuntimeCycle({ caseId: active.id, userText: clean, result });
    setPrompt("");
    setView("decision");
  }

  return <div className="min-h-screen bg-[#07111f] text-white md:grid md:grid-cols-[248px_minmax(0,1fr)]">
    <aside className="sticky top-0 hidden h-screen flex-col border-r border-white/[.07] bg-[#091321] px-4 py-5 md:flex">
      <button onClick={() => setView("home")} className="mb-8 flex items-center gap-3 px-2 text-left"><span className="grid size-10 place-items-center rounded-[14px] bg-gradient-to-br from-[#9b82ff] to-[#5b39e7] text-sm font-black">EO</span><span><strong className="block text-[15px]">ExecutiveOS</strong><span className="text-[10px] uppercase tracking-[.12em] text-[#6f819e]">Cognitive OS</span></span></button>
      <nav className="space-y-1">{NAV.map((item) => <button key={item.id} onClick={() => setView(item.id)} className={`w-full rounded-xl px-3 py-2.5 text-left text-sm ${view === item.id ? "bg-white/[.08] text-white" : "text-[#8393ad] hover:bg-white/[.04]"}`}>{item.label}</button>)}</nav>
      <div className="mt-auto rounded-2xl border border-white/[.07] bg-white/[.025] p-3.5"><div className="flex items-center gap-2 text-xs text-[#a5b4c9]"><span className="size-2 rounded-full bg-[#42d59d]"/> ORION en ligne</div><p className="mt-2 text-[11px] leading-5 text-[#667995]">{store.agents.filter((agent) => agent.status === "online").length} agents · {store.events.length} événements runtime.</p></div>
    </aside>

    <div className="min-w-0">
      <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#07111f]/88 px-4 py-3 backdrop-blur-2xl md:px-7"><div className="mx-auto flex max-w-[1540px] items-center gap-3"><div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/[.08] bg-[#0d192b]/90 px-4 py-3"><span className="text-[#bfb2ff]">✦</span><input value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="Que souhaites-tu accomplir aujourd’hui ?" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#65758f]"/><button onClick={submit} className="rounded-lg bg-[#7c5cff] px-3 py-1.5 text-xs font-bold">ORION</button></div><div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#d7cfff] to-[#8b73ef] text-xs font-black text-[#1b1239]">SH</div></div></header>

      <main className="mx-auto max-w-[1540px] p-4 md:p-7 xl:p-9">
        {view === "home" && <Home nodes={nodes} selected={selected} selectedId={selectedId} onSelect={setSelectedId} score={executiveScore} onView={setView} />}
        {view === "decision" && <ExecutiveWorkspace />}
        {view === "understand" && <UnderstandPanel />}
        {view === "act" && <ExecutiveRuntimePanel mode="act" />}
        {view === "explore" && <ExecutiveRuntimePanel mode="explore" />}
        {view === "settings" && <SettingsPanel />}
      </main>
    </div>
  </div>;
}

function UnderstandPanel() {
  const store = useExecutiveStore();
  const active = store.cases.find((item) => item.id === store.activeCaseId) ?? store.cases[0];
  const memories = store.memories.filter((item) => item.caseId === active?.id);
  const learnings = store.learningEvents.filter((item) => item.caseId === active?.id);
  const reflections = store.reflections.filter((item) => item.caseId === active?.id);
  const profile = store.cognitiveProfiles.find((item) => item.caseId === active?.id);
  return <section>
    <div className="mb-6"><div className="text-[10px] font-black uppercase tracking-[.2em] text-[#7c92b2]">Memory & Reflection Engine</div><h1 className="mt-3 text-4xl font-semibold tracking-[-.035em]">Comprendre le contexte vivant.</h1><p className="mt-3 max-w-3xl text-lg leading-8 text-[#91a2bd]">Ce que tu sais, ce qui a changé, ce que tu as appris et les biais à surveiller pour <strong className="text-white">{active?.title}</strong>.</p></div>
    <div className="grid gap-4 md:grid-cols-4"><Metric label="Mémoires" value={String(memories.length)}/><Metric label="Learnings" value={String(learnings.length)}/><Metric label="Réflexions" value={String(reflections.length)}/><Metric label="Événements" value={String(store.events.length)}/></div>
    <div className="mt-6 grid gap-5 xl:grid-cols-2">
      <Panel title="Mémoire durable" tone="text-[#9d83ff]">{memories.map((memory) => <Item key={memory.id} title={memory.kind} text={memory.content} meta={`${memory.confidence}% confiance · ${memory.source}`}/>)}</Panel>
      <Panel title="Apprentissages" tone="text-[#42d59d]">{learnings.map((learning) => <Item key={learning.id} title={learning.title} text={learning.detail} meta={`${learning.significance} · ${learning.confidence ?? 0}%`}/>)}</Panel>
      <Panel title="Reflection Engine" tone="text-[#ffbc57]">{reflections.map((reflection) => <Item key={reflection.id} title={reflection.summary} text={[...reflection.learned, ...reflection.uncertainties.map((u) => `Incertitude : ${u}`)].join(" · ")} meta={`${reflection.confidence}% confiance`}/>)}</Panel>
      <Panel title="Cognitive DNA" tone="text-[#7de5bd]">{profile ? <><div className="grid grid-cols-2 gap-3"><Mini label="Calibration" value={profile.calibration}/><Mini label="Stabilité" value={profile.beliefStability}/><Mini label="Discipline risque" value={profile.riskDiscipline}/><Mini label="Qualité apprentissage" value={profile.learningQuality}/></div><div className="mt-4"><p className="text-xs uppercase tracking-[.12em] text-[#6f819e]">Patterns dominants</p><p className="mt-2 text-sm leading-6 text-[#c6d1e1]">{profile.dominantPatterns.join(" · ")}</p><p className="mt-4 text-xs uppercase tracking-[.12em] text-[#6f819e]">Signaux de biais</p><p className="mt-2 text-sm leading-6 text-[#ffd895]">{profile.biasSignals.join(" · ")}</p></div></> : <p className="text-sm text-[#71839e]">Profil en cours de constitution.</p>}</Panel>
    </div>
    <Panel title="Journal cognitif récent" tone="text-[#8fa0ba]" className="mt-5">{store.events.slice(0, 8).map((event) => <Item key={event.id} title={event.type} text={event.detail} meta={new Date(event.createdAt).toLocaleString("fr-FR")}/>)}</Panel>
  </section>;
}

function SettingsPanel() {
  const store = useExecutiveStore();
  const [memoryCapture, setMemoryCapture] = useState(true);
  const [agentOrchestration, setAgentOrchestration] = useState(true);
  const active = store.cases.find((item) => item.id === store.activeCaseId) ?? store.cases[0];
  return <section>
    <div className="mb-6"><div className="text-[10px] font-black uppercase tracking-[.2em] text-[#7c92b2]">System Settings & Diagnostics</div><h1 className="mt-3 text-4xl font-semibold tracking-[-.035em]">Configurer et tester ExecutiveOS.</h1><p className="mt-3 max-w-3xl text-lg leading-8 text-[#91a2bd]">Préférences de fonctionnement, état des moteurs et actions de diagnostic de la démonstration.</p></div>
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <Panel title="Comportements cognitifs" tone="text-[#9d83ff]"><Toggle label="Capture mémoire automatique" value={memoryCapture} onChange={setMemoryCapture}/><Toggle label="Orchestration multi-agents" value={agentOrchestration} onChange={setAgentOrchestration}/><div className="mt-4 rounded-xl border border-white/[.06] bg-white/[.02] p-3 text-xs leading-5 text-[#71839e]">Ces préférences pilotent la démonstration locale. La persistance cloud sera branchée dans la phase d’industrialisation.</div></Panel>
      <Panel title="Diagnostic runtime" tone="text-[#42d59d]"><Item title="Store canonique" text={`${store.cases.length} dossiers · ${store.decisions.length} décisions · ${store.actions.length} actions`} meta="READY"/><Item title="Knowledge Graph" text={`${store.knowledgeEntities.length} nœuds · ${store.knowledgeRelations.length} relations`} meta="READY"/><Item title="Executive Team" text={`${store.agents.filter((a) => a.status === "online").length}/${store.agents.length} agents en ligne`} meta="READY"/><Item title="Memory & Learning" text={`${store.memories.length} mémoires · ${store.learningEvents.length} learnings`} meta="READY"/></Panel>
      <Panel title="Actions de test" tone="text-[#ffbc57]" className="xl:col-span-2"><div className="flex flex-wrap gap-3"><button onClick={() => store.resetRuntimeActions()} className="rounded-xl border border-white/[.08] bg-white/[.03] px-4 py-3 text-sm font-semibold">Réinitialiser les actions de démo</button><button onClick={() => active && store.clearConversationHistory(active.id)} className="rounded-xl border border-white/[.08] bg-white/[.03] px-4 py-3 text-sm font-semibold">Effacer la conversation active</button><button onClick={() => store.applyCriticalSignal()} className="rounded-xl bg-[#7c5cff] px-4 py-3 text-sm font-bold">Injecter un signal critique</button></div><p className="mt-4 text-xs text-[#71839e]">Ces boutons écrivent réellement dans le store et permettent de vérifier transitions, événements et réactions du runtime.</p></Panel>
    </div>
  </section>;
}

function Home({ nodes, selected, selectedId, onSelect, score, onView }: { nodes: BrainNode[]; selected: BrainNode; selectedId: string; onSelect:(id:string)=>void; score:number; onView:(view:View)=>void }) {
  return <>
    <section className="mb-6"><div className="text-[10px] font-black uppercase tracking-[.2em] text-[#7c92b2]">Executive Home · UX2.5</div><h1 className="mt-3 text-3xl font-semibold tracking-[-.035em] md:text-5xl">Executive Brain</h1><p className="mt-2 max-w-3xl text-lg text-[#8fa0ba]">Une carte vivante de ce qui est stable, actif ou à surveiller. Clique sur un nœud pour comprendre son contexte et agir.</p></section>
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(330px,.6fr)]">
      <article className="rounded-[28px] border border-white/[.08] bg-[linear-gradient(145deg,rgba(19,31,51,.98),rgba(9,19,33,.98))] p-5 md:p-7">
        <div className="flex items-center justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#9d83ff]">Contexte vivant</div><h2 className="mt-2 text-2xl font-semibold">Executive Brain</h2></div><div className="rounded-2xl border border-white/[.07] bg-white/[.03] px-4 py-2 text-right"><span className="block text-[10px] uppercase tracking-[.14em] text-[#667995]">Executive Score</span><strong className="text-2xl">{score}</strong></div></div>
        <div className="relative mt-6 h-[430px] overflow-hidden rounded-[22px] border border-white/[.07] bg-[#08121f]"><div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_center,rgba(124,92,255,.35)_0,transparent_1.5px)] [background-size:28px_28px]" /><svg className="absolute inset-0 size-full" aria-hidden="true"><line x1="18%" y1="30%" x2="46%" y2="18%" stroke="rgba(124,92,255,.35)" strokeWidth="1.5"/><line x1="46%" y1="18%" x2="74%" y2="32%" stroke="rgba(124,92,255,.35)" strokeWidth="1.5"/><line x1="46%" y1="18%" x2="31%" y2="67%" stroke="rgba(124,92,255,.24)"/><line x1="74%" y1="32%" x2="64%" y2="68%" stroke="rgba(255,188,87,.3)"/><line x1="31%" y1="67%" x2="64%" y2="68%" stroke="rgba(66,213,157,.25)"/><line x1="18%" y1="30%" x2="31%" y2="67%" stroke="rgba(66,213,157,.2)"/></svg>{nodes.map((node) => <BrainNodeButton key={node.id} node={node} active={selectedId === node.id} onClick={() => onSelect(node.id)} />)}</div>
        <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-[#71839e]"><Legend dot="bg-[#42d59d]" label="Stable"/><Legend dot="bg-[#8f82ff]" label="Actif"/><Legend dot="bg-[#ffbc57]" label="À surveiller"/></div>
      </article>
      <aside className="rounded-[28px] border border-white/[.08] bg-[#0d192b]/88 p-6"><div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#6f819e]">{selected.kind}</div><h2 className="mt-2 text-2xl font-semibold">{selected.label}</h2></div><StatusBadge status={selected.status}/></div><div className="mt-6 flex items-end justify-between"><div><span className="text-[10px] uppercase tracking-[.13em] text-[#667995]">Santé du nœud</span><strong className="mt-1 block text-5xl">{selected.score}</strong></div><span className="text-sm text-[#8fa0ba]">/100</span></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full bg-gradient-to-r from-[#7657ff] to-[#42d59d]" style={{width:`${selected.score}%`}}/></div><div className="mt-6 rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><div className="text-[10px] font-black uppercase tracking-[.15em] text-[#7f91ab]">Lecture ORION</div><strong className="mt-2 block text-base">{selected.summary}</strong><p className="mt-2 text-sm leading-6 text-[#91a2bd]">{selected.detail}</p></div><button onClick={() => onView(selected.target)} className="mt-5 w-full rounded-xl bg-[#7c5cff] px-4 py-3 text-sm font-bold">Ouvrir le contexte →</button></aside>
    </section>
  </>;
}

function Panel({title, tone, className = "", children}:{title:string;tone:string;className?:string;children:React.ReactNode}) { return <article className={`rounded-[26px] border border-white/[.08] bg-[#0d192b]/88 p-5 md:p-6 ${className}`}><div className={`text-[10px] font-black uppercase tracking-[.16em] ${tone}`}>{title}</div><div className="mt-4 space-y-3">{children}</div></article>; }
function Item({title,text,meta}:{title:string;text:string;meta:string}) { return <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex flex-wrap items-start justify-between gap-2"><strong className="text-sm">{title}</strong><span className="text-[10px] uppercase tracking-[.1em] text-[#667995]">{meta}</span></div><p className="mt-2 text-sm leading-6 text-[#91a2bd]">{text}</p></div>; }
function Mini({label,value}:{label:string;value:number}) { return <div className="rounded-xl border border-white/[.06] bg-white/[.025] p-3"><span className="text-[10px] uppercase tracking-[.1em] text-[#667995]">{label}</span><strong className="mt-1 block text-2xl">{value}</strong></div>; }
function Toggle({label,value,onChange}:{label:string;value:boolean;onChange:(value:boolean)=>void}) { return <button onClick={() => onChange(!value)} className="flex w-full items-center justify-between rounded-2xl border border-white/[.07] bg-white/[.025] p-4 text-left"><span className="text-sm font-semibold">{label}</span><span className={`relative h-6 w-11 rounded-full ${value ? "bg-[#7c5cff]" : "bg-white/[.1]"}`}><span className={`absolute top-1 size-4 rounded-full bg-white transition ${value ? "left-6" : "left-1"}`}/></span></button>; }
function BrainNodeButton({ node, active, onClick }: {node:BrainNode;active:boolean;onClick:()=>void}) { const tone = node.status === "stable" ? "#42d59d" : node.status === "watch" ? "#ffbc57" : "#8f82ff"; return <button onClick={onClick} style={{left:`${node.x}%`, top:`${node.y}%`, borderColor:active ? tone : "rgba(255,255,255,.1)", boxShadow:active ? `0 0 0 4px ${tone}18, 0 14px 44px rgba(0,0,0,.35)` : undefined}} className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-[#0e1b2e]/95 px-4 py-3 text-left transition hover:scale-[1.03]"><div className="flex items-center gap-2"><span className="size-2 rounded-full" style={{background:tone, boxShadow:`0 0 16px ${tone}`}}/><strong className="text-sm">{node.label}</strong></div><span className="mt-1 block text-[10px] uppercase tracking-[.12em] text-[#6d7f9a]">{node.score}/100</span></button>; }
function StatusBadge({status}:{status:BrainNode["status"]}) { const map={stable:"Stable",active:"Actif",watch:"À surveiller"}; const cls=status==="stable"?"bg-[#42d59d]/10 text-[#7de5bd]":status==="watch"?"bg-[#ffbc57]/10 text-[#ffd895]":"bg-[#7c5cff]/12 text-[#c5bbff]"; return <span className={`rounded-full px-3 py-1 text-xs ${cls}`}>{map[status]}</span>; }
function Legend({dot,label}:{dot:string;label:string}) { return <span className="flex items-center gap-2"><span className={`size-2 rounded-full ${dot}`}/>{label}</span>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/[.08] bg-[#0d192b]/88 p-5"><span className="text-[10px] uppercase tracking-[.14em] text-[#667995]">{label}</span><strong className="mt-2 block text-3xl">{value}</strong></div>; }
