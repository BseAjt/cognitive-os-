import { executiveTwinSeed } from "@/lib/executive-twin-domain";

const ENTITY_BY_ID = new Map(executiveTwinSeed.entities.map((entity) => [entity.id, entity]));

export function ExecutiveOSGraphView() {
  return (
    <section>
      <div className="mb-6">
        <div className="text-xs font-black tracking-[.16em] text-[#8d7ce4]">ENTERPRISE KNOWLEDGE GRAPH</div>
        <h1 className="mt-2 text-4xl font-semibold">Le contexte relié</h1>
        <p className="mt-2 text-[#91a2bd]">Projection du graphe canonique d’ExecutiveOS.</p>
      </div>
      <div className="executive-card overflow-auto p-5">
        <div className="grid min-w-[900px] grid-cols-[.8fr_1.2fr_1fr] gap-4">
          {executiveTwinSeed.relations.map((edge) => {
            const source = ENTITY_BY_ID.get(edge.sourceId);
            const target = ENTITY_BY_ID.get(edge.targetId);

            return (
              <div key={edge.id} className="contents">
                <div className="rounded-xl border border-white/10 bg-white/[.025] p-3 text-sm">{source?.title}</div>
                <div className="grid place-items-center rounded-xl border border-[#7c5cff]/20 bg-[#7c5cff]/5 p-3 text-xs font-black text-[#b7a9ff]">
                  {edge.relationType}
                  <span className="font-normal text-[#91a2bd]">{edge.confidence}% · {edge.provenance}</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[.025] p-3 text-sm">{target?.title}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
