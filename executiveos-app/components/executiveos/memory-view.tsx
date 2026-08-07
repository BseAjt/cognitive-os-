import { executiveTwinSeed } from "@/lib/executive-twin-domain";

const MEMORY_ENTITY_TYPES = new Set(["memory", "learning", "context_item"]);

export function ExecutiveOSMemoryView() {
  const memories = executiveTwinSeed.entities.filter((item) => MEMORY_ENTITY_TYPES.has(item.type));

  return (
    <section>
      <div className="mb-6">
        <div className="text-xs font-black tracking-[.16em] text-[#42d59d]">ORGANIZATIONAL MEMORY</div>
        <h1 className="mt-2 text-4xl font-semibold">La mémoire du raisonnement</h1>
        <p className="mt-2 text-[#91a2bd]">Les faits, hypothèses, apprentissages et décisions restent reliés à leurs sources et à leur contexte.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {memories.map((item) => (
          <article key={item.id} className="executive-card p-5">
            <div className="flex justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-wide text-[#9d83ff]">{item.type.replaceAll("_", " ")}</span>
              <span className="text-xs text-[#91a2bd]">{item.status}</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold">{item.title}</h2>
            <p className="mt-3 text-sm text-[#91a2bd]">Source : {item.source}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
