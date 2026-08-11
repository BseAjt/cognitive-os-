"use client";

import { useMemo, useState } from "react";
import { ExecutiveWorkspace } from "@/components/executive-workspace";
import { entityCounts, executiveTwinSeed } from "@/lib/executive-twin-domain";

type View = "home" | "understand" | "decision" | "act" | "explore" | "settings";

const NAV: Array<{ id: View; label: string; icon: string }> = [
  { id: "home", label: "Accueil", icon: "⌂" },
  { id: "understand", label: "Comprendre", icon: "◫" },
  { id: "decision", label: "Décider", icon: "◇" },
  { id: "act", label: "Agir", icon: "✓" },
  { id: "explore", label: "Explorer", icon: "⌘" },
  { id: "settings", label: "Paramètres", icon: "⚙" }
];

export function ExecutiveTwinHome() {
  const [view, setView] = useState<View>("home");
  const [prompt, setPrompt] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const counts = useMemo(() => entityCounts(executiveTwinSeed), []);
  const briefing = executiveTwinSeed.briefing;

  function submitPrompt() {
    const clean = prompt.trim();
    if (!clean) return;
    setLastPrompt(clean);
    setPrompt("");
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <Sidebar view={view} onView={setView} />
      <div className="min-w-0">
        <ExecutiveBar prompt={prompt} onPrompt={setPrompt} onSubmit={submitPrompt} />
        <main className="mx-auto max-w-[1540px] p-4 md:p-7 xl:p-9">
          {lastPrompt && (
            <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-[#7c5cff]/25 bg-[#7c5cff]/8 px-4 py-3 text-sm">
              <span className="text-[#d9d3ff]">Assistant de décision prépare : <strong>{lastPrompt}</strong></span>
              <button onClick={() => setLastPrompt("")} className="text-[#8fa0ba] hover:text-white">×</button>
            </div>
          )}
          {view === "home" && <Home briefing={briefing} counts={counts} onView={setView} />}
          {view === "understand" && <UnderstandView />}
          {view === "decision" && <ExecutiveWorkspace />}
          {view === "act" && <ActionView />}
          {view === "explore" && <ExploreView />}
          {view === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ view, onView }: { view: View; onView: (view: View) => void }) {
  return (
    <aside className="sticky top-0 z-40 hidden h-screen flex-col border-r border-white/[.07] bg-[#091321] px-4 py-5 md:flex">
      <button onClick={() => onView("home")} className="mb-8 flex items-center gap-3 px-2 text-left">
        <span className="grid size-10 place-items-center rounded-[14px] bg-gradient-to-br from-[#9b82ff] to-[#5b39e7] text-sm font-black shadow-[0_10px_40px_rgba(124,92,255,.28)]">EO</span>
        <span><strong className="block text-[15px] tracking-tight">ExecutiveOS</strong><span className="text-[10px] uppercase tracking-[.12em] text-[#6f819e]">Cognitive OS</span></span>
      </button>

      <nav className="space-y-1">
        {NAV.map((item) => (
          <button key={item.id} onClick={() => onView(item.id)} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${view === item.id ? "bg-white/[.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.04)]" : "text-[#8393ad] hover:bg-white/[.04] hover:text-[#dbe4f3]"}`}>
            <span className={`grid size-7 place-items-center rounded-lg text-xs ${view === item.id ? "bg-[#7c5cff]/18 text-[#c6bbff]" : "text-[#65758e]"}`}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/[.07] bg-white/[.025] p-3.5">
        <div className="flex items-center gap-2 text-xs text-[#a5b4c9]"><span className="size-2 rounded-full bg-[#42d59d] shadow-[0_0_14px_rgba(66,213,157,.65)]" /> Assistant de décision en ligne</div>
        <p className="mt-2 text-[11px] leading-5 text-[#667995]">Mémoire, raisonnement et contexte synchronisés.</p>
      </div>
    </aside>
  );
}

function ExecutiveBar({ prompt, onPrompt, onSubmit }: { prompt: string; onPrompt: (value: string) => void; onSubmit: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#07111f]/88 px-4 py-3 backdrop-blur-2xl md:px-7">
      <div className="mx-auto flex max-w-[1540px] items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/[.08] bg-[#0d192b]/90 px-4 py-3 shadow-[0_16px_50px_rgba(0,0,0,.16)] focus-within:border-[#7c5cff]/45">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#7c5cff]/15 text-xs font-black text-[#bfb2ff]">✦</span>
          <input value={prompt} onChange={(event) => onPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onSubmit(); }} placeholder="Que souhaites-tu accomplir aujourd’hui ?" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#65758f]" />
          <span className="hidden text-[10px] text-[#596b86] sm:inline">↵ envoyer</span>
        </div>
        <button className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/[.08] bg-[#0d192b] text-sm text-[#9eacc1] hover:text-white">⌕</button>
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#d7cfff] to-[#8b73ef] text-xs font-black text-[#1b1239]">SH</div>
      </div>
    </header>
  );
}

function Home({ briefing, counts, onView }: { briefing: typeof executiveTwinSeed.briefing; counts: Record<string, number>; onView: (view: View) => void }) {
  return (
    <>
      <section className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.2em] text-[#7c92b2]">Vendredi · Executive briefing</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.035em] md:text-5xl">Bonjour Sébastien.</h1>
          <p className="mt-2 max-w-2xl text-base text-[#8fa0ba] md:text-lg">Voici ce qui mérite réellement ton attention.</p>
        </div>
        <button onClick={() => onView("understand")} className="self-start rounded-xl border border-white/[.09] bg-white/[.04] px-4 py-2.5 text-sm text-[#c8d3e4] transition hover:bg-white/[.07] xl:self-auto">Voir le contexte complet →</button>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(330px,.7fr)]">
        <article className="relative overflow-hidden rounded-[26px] border border-white/[.08] bg-[linear-gradient(145deg,rgba(19,31,51,.96),rgba(10,20,35,.98))] p-6 shadow-[0_24px_80px_rgba(0,0,0,.18)] md:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[#7657ff]/10 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2"><Pill>REPRENDRE</Pill><span className="text-xs text-[#6f819e]">Dernière activité · aujourd’hui</span></div>
            <h2 className="mt-5 max-w-3xl text-2xl font-semibold tracking-[-.025em] md:text-4xl">Tu travaillais sur la prochaine étape d’ExecutiveOS.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#93a4bd] md:text-base">Le branding est stabilisé, le déploiement principal fonctionne et le chantier UX est devenu la priorité. Tu peux continuer sans reconstruire le contexte.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <ContextStat label="Décisions" value={briefing.openDecisions} detail="ouvertes" />
              <ContextStat label="Risques" value={briefing.criticalRisks} detail="à surveiller" />
              <ContextStat label="Connaissances" value={briefing.newKnowledge} detail="nouvelles" />
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => onView("decision")} className="rounded-xl bg-[#7c5cff] px-5 py-3 text-sm font-bold shadow-[0_12px_32px_rgba(124,92,255,.28)] transition hover:bg-[#8a6cff]">Continuer là où tu t’étais arrêté</button>
              <button onClick={() => onView("understand")} className="rounded-xl border border-white/[.09] bg-white/[.035] px-5 py-3 text-sm text-[#bdc9da] hover:bg-white/[.06]">Comprendre le contexte</button>
            </div>
          </div>
        </article>

        <article className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/88 p-6">
          <div className="flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#42d59d]">System health</div><div className="mt-2 text-4xl font-semibold">{briefing.twinHealth}<span className="text-xl text-[#71839e]">%</span></div></div><span className="rounded-full bg-[#42d59d]/10 px-3 py-1 text-xs text-[#7de5bd]">Stable</span></div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-gradient-to-r from-[#7657ff] via-[#8797ff] to-[#42d59d]" style={{ width: `${briefing.twinHealth}%` }} /></div>
          <div className="mt-6 space-y-4">
            <HealthRow label="Mémoire" value="Synchronisée" tone="good" />
            <HealthRow label="Raisonnement" value="Actif" tone="good" />
            <HealthRow label="Objectifs" value="1 à surveiller" tone="watch" />
            <HealthRow label="Contexte" value="Enrichi" tone="good" />
          </div>
        </article>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <article className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/78 p-6">
          <div className="flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.18em] text-[#ffbc57]">Priorités</div><h2 className="mt-2 text-xl font-semibold">Ce qui mérite ton attention</h2></div><span className="text-xs text-[#667995]">4 éléments</span></div>
          <div className="mt-4 divide-y divide-white/[.06]">
            <Priority rank="01" label="Décider" title="Arbitrer la roadmap UX d’ExecutiveOS" meta="Impact élevé · aujourd’hui" onClick={() => onView("decision")} />
            <Priority rank="02" label="Agir" title="Stabiliser le déploiement Vercel" meta="Technique · en cours" onClick={() => onView("act")} />
            <Priority rank="03" label="Comprendre" title="Consolider les signaux du Cognitive Twin" meta="Contexte · 3 sources" onClick={() => onView("understand")} />
            <Priority rank="04" label="Explorer" title="Examiner les nouvelles relations du graphe" meta="6 nouvelles connexions" onClick={() => onView("explore")} />
          </div>
        </article>

        <article className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/78 p-6">
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-[#9d83ff]">Executive Brain</div>
          <h2 className="mt-2 text-xl font-semibold">Ton contexte vivant</h2>
          <p className="mt-2 text-sm leading-6 text-[#7e90aa]">Une lecture simple de ce qui est stable, actif ou à réévaluer.</p>
          <div className="relative mt-7 h-48 overflow-hidden rounded-2xl border border-white/[.06] bg-[#091422]">
            <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,rgba(124,92,255,.25)_0,transparent_2px)] [background-size:28px_28px]" />
            <BrainNode className="left-[12%] top-[30%]" label="Objectifs" status="stable" />
            <BrainNode className="left-[39%] top-[18%]" label="Décisions" status="active" />
            <BrainNode className="left-[66%] top-[31%]" label="Actions" status="active" />
            <BrainNode className="left-[28%] top-[62%]" label="Mémoire" status="stable" />
            <BrainNode className="left-[58%] top-[64%]" label="Risques" status="watch" />
            <svg className="absolute inset-0 size-full" aria-hidden="true"><line x1="24%" y1="38%" x2="47%" y2="28%" stroke="rgba(124,92,255,.3)"/><line x1="48%" y1="29%" x2="70%" y2="39%" stroke="rgba(124,92,255,.3)"/><line x1="44%" y1="32%" x2="35%" y2="68%" stroke="rgba(124,92,255,.22)"/><line x1="69%" y1="43%" x2="63%" y2="69%" stroke="rgba(255,188,87,.25)"/><line x1="36%" y1="69%" x2="60%" y2="70%" stroke="rgba(66,213,157,.2)"/></svg>
          </div>
          <div className="mt-4 flex gap-4 text-[11px] text-[#71839e]"><Legend tone="bg-[#42d59d]" label="Stable"/><Legend tone="bg-[#8f78ff]" label="Actif"/><Legend tone="bg-[#ffbc57]" label="À revoir"/></div>
        </article>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickLink title="Comprendre" detail={`${counts.memory ?? 0} mémoires reliées`} onClick={() => onView("understand")} />
        <QuickLink title="Décider" detail={`${briefing.openDecisions} décisions ouvertes`} onClick={() => onView("decision")} />
        <QuickLink title="Agir" detail={`${briefing.dueCommitments} engagements`} onClick={() => onView("act")} />
        <QuickLink title="Explorer" detail={`${executiveTwinSeed.relations.length} relations`} onClick={() => onView("explore")} />
      </section>
    </>
  );
}

function UnderstandView() {
  const memories = executiveTwinSeed.entities.filter((item) => ["memory", "learning", "context_item"].includes(item.type));
  return <WorkspaceTitle eyebrow="Comprendre" title="Le contexte avant la conclusion" description="ExecutiveOS réunit ici faits, hypothèses, apprentissages et éléments de contexte sans exposer les moteurs techniques."><div className="grid gap-4 md:grid-cols-2">{memories.map((item) => <article key={item.id} className="rounded-2xl border border-white/[.08] bg-[#0d192b] p-5"><div className="flex justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-[.16em] text-[#9d83ff]">{item.type.replaceAll("_", " ")}</span><span className="text-xs text-[#657792]">{item.status}</span></div><h2 className="mt-3 text-lg font-semibold">{item.title}</h2><p className="mt-3 text-sm text-[#7f91aa]">Source : {item.source}</p></article>)}</div></WorkspaceTitle>;
}

function ExploreView() {
  return <WorkspaceTitle eyebrow="Explorer" title="Le contexte relié" description="Explore les relations utiles sans manipuler un graphe technique."><div className="rounded-2xl border border-white/[.08] bg-[#0d192b] p-5"><div className="grid min-w-[760px] grid-cols-[1fr_auto_1fr] gap-3 overflow-auto">{executiveTwinSeed.relations.slice(0, 10).map((edge) => { const source = executiveTwinSeed.entities.find((item) => item.id === edge.sourceId); const target = executiveTwinSeed.entities.find((item) => item.id === edge.targetId); return <div key={edge.id} className="contents"><div className="rounded-xl border border-white/[.07] bg-white/[.025] p-3 text-sm">{source?.title}</div><div className="grid place-items-center px-2 text-[10px] font-black text-[#9d83ff]">{edge.relationType}</div><div className="rounded-xl border border-white/[.07] bg-white/[.025] p-3 text-sm">{target?.title}</div></div>; })}</div></div></WorkspaceTitle>;
}

function ActionView() {
  return <WorkspaceTitle eyebrow="Agir" title="Transformer les décisions en mouvement" description="Les prochaines actions, engagements et blocages seront consolidés ici par ordre d’impact."><div className="grid gap-4 md:grid-cols-3"><PlaceholderCard label="Aujourd’hui" value="3" detail="actions prioritaires"/><PlaceholderCard label="Bloqué" value="1" detail="dépendance à lever"/><PlaceholderCard label="Cette semaine" value="5" detail="engagements à suivre"/></div></WorkspaceTitle>;
}

function SettingsView() {
  return <WorkspaceTitle eyebrow="Paramètres" title="Préférences ExecutiveOS" description="Les réglages d’espace, de confidentialité et de comportement d’Assistant de décision seront regroupés ici."><div className="rounded-2xl border border-white/[.08] bg-[#0d192b] p-6 text-sm text-[#8496af]">UX1 pose le shell et la navigation. Les préférences détaillées seront branchées sur les services existants lors d’une itération dédiée.</div></WorkspaceTitle>;
}

function WorkspaceTitle({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <section><div className="mb-7"><div className="text-[10px] font-black uppercase tracking-[.2em] text-[#9d83ff]">{eyebrow}</div><h1 className="mt-3 text-3xl font-semibold tracking-[-.03em] md:text-5xl">{title}</h1><p className="mt-3 max-w-3xl text-[#8193ad]">{description}</p></div>{children}</section>;
}

function Pill({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-[#7c5cff]/12 px-3 py-1 text-[10px] font-black tracking-[.15em] text-[#b9adff]">{children}</span>; }
function ContextStat({ label, value, detail }: { label: string; value: number; detail: string }) { return <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><span className="text-[11px] text-[#71839d]">{label}</span><div className="mt-1 text-2xl font-semibold">{value}</div><span className="text-[11px] text-[#667993]">{detail}</span></div>; }
function HealthRow({ label, value, tone }: { label: string; value: string; tone: "good" | "watch" }) { return <div className="flex items-center justify-between text-sm"><span className="text-[#7e90aa]">{label}</span><span className="flex items-center gap-2 text-[#c5d0df]"><span className={`size-1.5 rounded-full ${tone === "good" ? "bg-[#42d59d]" : "bg-[#ffbc57]"}`} />{value}</span></div>; }
function Priority({ rank, label, title, meta, onClick }: { rank: string; label: string; title: string; meta: string; onClick: () => void }) { return <button onClick={onClick} className="flex w-full items-center gap-4 py-4 text-left transition hover:translate-x-1"><span className="text-xs font-semibold text-[#50627e]">{rank}</span><div className="min-w-0 flex-1"><div className="text-[10px] font-black uppercase tracking-[.13em] text-[#8f79ff]">{label}</div><div className="mt-1 truncate text-sm font-semibold md:text-base">{title}</div><div className="mt-1 text-xs text-[#657792]">{meta}</div></div><span className="text-[#52647f]">→</span></button>; }
function BrainNode({ className, label, status }: { className: string; label: string; status: "stable" | "active" | "watch" }) { const tone = status === "stable" ? "border-[#42d59d]/35 bg-[#42d59d]/10 text-[#9ce9cc]" : status === "watch" ? "border-[#ffbc57]/35 bg-[#ffbc57]/10 text-[#ffdb9e]" : "border-[#8f78ff]/40 bg-[#7c5cff]/13 text-[#c6bbff]"; return <div className={`absolute z-10 rounded-xl border px-3 py-2 text-[10px] font-bold shadow-xl backdrop-blur ${tone} ${className}`}>{label}</div>; }
function Legend({ tone, label }: { tone: string; label: string }) { return <span className="flex items-center gap-1.5"><span className={`size-1.5 rounded-full ${tone}`} />{label}</span>; }
function QuickLink({ title, detail, onClick }: { title: string; detail: string; onClick: () => void }) { return <button onClick={onClick} className="rounded-2xl border border-white/[.07] bg-[#0b1728] p-4 text-left transition hover:-translate-y-0.5 hover:border-white/[.12] hover:bg-[#0f1c30]"><div className="flex items-center justify-between"><strong className="text-sm">{title}</strong><span className="text-[#586b87]">↗</span></div><p className="mt-1.5 text-xs text-[#687b96]">{detail}</p></button>; }
function PlaceholderCard({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="rounded-2xl border border-white/[.08] bg-[#0d192b] p-5"><div className="text-xs text-[#73859f]">{label}</div><div className="mt-2 text-4xl font-semibold">{value}</div><div className="mt-1 text-sm text-[#657792]">{detail}</div></div>; }
