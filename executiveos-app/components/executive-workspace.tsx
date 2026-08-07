"use client";

import { DecisionWorkbench } from "@/components/decision-workbench";
import { ConversationPanel } from "@/components/workspace/conversation-panel";
import { DecisionLedger, OpenActions } from "@/components/workspace/ledger-panels";
import { ReasoningPanel } from "@/components/workspace/reasoning-panel";
import { WorkspaceHeader, WorkspaceSidebar } from "@/components/workspace/workspace-shell";
import { useExecutiveWorkspace } from "@/hooks/use-executive-workspace";

export function ExecutiveWorkspace() {
  const workspace = useExecutiveWorkspace();

  return (
    <div className="grid min-h-screen grid-cols-[270px_1fr] max-md:grid-cols-1">
      <WorkspaceSidebar
        challenges={workspace.rankedChallenges}
        activeId={workspace.activeChallenge.id}
        onSelect={workspace.selectChallenge}
      />

      <main className="min-w-0">
        <WorkspaceHeader
          title={workspace.activeChallenge.title}
          showGraph={workspace.showGraph}
          onToggleGraph={() => workspace.setShowGraph((value) => !value)}
          onCriticalSignal={workspace.runCriticalSimulation}
        />

        <section className="mx-auto max-w-[1550px] p-6">
          <div className="mb-5">
            <div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">EXECUTIVE CONVERSATION</div>
            <h1 className="mt-2 text-4xl font-bold">Que souhaites-tu résoudre aujourd’hui ?</h1>
            <p className="mt-2 text-[#91a2bd]">Parle naturellement. ExecutiveOS structure le raisonnement et ouvre un espace de travail interactif pour les décisions.</p>
          </div>

          <div className={`grid gap-5 ${workspace.showGraph ? "grid-cols-[1.15fr_.85fr] max-xl:grid-cols-1" : "grid-cols-1"}`}>
            <ConversationPanel
              messages={workspace.messages}
              input={workspace.input}
              onInput={workspace.setInput}
              onSubmit={workspace.processMessage}
            />
            {workspace.showGraph ? (
              <ReasoningPanel
                challenge={workspace.activeChallenge}
                nextAction={workspace.lastNextAction}
                extractions={workspace.lastExtractions}
              />
            ) : null}
          </div>

          {workspace.decisionFrame ? (
            <DecisionWorkbench
              frame={workspace.decisionFrame}
              onContextSubmit={workspace.processMessage}
              onCreateAction={workspace.createAction}
            />
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-5 max-lg:grid-cols-1">
            <DecisionLedger decisions={workspace.decisions} />
            <OpenActions actions={workspace.actions} />
          </div>
        </section>
      </main>
    </div>
  );
}
