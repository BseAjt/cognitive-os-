"use client";

import { useMemo, useState } from "react";
import { ExecutiveWorkspace } from "@/components/executive-workspace";
import { entityCounts, executiveKnowledgeSeed } from "@/lib/knowledge-snapshot";
import { ExecutiveOSGraphView } from "./graph-view";
import { ExecutiveOSHomeDashboard } from "./home-dashboard";
import { ExecutiveOSMemoryView } from "./memory-view";
import { ExecutiveOSTopNav, type ExecutiveOSView } from "./top-nav";

export function ExecutiveOSHome() {
  const [view, setView] = useState<ExecutiveOSView>("home");
  const counts = useMemo(() => entityCounts(executiveKnowledgeSeed), []);

  return (
    <div className="min-h-screen bg-[#07111f]">
      <ExecutiveOSTopNav view={view} onView={setView} />
      {view === "decision" ? (
        <ExecutiveWorkspace />
      ) : (
        <main className="mx-auto max-w-[1500px] p-6 md:p-8">
          {view === "home" ? (
            <ExecutiveOSHomeDashboard
              briefing={executiveKnowledgeSeed.briefing}
              counts={counts}
              onDecision={() => setView("decision")}
              onMemory={() => setView("memory")}
              onGraph={() => setView("graph")}
            />
          ) : null}
          {view === "memory" ? <ExecutiveOSMemoryView /> : null}
          {view === "graph" ? <ExecutiveOSGraphView /> : null}
        </main>
      )}
    </div>
  );
}
