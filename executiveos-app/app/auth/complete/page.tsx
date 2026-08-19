"use client";

import { useEffect, useState } from "react";
import { createMagicLinkClient } from "@/lib/supabase/client";

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default function CompleteSessionPage() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const client = createMagicLinkClient();
    const next = safeNext(new URLSearchParams(window.location.search).get("next"));
    if (!client) {
      setFailed(true);
      return;
    }

    let active = true;
    const complete = async () => {
      const { data } = await client.auth.getSession();
      if (active && data.session) window.location.replace(next);
    };
    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (active && session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        window.location.replace(next);
      }
    });
    void complete();
    const timeout = window.setTimeout(() => active && setFailed(true), 8000);

    return () => {
      active = false;
      window.clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f3ee] p-6 text-[#1d1d1f]">
      <section className="w-full max-w-md rounded-[32px] border border-black/10 bg-white/85 p-8 text-center shadow-xl shadow-black/5">
        <span className="text-xs font-bold uppercase tracking-[.16em] text-[#6e6e73]">ExecutiveOS Cloud</span>
        <h1 className="mt-3 text-2xl font-semibold">{failed ? "Lien non valide" : "Ouverture de votre espace…"}</h1>
        <p className="mt-3 text-sm leading-6 text-[#6e6e73]">
          {failed ? "Ce lien est expiré ou a déjà été utilisé. Demandez-en un nouveau pour reprendre votre espace." : "Votre session sécurisée est en cours de restauration."}
        </p>
        {failed && <a href="/sign-in" className="mt-6 inline-block rounded-2xl bg-[#007aff] px-5 py-3 text-sm font-semibold text-white">Recevoir un nouveau lien</a>}
      </section>
    </main>
  );
}
