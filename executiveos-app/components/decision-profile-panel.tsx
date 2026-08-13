"use client";

import { useEffect, useMemo, useState } from "react";
import {
  decisionAssessmentQuestions,
  scoreDecisionAssessment,
  type AssessmentAnswer,
  type ThinkingDimension,
} from "@/lib/decision-thinking-profile";

type DiscStyle = "D" | "I" | "S" | "C";
const LOCAL_PROFILE_KEY = "executiveos:decision-profile:v1";
type StoredProfile = {
  disc_primary: DiscStyle;
  disc_secondary: DiscStyle;
  dimension_scores: Record<ThinkingDimension, number>;
  assessment_answers: AssessmentAnswer[];
  confidence: string;
  evidence_count: number;
};

const styleCopy: Record<DiscStyle, { title: string; reflex: string }> = {
  D: { title: "Décideur direct", reflex: "Vous cherchez naturellement l’impact, la vitesse et le passage à l’action." },
  I: { title: "Décideur mobilisateur", reflex: "Vous cherchez naturellement l’adhésion, l’énergie collective et les opportunités." },
  S: { title: "Décideur stabilisateur", reflex: "Vous cherchez naturellement la continuité, la soutenabilité et l’équilibre humain." },
  C: { title: "Décideur analytique", reflex: "Vous cherchez naturellement les preuves, la précision et la maîtrise des risques." },
};

const dimensionCopy: Record<ThinkingDimension, { label: string; question: string }> = {
  speed: { label: "Vitesse de décision", question: "Quel coût aurait une décision prise trop vite ?" },
  evidence: { label: "Solidité des preuves", question: "Quelle donnée pourrait invalider votre conviction ?" },
  risk: { label: "Risques secondaires", question: "Quel risque indirect ou retardé n’est pas encore couvert ?" },
  stakeholders: { label: "Parties prenantes", question: "Qui devra réellement porter ou subir cette décision ?" },
  execution: { label: "Capacité d’exécution", question: "Qui fait quoi, avec quel temps et quelles dépendances ?" },
  opportunityCost: { label: "Coût d’opportunité", question: "À quoi renoncez-vous concrètement en choisissant cette option ?" },
  reversibility: { label: "Réversibilité", question: "Comment tester ou revenir en arrière à faible coût ?" },
  longTerm: { label: "Effets à long terme", question: "Qu’est-ce que ce choix crée ou verrouille dans 12 à 24 mois ?" },
  dissent: { label: "Contradiction utile", question: "Quel argument solide défendrait une personne en désaccord ?" },
};

export function DecisionProfilePanel({ demo = false }: { demo?: boolean }) {
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (demo) {
      setProfile({
        disc_primary: "D",
        disc_secondary: "C",
        dimension_scores: { speed: 92, evidence: 68, risk: 52, stakeholders: 44, execution: 88, opportunityCost: 81, reversibility: 31, longTerm: 47, dissent: 28 },
        assessment_answers: [],
        confidence: "demo",
        evidence_count: 24,
      });
      setLoading(false);
      return;
    }
    const useLocalProfile = () => {
      try {
        const stored = window.localStorage.getItem(LOCAL_PROFILE_KEY);
        const localProfile = stored ? JSON.parse(stored) as StoredProfile : null;
        setProfile(localProfile);
        if (localProfile?.assessment_answers) setAnswers(localProfile.assessment_answers);
        setEditing(!localProfile);
        setError("");
      } catch {
        setProfile(null);
        setEditing(true);
        setError("");
      }
    };

    fetch("/api/decision-profile", { cache: "no-store" })
      .then(async (response) => {
        if ([401, 404, 503].includes(response.status)) {
          useLocalProfile();
          return null;
        }
        if (!response.ok) throw new Error("read_failed");
        return response.json();
      })
      .then((body) => {
        if (!body) return;
        setProfile(body.profile);
        if (body.profile?.assessment_answers) setAnswers(body.profile.assessment_answers);
        setEditing(!body.profile);
      })
      .catch(useLocalProfile)
      .finally(() => setLoading(false));
  }, [demo]);

  const ranked = useMemo(() => {
    if (!profile?.dimension_scores) return [];
    return (Object.entries(profile.dimension_scores) as [ThinkingDimension, number][])
      .sort((a, b) => b[1] - a[1]);
  }, [profile]);
  const strengths = ranked.slice(0, 3);
  const complements = ranked.slice(-3).reverse();
  const question = decisionAssessmentQuestions[step];
  const selected = answers.find((item) => item.questionId === question?.id)?.optionId;

  function choose(questionId: string, optionId: string) {
    setAnswers((current) => [
      ...current.filter((item) => item.questionId !== questionId),
      { questionId, optionId },
    ]);
    if (step < decisionAssessmentQuestions.length - 1) setStep(step + 1);
  }

  async function save() {
    if (answers.length !== decisionAssessmentQuestions.length || saving) return;
    setSaving(true);
    setError("");
    const saveLocally = () => {
      const scored = scoreDecisionAssessment(answers);
      const localProfile: StoredProfile = {
        disc_primary: scored.discPrimary,
        disc_secondary: scored.discSecondary,
        dimension_scores: scored.dimensions,
        assessment_answers: answers,
        confidence: scored.confidence,
        evidence_count: scored.evidenceCount,
      };
      window.localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(localProfile));
      setProfile(localProfile);
      setEditing(false);
    };
    try {
      const response = await fetch("/api/decision-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if ([401, 404, 503].includes(response.status)) {
        saveLocally();
        return;
      }
      const body = await response.json();
      if (!response.ok || !body.profile) throw new Error("save_failed");
      setProfile(body.profile);
      setEditing(false);
    } catch {
      try {
        saveLocally();
      } catch {
        setError("Le profil n’a pas pu être enregistré.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <section className="mt-7 min-h-32 animate-pulse rounded-[30px] bg-black/[.04]" />;

  return (
    <section className="mt-7 rounded-[30px] border border-[#6d28d9]/20 bg-[linear-gradient(145deg,#faf7ff,#fffefa)] p-6 md:p-8" aria-labelledby="decision-profile-title">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[.18em] text-[#6d28d9]">{demo ? "Exemple de profil décisionnel" : "Votre manière de décider"}</span>
          <h2 id="decision-profile-title" className="mt-2 text-2xl font-semibold md:text-3xl">
            {profile ? `${styleCopy[profile.disc_primary].title} · complément ${profile.disc_secondary}` : "Découvrez vos réflexes — et ce qu’ils laissent de côté"}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59636f]">
            {profile ? `${styleCopy[profile.disc_primary].reflex}${demo ? " Exemple fictif : connectez-vous pour construire votre propre profil." : ""}` : "10 situations concrètes permettent d’adapter l’aide à votre façon de réfléchir. Ce n’est pas un diagnostic psychologique."}
          </p>
        </div>
        {profile && !editing && !demo && (
          <button onClick={() => setEditing(true)} className="shrink-0 rounded-full border border-[#6d28d9]/20 bg-white px-4 py-2 text-xs font-bold text-[#6d28d9]">
            Recalibrer mon profil
          </button>
        )}
      </div>

      {profile && !editing && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#287a46]/15 bg-[#effaf2] p-5">
            <span className="text-[10px] font-black uppercase tracking-[.14em] text-[#287a46]">Vos réflexes déjà solides</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {strengths.map(([key, score]) => <span key={key} className="rounded-full bg-white px-3 py-2 text-xs font-semibold">{dimensionCopy[key].label} · {score}</span>)}
            </div>
          </div>
          <div className="rounded-2xl border border-[#b45309]/20 bg-[#fff7ed] p-5">
            <span className="text-[10px] font-black uppercase tracking-[.14em] text-[#9a4d09]">Axes que l’outil ajoutera en priorité</span>
            <div className="mt-3 grid gap-3">
              {complements.map(([key]) => (
                <div key={key} className="rounded-xl bg-white p-3">
                  <strong className="text-sm">{dimensionCopy[key].label}</strong>
                  <p className="mt-1 text-xs leading-5 text-[#6f3b0b]">{dimensionCopy[key].question}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editing && question && (
        <div className="mt-6 rounded-2xl border border-black/[.08] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <strong className="text-sm">Situation {step + 1} sur 10</strong>
            <span className="text-xs font-bold text-[#6d28d9]">{answers.length}/10 répondues</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/[.07]">
            <div className="h-full bg-[#6d28d9]" style={{ width: `${((step + 1) / 10) * 100}%` }} />
          </div>
          <p className="mt-5 font-semibold leading-6">{question.prompt}</p>
          <div className="mt-4 grid gap-2">
            {question.options.map((option) => (
              <button key={option.id} type="button" aria-pressed={selected === option.id} onClick={() => choose(question.id, option.id)}
                className={`rounded-xl border p-3 text-left text-sm ${selected === option.id ? "border-[#6d28d9] bg-[#f5f0ff]" : "border-black/[.09]"}`}>
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)} className="text-xs font-semibold disabled:opacity-30">← Précédent</button>
            <div className="flex gap-2">
              {profile && <button type="button" onClick={() => setEditing(false)} className="rounded-full px-4 py-2 text-xs font-bold">Annuler</button>}
              {step < 9 ? (
                <button type="button" disabled={!selected} onClick={() => setStep(step + 1)} className="rounded-full bg-[#6d28d9] px-4 py-2 text-xs font-bold text-white disabled:opacity-30">Suivant →</button>
              ) : (
                <button type="button" disabled={answers.length !== 10 || saving} onClick={save} className="rounded-full bg-[#6d28d9] px-4 py-2 text-xs font-bold text-white disabled:opacity-30">
                  {saving ? "Enregistrement…" : "Afficher mes axes complémentaires"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    </section>
  );
}
