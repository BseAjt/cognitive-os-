"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("ExecutiveOS runtime error", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <section className="executive-card max-w-xl p-8 text-center">
        <div className="text-[10px] font-black uppercase tracking-[.18em] text-[#d70015]">Incident contenu</div>
        <h1 className="mt-3 text-3xl font-semibold">ExecutiveOS n’a pas pu terminer cette opération.</h1>
        <p className="mt-3 text-sm leading-6 text-[#6e6e73]">Tes données locales sont conservées. Tu peux relancer l’interface sans effacer le dossier en cours.</p>
        {error.digest ? <p className="mt-3 font-mono text-xs text-[#6e6e73]">Référence {error.digest}</p> : null}
        <button type="button" onClick={reset} className="executive-button executive-primary mt-6">Réessayer</button>
      </section>
    </main>
  );
}
