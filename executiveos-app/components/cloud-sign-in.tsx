"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function CloudSignIn({
  configured,
  nextPath = "/",
}: {
  configured: boolean;
  nextPath?: string;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const client = createClient();
      if (!client) {
        setMessage("Le service de connexion n’est pas configuré sur cet environnement.");
        return;
      }
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", nextPath);
      const { error } = await client.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: callback.toString(),
          shouldCreateUser: true,
        },
      });

      if (!error) {
        setMessage("Lien sécurisé envoyé. Ouvre le dernier e-mail reçu dans ce navigateur pour retrouver ton espace personnel.");
      } else if (error.status === 429 || error.code === "over_email_send_rate_limit") {
        setMessage("Un lien vient déjà d’être envoyé. Attends quelques secondes, puis utilise le dernier e-mail reçu.");
      } else {
        setMessage(`Connexion impossible (${error.code ?? "erreur inconnue"}). Réessaie dans quelques instants.`);
      }
    } catch {
      setMessage("Connexion impossible (réseau indisponible). Réessaie dans quelques instants.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f3ee] p-6 text-[#1d1d1f]">
      <section className="w-full max-w-md rounded-[32px] border border-black/10 bg-white/80 p-8 shadow-xl shadow-black/5 backdrop-blur-xl">
        <span className="text-xs font-bold uppercase tracking-[.16em] text-[#6e6e73]">ExecutiveOS Cloud</span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Retrouver ton espace</h1>
        <p className="mt-3 text-sm leading-6 text-[#6e6e73]">
          Connexion sans mot de passe par lien sécurisé. Tes dossiers restent isolés par organisation.
        </p>
        {configured ? (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <label htmlFor="email" className="block text-sm font-medium">Adresse professionnelle</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[#007aff]"
              placeholder="vous@entreprise.fr"
            />
            <button
              disabled={busy}
              className="w-full rounded-2xl bg-[#007aff] px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Envoi…" : "Recevoir le lien de connexion"}
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Le service de connexion n’est pas encore configuré sur cet environnement. La démonstration reste accessible avec des données fictives.
          </div>
        )}
        {message && <p role="status" className="mt-4 text-sm text-[#3a3a3c]">{message}</p>}
        <a href="/" className="mt-6 inline-block text-sm font-medium text-[#007aff]">Découvrir la démo</a>
      </section>
    </main>
  );
}
