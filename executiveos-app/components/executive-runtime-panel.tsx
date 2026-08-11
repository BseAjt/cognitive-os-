"use client";

import { useMemo, useState } from "react";
import { buildRuntimeGraph } from "@/lib/executive-runtime";
import { useExecutiveStore } from "@/store/executive-store";

export function ExecutiveRuntimePanel({ mode }: { mode: "act" | "explore" }) {
  const cases = useExecutiveStore((state) => state.cases);
  const activeCaseId = useExecutiveStore((state) => state.activeCaseId);
  const decisions = useExecutiveStore((state) => state.decisions);
  const actions = useExecutiveStore((state) => state.actions);
  const agents = useExecutiveStore((state) => state.agents ?? []);
  const events = useExecutiveStore((state) => state.events);
  const kernelTransactions = useExecutiveStore((state) => state.kernelTransactions ?? []);
  const kernelEvents = useExecutiveStore((state) => state.kernelEvents ?? []);
  const assignRuntimeAction = useExecutiveStore((state) => state.assignRuntimeAction);
  const startRuntimeAction = useExecutiveStore((state) => state.startRuntimeAction);
  const executeRuntimeAction = useExecutiveStore((state) => state.executeRuntimeAction);
  const transitionRuntimeAction = useExecutiveStore((state) => state.transitionRuntimeAction);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [executionFeedback, setExecutionFeedback] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);

  function handleStart(actionId: string) {
    setExecutingActionId(actionId);
    setExecutionFeedback(null);
    try {
      startRuntimeAction(actionId);
      const after = useExecutiveStore.getState().actions.find((item) => item.id === actionId);
      if (!after) throw new Error("L’action a disparu du store après préparation.");
      setExecutionFeedback(after.status === "blocked"
        ? { tone: "warning", text: `${after.title} — préparation bloquée. ${after.blockedReason ?? "Consultez la trace Kernel."}` }
        : { tone: "success", text: `${after.title} — ORION a produit le cadrage d’exécution et enregistré sa trace.` });
    } catch (error) {
      setExecutionFeedback({ tone: "error", text: error instanceof Error ? error.message : "Erreur inattendue pendant la préparation." });
    } finally {
      setExecutingActionId(null);
    }
  }

  const graph = useMemo(() => buildRuntimeGraph({ cases, decisions, actions, agents, events }), [cases, decisions, actions, agents, events]);
  const activeKernelTransactions = useMemo(
    () => kernelTransactions.filter((transaction) => transaction.caseId === activeCaseId).slice(0, 8),
    [kernelTransactions, activeCaseId]
  );
  const activeActions = useMemo(
    () => actions.filter((action) => action.caseId === activeCaseId),
    [actions, activeCaseId]
  );
  const kernelStats = useMemo(() => {
    const completed = activeKernelTransactions.filter((item) => item.status === "completed").length;
    const blocked = activeKernelTransactions.filter((item) => item.status === "blocked").length;
    const failed = activeKernelTransactions.filter((item) => item.status === "failed").length;
    return { completed, blocked, failed };
  }, [activeKernelTransactions]);

  function handleExecute(actionId: string) {
    const before = useExecutiveStore.getState().actions.find((item) => item.id === actionId);
    if (!before) {
      setExecutionFeedback({ tone: "error", text: "Action introuvable dans le runtime." });
      return;
    }

    setExecutingActionId(actionId);
    setExecutionFeedback(null);

    try {
      executeRuntimeAction(actionId);
      const after = useExecutiveStore.getState().actions.find((item) => item.id === actionId);

      if (!after) {
        setExecutionFeedback({ tone: "error", text: "L’action a disparu du store après exécution." });
      } else if (after.status === "done") {
        setExecutionFeedback({ tone: "success", text: `${after.title} — terminée à 100%. ${after.result ?? "Exécution enregistrée."}` });
      } else if (after.status === "blocked") {
        setExecutionFeedback({ tone: "warning", text: `${after.title} — bloquée. ${after.blockedReason ?? "Aucun agent compatible n’est disponible."}` });
      } else if (after.status !== before.status || after.progress !== before.progress) {
        setExecutionFeedback({ tone: "success", text: `${after.title} — ${after.status}, progression ${after.progress}%.` });
      } else {
        setExecutionFeedback({ tone: "warning", text: `${after.title} — aucun changement d’état détecté. Vérifie l’affectation et la capacité requise.` });
      }
    } catch (error) {
      setExecutionFeedback({ tone: "error", text: error instanceof Error ? error.message : "Erreur inattendue pendant l’exécution." });
    } finally {
      setExecutingActionId(null);
    }
  }

  if (mode === "explore") {
    return <section>
      <div className="mb-6">
        <div className="text-[10px] font-black uppercase tracking-[.2em] text-[#7c92b2]">Executive Runtime · Cognitive Graph</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-.035em]">Explorer le graphe vivant.</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-[#91a2bd]">La projection Phase 2 est désormais calculée depuis l’état réel du produit : dossiers cognitifs, décisions, actions, agents et événements.</p>
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

    {executionFeedback && <div role="status" aria-live="polite" className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${executionFeedback.tone === "success" ? "border-[#42d59d]/30 bg-[#42d59d]/10 text-[#9af0cf]" : executionFeedback.tone === "warning" ? "border-[#ffbc57]/30 bg-[#ffbc57]/10 text-[#ffd895]" : "border-[#ff6b7a]/30 bg-[#ff6b7a]/10 text-[#ffb4bd]"}`}>{executionFeedback.text}</div>}

    <article className="mb-5 rounded-[26px] border border-white/[.08] bg-[#0d192b]/88 p-5 md:p-6" data-testid="kernel-observability">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#b7a9ff]">Executive Kernel · Observability</div><h2 className="mt-2 text-2xl font-semibold">Cycles ORION exécutés par le Kernel</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#8294af]">Chaque cycle expose sa transaction, les étapes traversées et la raison exacte d’un éventuel blocage.</p></div>
        <div className="flex gap-2 text-[11px]"><span className="rounded-full bg-[#42d59d]/10 px-3 py-1.5 text-[#9af0cf]">{kernelStats.completed} terminé(s)</span><span className="rounded-full bg-[#ffbc57]/10 px-3 py-1.5 text-[#ffd895]">{kernelStats.blocked} bloqué(s)</span><span className="rounded-full bg-[#ff6b7a]/10 px-3 py-1.5 text-[#ffb4bd]">{kernelStats.failed} erreur(s)</span></div>
      </div>
      <div className="mt-5 space-y-3">
        {activeKernelTransactions.length ? activeKernelTransactions.map((transaction) => {
          const trace = kernelEvents.filter((event) => event.transactionId === transaction.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          const expanded = expandedTransactionId === transaction.id;
          return <div key={transaction.id} className="rounded-2xl border border-white/[.07] bg-[#091422]/85 p-4">
            <button onClick={() => setExpandedTransactionId(expanded ? null : transaction.id)} className="flex w-full flex-col gap-3 text-left md:flex-row md:items-center md:justify-between">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><KernelStatus status={transaction.status}/><span className="font-mono text-[10px] text-[#627590]">tx:{transaction.id.slice(0, 8)}</span></div><p className="mt-2 text-xs text-[#91a2bd]">{transaction.completedStages.length} étape(s) complétée(s) · {transaction.blockedStages.length} bloquée(s) · {transaction.eventCount} événement(s)</p></div>
              <span className="text-xs font-semibold text-[#b7a9ff]">{expanded ? "Masquer la trace ↑" : "Voir la trace ↓"}</span>
            </button>
            {expanded && <div className="mt-4 border-t border-white/[.06] pt-4"><div className="space-y-2">{trace.map((event, index) => <div key={event.id} className="grid gap-2 rounded-xl bg-white/[.025] p-3 text-xs md:grid-cols-[28px_150px_1fr]"><span className="grid size-7 place-items-center rounded-full bg-white/[.05] text-[10px] text-[#8294af]">{index + 1}</span><div><strong className="block text-[#d7def0]">{event.stage ?? event.type}</strong><span className="mt-1 block text-[10px] uppercase tracking-[.08em] text-[#647792]">{event.status}</span></div><p className="leading-5 text-[#91a2bd]">{event.detail}</p></div>)}</div></div>}
          </div>;
        }) : <div className="rounded-2xl border border-dashed border-white/[.08] p-5 text-sm text-[#71839e]">Aucune transaction Kernel pour ce dossier. Le prochain cycle ORION apparaîtra ici automatiquement.</div>}
      </div>
    </article>

    <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <article className="rounded-[26px] border border-white/[.08] bg-[#0d192b]/88 p-5 md:p-6">
        <div className="flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#9d83ff]">Task Engine</div><h2 className="mt-2 text-2xl font-semibold">Actions runtime</h2></div><span className="rounded-full border border-white/[.07] bg-white/[.03] px-3 py-1 text-xs text-[#8294af]">{activeActions.length} tâche(s)</span></div>
        <div className="mt-5 space-y-3">
          {activeActions.map((action) => {
            const detailExpanded = expandedActionId === action.id;
            return <div key={action.id} className="rounded-2xl border border-white/[.07] bg-[#091422]/85 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0"><strong className="block text-base leading-6">{action.title}</strong><p className="mt-1 text-sm text-[#71839e]">Responsable : {action.owner}</p>{action.blockedReason && <p className="mt-2 text-sm leading-6 text-[#ffbc57]">{action.blockedReason}</p>}{action.result && <div className="mt-3 rounded-xl border border-emerald-800/15 bg-emerald-50/70 p-3"><p className={`${detailExpanded ? "" : "line-clamp-3"} text-sm leading-6 text-emerald-900`}>{action.result}</p><button type="button" aria-expanded={detailExpanded} onClick={() => setExpandedActionId(detailExpanded ? null : action.id)} className="mt-2 min-h-11 text-sm font-semibold text-[#0568c9]">{detailExpanded ? "Masquer le détail" : "Voir le détail"}</button></div>}</div>
              <Status status={action.status}/>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full bg-gradient-to-r from-[#7657ff] to-[#42d59d] transition-[width] duration-300" style={{width:`${action.progress}%`}}/></div>
            <div className="mt-4 flex flex-wrap gap-2">
              {!action.assignedAgentId && action.status !== "done" && <button onClick={() => assignRuntimeAction(action.id)} className="rounded-lg border border-white/[.08] bg-white/[.03] px-3 py-2 text-xs font-semibold">Affecter</button>}
              {action.status === "todo" && <button onClick={() => handleStart(action.id)} disabled={executingActionId === action.id} className="rounded-lg border border-white/[.08] bg-white/[.03] px-3 py-2 text-xs font-semibold disabled:cursor-wait disabled:opacity-60">{executingActionId === action.id ? "Préparation…" : "Démarrer avec ORION"}</button>}
              {(action.status === "todo" || action.status === "doing") && <button onClick={() => handleExecute(action.id)} disabled={executingActionId === action.id} className="rounded-lg bg-[#7c5cff] px-3 py-2 text-xs font-bold disabled:cursor-wait disabled:opacity-60">{executingActionId === action.id ? "Exécution…" : "Exécuter"}</button>}
              {action.status === "blocked" && <button onClick={() => transitionRuntimeAction(action.id, "todo")} className="rounded-lg border border-white/[.08] bg-white/[.03] px-3 py-2 text-xs font-semibold">Réouvrir</button>}
            </div>
          </div>})}
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

function KernelStatus({ status }: { status: "running" | "completed" | "blocked" | "failed" }) {
  const label = { running: "En cours", completed: "Terminé", blocked: "Bloqué", failed: "Échec" }[status];
  const cls = status === "completed" ? "bg-[#42d59d]/10 text-[#9af0cf]" : status === "blocked" ? "bg-[#ffbc57]/10 text-[#ffd895]" : status === "failed" ? "bg-[#ff6b7a]/10 text-[#ffb4bd]" : "bg-[#7c5cff]/12 text-[#c5bbff]";
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] ${cls}`}>{label}</span>;
}

function Status({ status }: { status: "todo" | "doing" | "done" | "blocked" }) {
  const map = { todo: "À faire", doing: "En cours", done: "Terminé", blocked: "Bloqué" };
  const cls = status === "done" ? "bg-[#42d59d]/10 text-[#7de5bd]" : status === "blocked" ? "bg-[#ffbc57]/10 text-[#ffd895]" : status === "doing" ? "bg-[#7c5cff]/12 text-[#c5bbff]" : "bg-white/[.05] text-[#8fa0ba]";
  return <span className={`rounded-full px-3 py-1 text-xs ${cls}`}>{map[status]}</span>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/[.08] bg-[#0d192b]/88 p-5"><span className="text-[10px] uppercase tracking-[.14em] text-[#667995]">{label}</span><strong className="mt-2 block text-3xl">{value}</strong></div>;
}
