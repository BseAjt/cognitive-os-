"use client";

import { executiveTwinSeed } from "@/lib/executive-twin-domain";
import { MetricCard, SmallMetric } from "./metric-card";

export function ExecutiveOSHomeDashboard({
  briefing,
  counts,
  onDecision,
  onMemory,
  onGraph
}: {
  briefing: typeof executiveTwinSeed.briefing;
  counts: Record<string, number>;
  onDecision: () => void;
  onMemory: () => void;
  onGraph: () => void;
}) {
  return (
    <>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <article className="executive-card overflow-hidden p-7 md:p-9">
          <div className="text-xs font-black tracking-[.18em] text-[#9d83ff]">EXECUTIVEOS BRIEFING</div>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
            Bonjour Sébastien.<br />
            <span className="text-[#9eabc1]">Voici ce qui nécessite ton attention.</span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-[#b8c4d6]">
            ExecutiveOS consolide le contexte, la mémoire organisationnelle et les décisions ouvertes. Il ne recommande aucune action irréversible tant que les preuves critiques sont incomplètes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={onDecision} className="executive-button executive-primary px-6 py-3">Ouvrir la Decision Room</button>
            <button onClick={onMemory} className="executive-button executive-ghost px-6 py-3">Explorer la mémoire</button>
          </div>
        </article>

        <article className="executive-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-black tracking-[.14em] text-[#42d59d]">SYSTEM HEALTH</span>
              <strong className="mt-3 block text-6xl">{briefing.twinHealth}%</strong>
            </div>
            <span className="rounded-full bg-[#ffbc57]/10 px-3 py-1 text-xs text-[#ffd895]">En apprentissage</span>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/5">
            <div className="h-full bg-gradient-to-r from-[#7c5cff] to-[#42d59d]" style={{ width: `${briefing.twinHealth}%` }} />
          </div>
          <p className="mt-5 text-sm leading-6 text-[#91a2bd]">Bonne couverture stratégique et financière. Les domaines humain, juridique et opérationnel doivent encore être consolidés.</p>
        </article>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Décisions ouvertes" value={briefing.openDecisions} tone="violet" />
        <MetricCard label="Risques critiques" value={briefing.criticalRisks} tone="red" />
        <MetricCard label="Hypothèse invalidée" value={briefing.invalidatedHypotheses} tone="amber" />
        <MetricCard label="Engagements à échéance" value={briefing.dueCommitments} tone="blue" />
        <MetricCard label="Nouvelles connaissances" value={briefing.newKnowledge} tone="green" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="executive-card p-6">
          <div className="text-xs font-black tracking-[.14em] text-[#ffbc57]">RECOMMANDATION EXECUTIVEOS</div>
          <h2 className="mt-3 text-2xl font-semibold">{briefing.recommendation}</h2>
          <p className="mt-3 leading-7 text-[#91a2bd]">Le dossier de transformation est actif. Les scénarios existent, mais la cible d’économies, le périmètre de postes, les alternatives et l’impact opérationnel doivent encore être vérifiés.</p>
          <button onClick={onDecision} className="executive-button executive-primary mt-5">Continuer l’analyse</button>
        </article>

        <article className="executive-card p-6">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black tracking-[.14em] text-[#42d59d]">ORGANIZATIONAL MEMORY</div>
            <button onClick={onGraph} className="text-xs text-[#b8acf8]">Voir le graphe →</button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <SmallMetric label="Objets" value={executiveTwinSeed.entities.length} />
            <SmallMetric label="Relations" value={executiveTwinSeed.relations.length} />
            <SmallMetric label="Mémoires" value={counts.memory ?? 0} />
            <SmallMetric label="Learnings" value={counts.learning ?? 0} />
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-4">
            <strong>Dernier apprentissage</strong>
            <p className="mt-2 text-sm leading-6 text-[#aebbd0]">Protéger les compétences critiques avant toute réorganisation et rendre explicite le coût opérationnel des économies.</p>
          </div>
        </article>
      </section>
    </>
  );
}
