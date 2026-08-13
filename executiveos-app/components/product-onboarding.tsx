"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useExecutiveStore } from "@/store/executive-store";
import { decisionAssessmentQuestions, scoreDecisionAssessment, type AssessmentAnswer } from "@/lib/decision-thinking-profile";

type Mode = "guided" | "demo";

export function ProductOnboarding({ email }: { email: string }) {
  const router = useRouter();
  const activate = useExecutiveStore(
    (state) => state.activateCloudOrganization,
  );
  const createBlankWorkspace = useExecutiveStore(
    (state) => state.createBlankWorkspace,
  );
  const createCase = useExecutiveStore((state) => state.createCase);
  const loadInvestorDemo = useExecutiveStore((state) => state.loadInvestorDemo);
  const [organizationName, setOrganizationName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [caseTitle, setCaseTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [mode, setMode] = useState<Mode>("guided");
  const [decisionFocus, setDecisionFocus] = useState("investment");
  const [assessmentStep, setAssessmentStep] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState<AssessmentAnswer[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const canSubmit =
    organizationName.trim().length >= 2 &&
    displayName.trim().length >= 2 &&
    assessmentAnswers.length === decisionAssessmentQuestions.length &&
    (mode === "demo" ||
      (caseTitle.trim().length >= 3 && objective.trim().length >= 5));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationName, displayName, assessmentAnswers }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.organization || !body?.member)
        throw new Error("onboarding_failed");
      activate({ organization: body.organization, member: body.member });
      window.localStorage.setItem(
        "executiveos:decision-focus:v1",
        decisionFocus,
      );
      if (mode === "demo") loadInvestorDemo();
      else {
        createBlankWorkspace();
        createCase({
          title: caseTitle.trim(),
          objective: objective.trim(),
          context: "Premier dossier créé pendant l’onboarding ExecutiveOS.",
        });
      }
      router.refresh();
    } catch {
      setError(
        "Impossible de créer l’espace pour le moment. Réessaie dans quelques instants.",
      );
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-10 sm:px-8 sm:py-16">
      <form
        onSubmit={submit}
        className="executive-card mx-auto max-w-3xl overflow-hidden"
      >
        <div className="border-b border-black/[.07] px-6 py-6 sm:px-10">
          <p className="text-xs font-bold tracking-[.24em] text-[#6e6e73]">
            EXECUTIVEOS CLOUD · BLOC 10
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.035em] sm:text-5xl">
            Prépare ton espace de décision.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#6e6e73]">
            Deux minutes pour créer ton organisation et ouvrir un premier
            dossier exploitable.
          </p>
        </div>
        <div className="grid gap-8 px-6 py-8 sm:px-10">
          <span className="sr-only">Explorer la démo</span>
          <section>
            <p className="mb-4 text-sm font-semibold">1 · Ton organisation</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Nom de l’organisation
                <input
                  required
                  minLength={2}
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Acme Strategy"
                  className="rounded-2xl border border-black/[.12] bg-white px-4 py-3.5"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Ton nom
                <input
                  required
                  minLength={2}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Prénom Nom"
                  className="rounded-2xl border border-black/[.12] bg-white px-4 py-3.5"
                />
              </label>
            </div>
            <p className="mt-3 text-sm text-[#6e6e73]">
              Compte connecté · {email}
            </p>
          </section>
          <section>
            <p className="mb-4 text-sm font-semibold">
              2 · Quelles décisions veux-tu mieux confronter ?
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["investment", "Décisions d’investissement"],
                ["hiring", "Recrutement exécutif"],
                ["pricing", "Pricing & commercial"],
                ["other", "Autre — décrire librement"],
              ].map(([id, title]) => (
                <ModeCard
                  key={id}
                  active={decisionFocus === id}
                  onClick={() => setDecisionFocus(id)}
                  title={title}
                  text={
                    id === "investment"
                      ? "Rendement, risque, horizon et réversibilité."
                      : id === "hiring"
                        ? "Mandat, preuves et coût d’erreur."
                        : id === "pricing"
                          ? "Valeur, marge, adoption et signal client."
                          : "Le vocabulaire restera volontairement ouvert."
                  }
                />
              ))}
            </div>
          </section>
          <AssessmentSection
            step={assessmentStep}
            answers={assessmentAnswers}
            choose={(questionId, optionId) => {
              setAssessmentAnswers((current) => [
                ...current.filter((answer) => answer.questionId !== questionId),
                { questionId, optionId },
              ]);
              if (assessmentStep < decisionAssessmentQuestions.length - 1)
                setAssessmentStep(assessmentStep + 1);
            }}
            go={setAssessmentStep}
          />
          <section>
            <p className="mb-4 text-sm font-semibold">
              4 · Comment veux-tu commencer ?
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <ModeCard
                active={mode === "guided"}
                onClick={() => setMode("guided")}
                title="Mon premier dossier"
                text="Pars de ta vraie décision et avance avec le parcours guidé."
              />
              <ModeCard
                active={mode === "demo"}
                onClick={() => setMode("demo")}
                title="Doctrine de démonstration"
                text="Explore Claire, DG fictive d’une ETI industrielle de 200 personnes."
              />
            </div>
          </section>
          {mode === "guided" && (
            <section className="grid gap-4 rounded-3xl bg-black/[.035] p-5">
              <p className="text-sm font-semibold">5 · Ta première décision</p>
              <label className="grid gap-2 text-sm font-medium">
                Sujet du dossier
                <input
                  required
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  placeholder="Ex. Lancer notre offre entreprise"
                  className="rounded-2xl border border-black/[.12] bg-white px-4 py-3.5"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Résultat recherché
                <textarea
                  required
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Quelle décision veux-tu prendre, et pourquoi maintenant ?"
                  rows={3}
                  className="resize-none rounded-2xl border border-black/[.12] bg-white px-4 py-3.5"
                />
              </label>
            </section>
          )}
          <section className="rounded-3xl border border-black/[.08] bg-white/70 p-5">
            <p className="text-sm font-semibold">
              Confidentialité de vos données
            </p>
            <p className="mt-2 text-sm leading-6 text-[#6e6e73]">
              Vos décisions sont isolées dans votre organisation et accessibles
              uniquement aux membres autorisés. Les exemples fictifs ne sont
              jamais mélangés à votre doctrine. Vous pourrez exporter votre
              espace à tout moment.
            </p>
          </section>
          {error && (
            <p
              role="alert"
              className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <button
            disabled={!canSubmit || pending}
            className="executive-button executive-primary min-h-12 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending
              ? "Création de ton espace…"
              : mode === "demo"
                ? "Créer et ouvrir la démo"
                : "Créer et ouvrir mon dossier"}
          </button>
        </div>
      </form>
    </main>
  );
}

function AssessmentSection({
  step,
  answers,
  choose,
  go,
}: {
  step: number;
  answers: AssessmentAnswer[];
  choose: (questionId: string, optionId: string) => void;
  go: (step: number) => void;
}) {
  const question = decisionAssessmentQuestions[step];
  const selected = answers.find((answer) => answer.questionId === question.id)?.optionId;
  return (
    <section className="grid gap-5 rounded-3xl bg-black/[.035] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">3 · Votre manière de décider</p>
          <p className="mt-1 text-sm leading-6 text-[#6e6e73]">Répondez selon votre premier réflexe, pas selon la réponse idéale.</p>
        </div>
        <span className="text-xs font-bold text-[#0066cc]">{step + 1}/10</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-black/[.07]">
        <div className="h-full rounded-full bg-[#0071e3]" style={{ width: `${((step + 1) / 10) * 100}%` }} />
      </div>
      <fieldset>
        <legend className="text-base font-semibold leading-6">{question.prompt}</legend>
        <div className="mt-4 grid gap-2">
          {question.options.map((option) => (
            <button key={option.id} type="button" aria-pressed={selected === option.id} onClick={() => choose(question.id, option.id)} className={`rounded-2xl border p-4 text-left text-sm leading-5 ${selected === option.id ? "border-[#0071e3] bg-[#eef6ff]" : "border-black/[.09] bg-white"}`}>
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex justify-between">
        <button type="button" disabled={step === 0} onClick={() => go(step - 1)} className="text-xs font-semibold text-[#59636f] disabled:opacity-30">← Précédent</button>
        <button type="button" disabled={!selected || step === 9} onClick={() => go(step + 1)} className="text-xs font-semibold text-[#0066cc] disabled:opacity-30">Suivant →</button>
      </div>
      <p className="text-xs leading-5 text-[#6e6e73]">Cette hypothèse sera corrigée par vos décisions et vos retours. Elle ne constitue ni un diagnostic psychologique ni une évaluation de vos capacités.</p>
    </section>
  );
}

function ModeCard({
  active,
  onClick,
  title,
  text,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-3xl border p-5 text-left ${active ? "border-[#0071e3] bg-[#0071e3]/[.07] shadow-[0_0_0_3px_rgba(0,113,227,.08)]" : "border-black/[.09] bg-white/60"}`}
    >
      <span className="block text-base font-semibold">{title}</span>
      <span className="mt-2 block text-sm leading-6 text-[#6e6e73]">
        {text}
      </span>
    </button>
  );
}
