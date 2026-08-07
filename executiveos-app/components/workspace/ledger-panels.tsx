import type { ActionItem, Decision } from "@/types/domain";

export function DecisionLedger({ decisions }: { decisions: Decision[] }) {
  return (
    <article className="executive-card p-5">
      <div className="text-xs font-black tracking-[.14em] text-[#42d59d]">DECISION LEDGER</div>
      <div className="mt-3 grid gap-3">
        {decisions.length ? decisions.slice(0, 3).map((decision) => (
          <div key={decision.id} className="rounded-xl border border-white/10 p-3">
            <strong>{decision.finalDecision}</strong>
            <p className="mt-1 text-sm text-[#91a2bd]">{decision.rationale}</p>
          </div>
        )) : <span className="text-sm text-[#91a2bd]">Aucune décision détectée.</span>}
      </div>
    </article>
  );
}

export function OpenActions({ actions }: { actions: ActionItem[] }) {
  return (
    <article className="executive-card p-5">
      <div className="text-xs font-black tracking-[.14em] text-[#ffbc57]">OPEN ACTIONS</div>
      <div className="mt-3 grid gap-3">
        {actions.length ? actions.slice(0, 4).map((action) => (
          <div key={action.id} className="rounded-xl border border-white/10 p-3">
            <strong>{action.title}</strong>
            <p className="mt-1 text-sm text-[#91a2bd]">{action.owner} · {action.status}</p>
          </div>
        )) : <span className="text-sm text-[#91a2bd]">Aucune action détectée.</span>}
      </div>
    </article>
  );
}
