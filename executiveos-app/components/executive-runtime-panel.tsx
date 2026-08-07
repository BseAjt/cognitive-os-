"use client";

import { useMemo } from "react";
import { buildRuntimeGraph } from "@/lib/executive-runtime";
import { useExecutiveStore } from "@/store/executive-store";

export function ExecutiveRuntimePanel({ mode }: { mode: "act" | "explore" }) {
  const challenges = useExecutiveStore((state) => state.challenges);
  const decisions = useExecutiveStore((state) => state.decisions);
  const actions = useExecutiveStore((state) => state.actions);
  const agents = useExecutiveStore((state) => state.agents ?? []);
  const events = useExecutiveStore((state) => state.events);
  const assignRuntimeAction = useExecutiveStore((state) => state.assignRuntimeAction);
  const executeRuntimeAction = useExecutiveStore((state) => state.executeRuntimeAction);
  const transitionRuntimeAction = useExecutiveStore((state) => state.transitionRuntimeAction);

  const graph = useMemo(() => buildRuntimeGraph({ challenges, decisions, actions, agents, events }), [challenges, decisions, actions, agents, events]);

  if (mode === "explore") {
    return <section>
      <div className="mb-6">
        <div className="text-[10px] font-black uppercase tracking-[.2em] text-[#7c92b2]">Executive Runtime · Cognitive Graph</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-.035em]">Explorer le graphe vivant.</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-[#91a2bd]">La projection Phase 2 est désormais calculée depuis l’état réel du produit : challenges, décisions, actions, agents et événements.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Nœuds runtime" value={String(graph.stats.nodes)} />
        <Metric label="Relations runtime" value={String(graph.stats.edges)} />
        <Metric label="Agents actifs" value={String(agents.filter((agent) => agent.status === "online").length)} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <article className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/88 p-5 md:p-6">
          <div className="text-[10px] font-black uppercase tracking-[.16em] text-[#9d83ff]">Nœuds</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {graph.nodes.map((node) => <div key={node.id} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
              <div className="flex items-center justify-between gap-3"><strong className="text-sm">{node.label}</strong><span className="rounded-full bg-white/[.05] px-2 py-1 text-[10px] uppercase text-[#8496b0]">{node.type}</span></div>
              {node.status && <p className="mt-2 text-xs text-[#7487a4]">{node.status}</p>}
            </div>)}
          </div>
        </article>

        <article className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/88 p-5 md:p-6">
          <div className="text-[10px] font-black uppercase tracking-[.16em] text-[#42d59d]">Relations</div>
          <div className="mt-4 space-y-3">
            {graph.edges.length ? graph.edges.map((edge) => <div key={edge.id} className="rounded-xl border border-white/[.06] bg-white/[.02] p-3 text-xs leading-5 text-[#a8b6c9]">
              <span className="text-[#e2e8f1]">{edge.source}</span> <span className="text-[#7c92b2]">— {edge.type} →</span> <span className="text-[#e2e8f1]">{edge.target}</span>
            </div>) : <p className="text-sm text-[#71839e]">Les relations apparaîtront à mesure que décisions et actions seront créées.</p>}
          </div>
        </article>
      </div>
    </section>;
  }

  return <section>
    <div className="mb-6">
      <div className="text-[10px] font-black uppercase tracking-[.2em] text-[#7c92b2]">Executive Runtime · Phase 2 intégrée</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-.035em]">Transformer les décisions en exécution orchestrée.</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-[#91a2bd]">Chaque action possède une capacité requise, peut être affectée automatiquement à un agent compatible et suit une machine d’état contrôlée.</p>
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <article className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/88 p-5 md:p-6">
        <div className="flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#9d83ff]">Task Engine</div><h2 className="mt-2 text-2xl font-semibold">Actions runtime</h2></div><span className="rounded-full border border-white/[.07] bg-white/[.03] px-3 py-1 text-xs text-[#8294af]">{actions.length} tâche(s)</span></div>
        <div className="mt-5 space-y-3">
          {actions.map((action) => <div key={action.id} className="rounded-2xl border border-white/[.07] bg-[#091422]/85 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div><strong className="text-base">{action.title}</strong><p className="mt-1 text-xs text-[#71839e]">Capability: {action.requiredCapability ?? "analysis"} · Owner: {action.owner}</p>{action.blockedReason && <p className="mt-2 text-xs text-[#ffbc57]">{action.blockedReason}</p>}{action.result && <p className="mt-2 text-xs text-[#7de5bd]">{action.result}</p>}</div>
              <Status status={action.status}/>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full bg-gradient-to-r from-[#7657ff] to-[#42d59d]" style={{width:`${action.progress}%`}}/></div>
            <div className="mt-4 flex flex-wrap gap-2">
              {!action.assignedAgentId && action.status !== "done" && <button onClick={() => assignRuntimeAction(action.id)} className="rounded-lg border border-white/[.08] bg-white/[.03] px-3 py-2 text-xs font-semibold">Affecter</button>}
              {action.status === "todo" && <button onClick={() => transitionRuntimeAction(action.id, "doing")} className="rounded-lg border border-white/[.08] bg-white/[.03] px-3 py-2 text-xs font-semibold">Démarrer</button>}
              {(action.status === "todo" || action.status === "doing") && <button onClick={() => executeRuntimeAction(action.id)} className="rounded-lg bg-[#7c5cff] px-3 py-2 text-xs font-bold">Exécuter</button>}
              {action.status === "blocked" && <button onClick={() => transitionRuntimeAction(action.id, "todo")} className="rounded-lg border border-white/[.08] bg-white/[.03] px-3 py-2 text-xs font-semibold">Réouvrir</button>}
            </div>
          </div>)}
        </div>
      </article>

      <aside className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/88 p-5 md:p-6">
        <div className="text-[10px] font-black uppercase tracking-[.16em] text-[#42d59d]">Agent Contracts</div>
        <h2 className="mt-2 text-2xl font-semibold">Executive Team Runtime</h2>
        <div className="mt-5 space-y-3">
          {agents.map((agent) => <div key={agent.id} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
            <div className="flex items-start justify-between gap-3"><div><strong className="text-sm">{agent.name}</strong><p className="mt-1 text-xs text-[#7f91ab]">{agent.role}</p></div><span className={`size-2 rounded-full ${agent.status === "online" ? "bg-[#42d59d]" : agent.status === "busy" ? "bg-[#ffbc57]" : "bg-[#667995]"}`}/></div>
            <p className="mt-3 text-xs leading-5 text-[#91a2bd]">{agent.specialty}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">{agent.capabilities.map((capability) => <span key={capability} className="rounded-full bg-white/[.04] px-2 py-1 text-[10px] text-[#8091ab]">{capability}</span>)}</div>
            <p className="mt-3 text-[10px] text-[#5f718c]">contract v{agent.version}</p>
          </div>)}
        </div>
      </aside>
    </div>
  </section>;
}

function Status({ status }: { status: "todo" | "doing" | "done" | "blocked" }) {
  const map = { todo: "À faire", doing: "En cours", done: "Terminé", blocked: "Bloqué" };
  const cls = status === "done" ? "bg-[#42d59d]/10 text-[#7de5bd]" : status === "blocked" ? "bg-[#ffbc57]/10 text-[#ffd895]" : status === "doing" ? "bg-[#7c5cff]/12 text-[#c5bbff]" : "bg-white/[.05] text-[#8fa0ba]";
  return <span className={`rounded-full px-3 py-1 text-xs ${cls}`}>{map[status]}</span>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/[.08] bg-[#0d192b]/88 p-5"><span className="text-[10px] uppercase tracking-[.14em] text-[#667995]">{label}</span><strong className="mt-2 block text-3xl">{value}</strong></div>;
}
