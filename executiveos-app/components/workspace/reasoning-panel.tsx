import type { Challenge } from "@/types/domain";
import type { CognitiveExtraction } from "@/lib/conversation-runtime";
import { challengeScore } from "@/lib/scheduler";
import { ReasoningGraph } from "@/components/reasoning-graph";

export function ReasoningPanel({ challenge, nextAction, extractions }: { challenge: Challenge; nextAction: string; extractions: CognitiveExtraction[] }) {
  return (
    <div className="grid gap-5">
      <article className="executive-card p-5">
        <div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">LIVE REASONING</div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Metric label="Priority" value={challengeScore(challenge)} />
          <Metric label="Confidence" value={`${challenge.confidence}%`} />
          <Metric label="Risk" value={`${challenge.risk}/10`} />
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.025] p-4">
          <strong>Prochaine meilleure action</strong>
          <p className="mt-2 text-[#d6dfed]">{nextAction || challenge.context}</p>
        </div>
      </article>
      <ReasoningGraph challenge={challenge} />
      <article className="executive-card p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black tracking-[.14em] text-[#8d7ce4]">STRUCTURED OUTPUT</div>
          <span className="text-xs text-[#91a2bd]">{extractions.length} objets</span>
        </div>
        <div className="mt-3 grid gap-2">
          {extractions.length ? extractions.map((item, index) => (
            <div key={`${item.kind}-${index}`} className="rounded-xl border border-white/10 bg-white/[.025] p-3">
              <div className="text-xs font-black uppercase tracking-[.12em] text-[#9d83ff]">{item.kind} · {item.confidence}%</div>
              <p className="mt-1 text-sm text-[#d6dfed]">{item.text}</p>
            </div>
          )) : <span className="text-sm text-[#91a2bd]">Les extractions apparaîtront ici après ton message.</span>}
        </div>
      </article>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-white/10 bg-white/[.025] p-3"><span className="block text-xs text-[#91a2bd]">{label}</span><strong className="mt-1 block text-xl">{value}</strong></div>;
}
