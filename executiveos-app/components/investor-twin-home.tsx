"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { DecisionProfilePanel } from "@/components/decision-profile-panel";
import {
  buildDecisionDoctrine,
  buildDecisionTwinSnapshot,
  evidenceLevel,
  explainDoctrineScore,
  predictDecisionOrientation,
  qualitativeStrength,
  SCORE_METHOD,
  type DoctrinePrinciple,
} from "@/lib/decision-twin";
import {
  extractBulkDecisions,
  type ExtractedDecision,
} from "@/lib/bulk-decision-import";
import { INVESTOR_DEMO_PERSONA } from "@/lib/investor-demo";
import { buildComplementReport, parseComplementFeedback, serializeComplementFeedback, type BlindSpot, type ComplementFeedback, type FeedbackKind } from "@/lib/decision-complement-engine";
import { useExecutiveStore } from "@/store/executive-store";

type Mode = "home" | "history" | "opportunity";

export function InvestorTwinHome({ onOpen }: { onOpen: (id: string) => void }) {
  const store = useExecutiveStore();
  const { language, text } = useLanguage();
  const [mode, setMode] = useState<Mode>("home");
  const [history, setHistory] = useState("");
  const [extracted, setExtracted] = useState<ExtractedDecision[]>([]);
  const [company, setCompany] = useState("");
  const [question, setQuestion] = useState("");
  const [deadline, setDeadline] = useState("");
  const [options, setOptions] = useState("");
  const [evidence, setEvidence] = useState("");
  const [constraints, setConstraints] = useState("");
  const [tradeoff, setTradeoff] = useState("");
  const [stopRule, setStopRule] = useState("");
  const [weeklyHours, setWeeklyHours] = useState("");
  const [commitment, setCommitment] = useState<
    "explore" | "engage" | "dismiss"
  >("explore");

  useEffect(() => {
    if (store.demoMode === "workspace") store.loadInvestorDemo();
  }, [store.demoMode, store.loadInvestorDemo]);

  const twin = useMemo(
    () =>
      buildDecisionTwinSnapshot({
        cases: store.cases,
        decisions: store.decisions,
        profiles: store.cognitiveProfiles,
      }),
    [store.cases, store.decisions, store.cognitiveProfiles],
  );
  const doctrine = useMemo(
    () =>
      buildDecisionDoctrine({
        decisions: store.decisions,
        profiles: store.cognitiveProfiles,
        sources: store.contextSources,
      }),
    [store.decisions, store.cognitiveProfiles, store.contextSources],
  );
  const isDemo = store.demoMode !== "blank";
  const outcomeCount = store.decisions.filter(
    (item) => item.outcome.trim().length > 0,
  ).length;
  const level = evidenceLevel(twin.decisionCount, outcomeCount);
  const engagedCases = store.cases.filter((item) => item.state === "execute");
  const recentCases = store.cases.slice(0, 4);
  const levelLabel = text(
    (
      {
        not_started: "Profil non commencé",
        early_signals: "Premiers signaux",
        emerging: "Tendances émergentes",
        consolidating: "Profil en consolidation",
        usable: "Profil exploitable",
        calibrated: "Profil calibré",
      } as const
    )[level],
    (
      {
        not_started: "Profile not started",
        early_signals: "Early signals",
        emerging: "Emerging patterns",
        consolidating: "Profile consolidating",
        usable: "Usable profile",
        calibrated: "Calibrated profile",
      } as const
    )[level],
  );

  function startPersonalProfile() {
    store.createBlankWorkspace();
    setMode("history");
  }
  function importHistory() {
    const content = history.trim();
    if (!content) return;
    if (!extracted.length) {
      const preview = extractBulkDecisions(content);
      setExtracted(preview);
      setHistory(
        preview
          .map((item, index) =>
            [
              `DÉCISION ${index + 1} — ${item.title}`,
              `Choix : ${item.choice}`,
              `Raisons : ${item.rationale}`,
              `Résultat : ${item.outcome}`,
            ].join("\n"),
          )
          .join("\n\n"),
      );
      return;
    }
    if (store.demoMode !== "blank") store.createBlankWorkspace();
    for (const item of extracted) {
      const caseId = store.createCase({
        title: item.title,
        objective: text(
          "Retrouver les critères qui ont guidé ce choix",
          "Identify the criteria that guided this choice",
        ),
        context: item.context,
      });
      store.prependDecision({
        id: crypto.randomUUID(),
        caseId,
        recommendation: item.choice,
        outcome: item.outcome,
        rationale: item.rationale,
        confidence: 65,
        createdAt: new Date().toISOString(),
      });
      store.ingestContextSource({
        caseId,
        type: "note",
        title: text(
          "Décision historique importée",
          "Imported historical decision",
        ),
        origin: text("Import groupé personnel", "Personal bulk import"),
        content: item.context,
      });
    }
    setHistory("");
    setExtracted([]);
    setMode("home");
  }
  function createOpportunity() {
    if (
      !company.trim() ||
      !question.trim() ||
      !deadline ||
      !options.trim() ||
      !tradeoff.trim() ||
      !stopRule.trim() ||
      !weeklyHours.trim()
    )
      return;
    if (store.demoMode !== "blank") store.createBlankWorkspace();
    const context = [
      `OPTIONS\n${options.trim()}`,
      `PREUVES\n${evidence.trim() || "Non renseignées"}`,
      `CONTRAINTES\n${constraints.trim() || "Non renseignées"}`,
      `COÛT D'OPPORTUNITÉ\n${tradeoff.trim()}`,
      `CAPACITÉ\n${weeklyHours.trim()} heures par semaine`,
      `CRITÈRE D'ARRÊT\n${stopRule.trim()}`,
      `DATE LIMITE\n${deadline}`,
    ].join("\n\n");
    const id = store.createCase({
      title: company.trim(),
      objective: question.trim(),
      context,
    });
    store.applyCasePatch(id, {
      state:
        commitment === "engage"
          ? "execute"
          : commitment === "dismiss"
            ? "learn"
            : "explore",
    });
    setCompany("");
    setQuestion("");
    setDeadline("");
    setOptions("");
    setEvidence("");
    setConstraints("");
    setTradeoff("");
    setStopRule("");
    setWeeklyHours("");
    setMode("home");
    onOpen(id);
  }
  function recordFeedback(
    principle: DoctrinePrinciple,
    status: "confirmed" | "corrected",
    statement?: string,
  ) {
    const caseId = store.cases[0]?.id;
    if (!caseId) return;
    store.ingestContextSource({
      caseId,
      type: "note",
      title: `Doctrine ${status === "confirmed" ? "confirmée" : "corrigée"}:${principle.id}`,
      origin: "Validation utilisateur",
      content: statement?.trim() || principle.statement,
    });
  }
  function recordComplementFeedback(caseId: string, spot: BlindSpot, kind: FeedbackKind) {
    store.ingestContextSource({ caseId, type: "note", title: `Complément décisionnel:${spot.axis}`, origin: "Correction utilisateur", content: serializeComplementFeedback({ axis: spot.axis, kind, createdAt: new Date().toISOString() }) });
  }
  const complementFeedback = store.contextSources
    .filter((source) => source.title.startsWith("Complément décisionnel:"))
    .map((source) => parseComplementFeedback(source.rawContent))
    .filter((item): item is ComplementFeedback => Boolean(item));

  return (
    <section aria-labelledby="investor-home-title">
      <ModeBanner
        isDemo={isDemo}
        count={twin.decisionCount}
        onPersonal={startPersonalProfile}
        onDemo={store.loadInvestorDemo}
      />
      {isDemo && (
        <span className="sr-only">Démonstration — données fictives</span>
      )}
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.2em] text-[#0066cc]">
            ExecutiveOS
          </div>
          <h1
            id="investor-home-title"
            className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-.04em] md:text-5xl"
          >
            {text(
              "Décidez avec votre expérience, sans répéter vos erreurs.",
              "Use your experience without repeating your mistakes.",
            )}
          </h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-[#59636f]">
            {text(
              "ExecutiveOS retrouve vos critères réels, confronte chaque option aux faits et révèle ce que vous risquez de négliger.",
              "ExecutiveOS retrieves your real criteria, tests every option against the facts and reveals what you may be overlooking.",
            )}
          </p>
        </div>
        <button
          onClick={() => setMode("opportunity")}
          className="min-h-12 rounded-full bg-[#0071e3] px-6 py-3 text-sm font-bold text-white"
        >
          {text("Analyser une décision →", "Analyze a decision →")}
        </button>
      </div>

      <DecisionProfilePanel />

      <div className="mt-7 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <article className="rounded-[30px] border border-[#0071e3]/20 bg-[linear-gradient(145deg,rgba(255,255,255,.98),rgba(232,241,250,.9))] p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[10px] font-black uppercase tracking-[.18em] text-[#0066cc]">
              {text("Qualité de l’historique", "History quality")}
            </span>
            <span className="rounded-full bg-[#0071e3]/10 px-3 py-1 text-xs font-semibold text-[#0066cc]">
              {levelLabel}
            </span>
          </div>
          <h2 className="mt-5 text-3xl font-semibold">{levelLabel}</h2>
          <p className="mt-3 text-sm leading-6 text-[#303338]">
            {language === "fr"
              ? twin.nextMilestone
              : twin.decisionCount < 10
                ? `Add ${10 - twin.decisionCount} decisions to consolidate the profile.`
                : "Compare analyses with actual decisions and outcomes."}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric
              label={text("Historique appris", "History learned")}
              value={`${twin.decisionCount} ${text("décisions", "decisions")}`}
            />
            <Metric
              label={text("Critères identifiés", "Criteria identified")}
              value={`${doctrine.principles.length} ${text("détectés", "detected")}`}
            />
            <Metric
              label={text("Résultats disponibles", "Outcomes available")}
              value={`${outcomeCount} ${text("observés", "observed")}`}
            />
          </div>
        </article>
        <article className="rounded-[30px] border border-black/10 bg-[#fffefa] p-6 md:p-7">
          <span className="text-[10px] font-black uppercase tracking-[.18em] text-[#6e6e73]">
            {text("Prochaine étape", "Next step")}
          </span>
          <h2 className="mt-3 text-2xl font-semibold">
            {text("Apprendre de vos décisions", "Learn from your decisions")}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#59636f]">
            {text(
              "Ajoutez le contexte, le choix, les raisons et le résultat observé.",
              "Add context, choice, reasons and observed outcome.",
            )}
          </p>
          <button
            onClick={() => setMode("history")}
            className="mt-6 min-h-12 w-full rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-bold text-[#0066cc]"
          >
            {text("Importer mon historique", "Import my history")}
          </button>
        </article>
      </div>

      <section className="mt-8 rounded-[30px] border border-black/10 bg-[#fffefa] p-6 md:p-8">
        <span className="text-[10px] font-black uppercase tracking-[.18em] text-[#0066cc]">
          {text("Ce qui guide vos décisions", "What guides your decisions")}
        </span>
        <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
          {text(
            "Des critères reliés à leurs preuves",
            "Criteria linked to their evidence",
          )}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59636f]">
          {text(
            "Confirmez ou corrigez chaque tendance : votre retour modifie les prochaines analyses.",
            "Confirm or correct every pattern: your feedback changes future analyses.",
          )}
        </p>
        {doctrine.principles.length ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {doctrine.principles.map((principle) => (
              <PrincipleCard
                key={principle.id}
                principle={principle}
                onFeedback={recordFeedback}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-black/15 p-6 text-sm text-[#59636f]">
            {text(
              "Importez au moins trois décisions argumentées pour révéler les premiers critères.",
              "Import at least three reasoned decisions to reveal the first criteria.",
            )}
          </div>
        )}
        {doctrine.biasSignals.length > 0 && (
          <div className="mt-5 rounded-2xl border border-[#b45309]/15 bg-[#fff7ed] p-4">
            <span className="text-[10px] font-black uppercase tracking-[.14em] text-[#9a4d09]">
              {text("Angles morts à confronter", "Blind spots to challenge")}
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {doctrine.biasSignals.map((signal) => (
                <span
                  key={signal}
                  className="rounded-full bg-white px-3 py-1.5 text-xs text-[#6f3b0b]"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold">
          {text("Décisions et opportunités", "Decisions and opportunities")}
        </h2>
        <p className="mt-1 text-sm text-[#59636f]">
          {text(
            "Une orientation expliquée, jamais une probabilité de succès.",
            "An explained direction, never a probability of success.",
          )}
        </p>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {recentCases.map((item) => (
          <OpportunityCard
            key={item.id}
            item={item}
            doctrine={doctrine}
            isDemo={isDemo}
            feedback={complementFeedback}
            onFeedback={(spot, kind) => recordComplementFeedback(item.id, spot, kind)}
            onOpen={() => onOpen(item.id)}
          />
        ))}
      </div>

      <section className="mt-8 rounded-[28px] border border-[#b45309]/20 bg-[#fff7ed] p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[.16em] text-[#9a4d09]">
              {text("Budget d’attention", "Attention budget")}
            </span>
            <h2 className="mt-2 text-xl font-semibold">
              {engagedCases.length} / 3{" "}
              {text("chantiers engagés", "committed initiatives")}
            </h2>
            <p className="mt-2 text-sm text-[#6f3b0b]">
              {engagedCases.length >= 3
                ? text(
                    "Capacité atteinte : tout nouvel engagement doit remplacer, reporter ou déléguer un chantier existant.",
                    "Capacity reached: any new commitment must replace, postpone or delegate an existing initiative.",
                  )
                : text(
                    "Tout engagement doit préciser le temps disponible, le renoncement et le critère d’arrêt.",
                    "Every commitment must state available time, the trade-off and the stop rule.",
                  )}
            </p>
          </div>
          <button
            onClick={() => setMode("opportunity")}
            className="rounded-full bg-[#9a4d09] px-5 py-3 text-sm font-bold text-white"
          >
            {text(
              "Confronter un nouveau chantier",
              "Challenge a new initiative",
            )}
          </button>
        </div>
      </section>

      {mode !== "home" && (
        <OpportunityDialog
          mode={mode}
          close={() => {
            setMode("home");
            setExtracted([]);
          }}
          history={history}
          setHistory={(value) => {
            setHistory(value);
            setExtracted([]);
          }}
          extracted={extracted}
          importHistory={importHistory}
          company={company}
          setCompany={setCompany}
          question={question}
          setQuestion={setQuestion}
          deadline={deadline}
          setDeadline={setDeadline}
          options={options}
          setOptions={setOptions}
          evidence={evidence}
          setEvidence={setEvidence}
          constraints={constraints}
          setConstraints={setConstraints}
          tradeoff={tradeoff}
          setTradeoff={setTradeoff}
          stopRule={stopRule}
          setStopRule={setStopRule}
          weeklyHours={weeklyHours}
          setWeeklyHours={setWeeklyHours}
          commitment={commitment}
          setCommitment={setCommitment}
          submit={createOpportunity}
          capacityFull={engagedCases.length >= 3}
        />
      )}
    </section>
  );
}

function ModeBanner({
  isDemo,
  count,
  onPersonal,
  onDemo,
}: {
  isDemo: boolean;
  count: number;
  onPersonal: () => void;
  onDemo: () => void;
}) {
  const { text } = useLanguage();
  return (
    <div
      className={`mb-6 rounded-[22px] border p-4 ${isDemo ? "border-[#b7791f]/25 bg-[#fff8e7]" : "border-[#287a46]/20 bg-[#effaf2]"}`}
    >
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <strong className="text-sm">
            {isDemo
              ? text(
                  "Doctrine de démonstration — données fictives",
                  "Demo doctrine — fictional data",
                )
              : text(
                  "Votre profil — données personnelles uniquement",
                  "Your profile — personal data only",
                )}
          </strong>
          <p className="mt-1 text-xs leading-5 text-[#59636f]">
            {isDemo
              ? text(
                  `${INVESTOR_DEMO_PERSONA}. Explorez, confirmez ou corrigez librement cette doctrine.`,
                  "Claire Martin · fictional CEO of a 200-person industrial company. Explore, confirm or correct this doctrine.",
                )
              : text(
                  `Construit à partir de ${count} décision(s). Les exemples sont exclus des calculs.`,
                  `Built from ${count} decision(s). Examples are excluded from calculations.`,
                )}
          </p>
        </div>
        {isDemo ? (
          <div className="flex gap-2">
            <button
              onClick={onPersonal}
              className="rounded-full bg-[#1d1d1f] px-4 py-2 text-xs font-bold text-white"
            >
              {text(
                "Essayer avec mes propres décisions",
                "Try with my own decisions",
              )}
            </button>
            <button
              onClick={onDemo}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold"
            >
              {text("Réinitialiser", "Reset")}
            </button>
          </div>
        ) : (
          <button
            onClick={onDemo}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold"
          >
            {text("Voir un exemple séparé", "View separate example")}
          </button>
        )}
      </div>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/[.07] bg-white/70 p-4">
      <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#6e6e73]">
        {label}
      </span>
      <strong className="mt-2 block text-xl">{value}</strong>
    </div>
  );
}

function PrincipleCard({
  principle,
  onFeedback,
}: {
  principle: DoctrinePrinciple;
  onFeedback: (
    principle: DoctrinePrinciple,
    status: "confirmed" | "corrected",
    statement?: string,
  ) => void;
}) {
  const { language, text } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [statement, setStatement] = useState(principle.statement);
  const english: Record<string, [string, string]> = {
    risk: [
      "How you take risks",
      "You move forward when the potential gain clearly justifies the exposure.",
    ],
    clarity: [
      "Expected value",
      "You favor options whose concrete benefit is easy to explain.",
    ],
    execution: [
      "Ability to deliver",
      "You check that time, team and resources make delivery realistic.",
    ],
    differentiation: [
      "Distinctive advantage",
      "You favor options with a visible difference that is hard to copy.",
    ],
    evidence: [
      "Evidence required",
      "Before committing, you look for concrete signals rather than promises alone.",
    ],
  };
  const label =
    language === "en"
      ? (english[principle.id]?.[0] ?? principle.label)
      : principle.label;
  const description =
    language === "en" && principle.status === "inferred"
      ? (english[principle.id]?.[1] ?? principle.statement)
      : principle.statement;
  const strength =
    language === "fr"
      ? qualitativeStrength(
          principle.evidence.length,
          principle.status === "confirmed",
        )
      : principle.status === "confirmed"
        ? "confirmed criterion"
        : principle.evidence.length >= 6
          ? "recurring pattern"
          : principle.evidence.length >= 3
            ? "emerging pattern"
            : "weak signal";
  return (
    <article className="rounded-[22px] border border-black/[.08] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[.14em] text-[#0066cc]">
            {label}
          </span>
          <p className="mt-2 text-base font-semibold leading-6">
            {description}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#eef5fb] px-2.5 py-1 text-xs font-semibold text-[#0066cc]">
          {strength}
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-[#59636f]">
        {language === "fr"
          ? explainDoctrineScore(principle)
          : `Based on ${principle.evidence.length} supporting decision(s) and your latest feedback.`}
      </p>
      <details className="mt-3 rounded-xl border border-black/[.07] p-3">
        <summary className="cursor-pointer text-xs font-semibold">
          {text(
            "Comment ce score est calculé ?",
            "How is this score calculated?",
          )}
        </summary>
        <ul className="mt-3 space-y-2 text-xs leading-5 text-[#59636f]">
          {SCORE_METHOD.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </details>
      <details className="mt-3 rounded-xl bg-[#f6f6f3] p-3">
        <summary className="cursor-pointer text-xs font-semibold">
          {text(
            `Voir les décisions sources (${principle.evidence.length})`,
            `View source decisions (${principle.evidence.length})`,
          )}
        </summary>
        <div className="mt-3 space-y-2">
          {principle.evidence.map((item) => (
            <div
              key={item.decisionId}
              className="border-l-2 border-[#0071e3]/30 pl-3"
            >
              <strong className="block text-xs">{item.outcome}</strong>
              <span className="mt-1 block text-xs leading-5 text-[#59636f]">
                {item.rationale}
              </span>
            </div>
          ))}
        </div>
      </details>
      {editing ? (
        <div className="mt-4">
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            className="min-h-24 w-full rounded-xl border border-black/10 p-3 text-sm"
          />
          <button
            onClick={() => {
              onFeedback(principle, "corrected", statement);
              setEditing(false);
            }}
            className="mt-2 rounded-full bg-[#0071e3] px-4 py-2 text-xs font-bold text-white"
          >
            {text("Enregistrer", "Save")}
          </button>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <button
            disabled={principle.status === "confirmed"}
            onClick={() => onFeedback(principle, "confirmed")}
            className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[#0066cc] disabled:bg-[#eaf6ee]"
          >
            {principle.status === "confirmed"
              ? text("Confirmé ✓", "Confirmed ✓")
              : text("Cela me ressemble", "This sounds like me")}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold"
          >
            {text("Corriger", "Correct")}
          </button>
        </div>
      )}
    </article>
  );
}

function OpportunityCard({
  item,
  doctrine,
  isDemo,
  feedback,
  onFeedback,
  onOpen,
}: {
  item: import("@/domain/canonical").CognitiveCase;
  doctrine: ReturnType<typeof buildDecisionDoctrine>;
  isDemo: boolean;
  feedback: ComplementFeedback[];
  onFeedback: (spot: BlindSpot, kind: FeedbackKind) => void;
  onOpen: () => void;
}) {
  const { language, text } = useLanguage();
  const prediction = predictDecisionOrientation({
    cognitiveCase: item,
    doctrine,
  });
  const complement = buildComplementReport({ text: `${item.title} ${item.objective} ${item.context}`, feedback });
  return (
    <article className="rounded-[24px] border border-black/10 bg-[#fffefa] p-5">
      <div className="flex justify-between gap-3">
        <span className="text-[10px] font-black uppercase text-[#0066cc]">
          {isDemo && (
            <b className="mr-2 rounded bg-[#fff1c7] px-2 py-1">
              {text("EXEMPLE", "EXAMPLE")}
            </b>
          )}
          {item.state}
        </span>
        <span className="text-xs text-[#6e6e73]">
          {text("Confiance", "Confidence")}:{" "}
          {language === "fr"
            ? prediction.confidenceLabel
            : (
                {
                  limitée: "limited",
                  modérée: "moderate",
                  étayée: "supported",
                } as const
              )[prediction.confidenceLabel]}
        </span>
      </div>
      <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#59636f]">{item.objective}</p>
      <div className="mt-4 rounded-xl bg-[#f2f7fc] p-3 text-xs">
        <strong>
          {text("Orientation probable", "Likely direction")}:{" "}
          {prediction.orientation}
        </strong>
        <span className="mt-1 block text-[#59636f]">
          {prediction.reasons.join(" · ")}
          {prediction.missing.length
            ? ` · ${text("Manque", "Missing")}: ${prediction.missing.join(", ")}`
            : ""}
        </span>
      </div>
      <details className="mt-3 rounded-xl border border-black/[.07] p-3">
        <summary className="cursor-pointer text-xs font-semibold">
          {text(
            "Comment cette analyse est produite ?",
            "How is this analysis produced?",
          )}
        </summary>
        <p className="mt-2 text-xs leading-5 text-[#59636f]">
          {text(
            "Les critères sont extraits des décisions passées, pondérés par leur récurrence et vos confirmations, puis comparés aux faits, contradictions et informations manquantes de cette option.",
            "Criteria are extracted from past decisions, weighted by recurrence and your confirmations, then compared with this option's facts, contradictions and missing information.",
          )}
        </p>
        <div className="mt-3 space-y-2">
          {prediction.factors.map((factor) => (
            <div
              key={factor.id}
              className="grid grid-cols-[1fr_auto_auto] gap-2 text-xs"
            >
              <span>{factor.label}</span>
              <span>{factor.importance}</span>
              <strong>{factor.situation}</strong>
            </div>
          ))}
        </div>
      </details>
      <section className="mt-3 rounded-xl bg-[#fff7ed] p-3">
        <strong className="text-xs text-[#9a4d09]">Ce que vous n’avez peut-être pas encore examiné</strong>
        <div className="mt-2 space-y-3">{complement.complements.map((spot) => (
          <div key={spot.axis} className="text-xs">
            <b>{spot.label}</b><p className="mt-1 leading-5 text-[#59636f]">{spot.question}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <button onClick={() => onFeedback(spot, "useful")} className="text-[#0066cc]">Cet axe est utile</button>
              <button onClick={() => onFeedback(spot, "already_considered")} className="text-[#59636f]">J’y avais déjà pensé</button>
              <button onClick={() => onFeedback(spot, "changed_decision")} className="text-[#287a46]">Cela change ma décision</button>
            </div>
          </div>
        ))}</div>
      </section>
      <div className="mt-3 rounded-xl border border-black/[.07] p-3 text-xs"><b>Question décisive</b><p className="mt-1 leading-5">{complement.decisiveQuestion}</p><p className="mt-2 text-[#59636f]">Prochaine vérification : {complement.nextCheck}</p></div>
      <button
        onClick={onOpen}
        className="mt-4 text-sm font-semibold text-[#0066cc]"
      >
        {text("Confronter à mes critères →", "Compare with my criteria →")}
      </button>
    </article>
  );
}

function Input({
  label,
  value,
  set,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        className="mt-2 min-h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm"
      />
    </label>
  );
}
function Area({
  label,
  value,
  set,
  placeholder,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <textarea
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        className="mt-2 min-h-28 w-full rounded-2xl border border-black/10 bg-white p-4 text-sm"
      />
    </label>
  );
}

type DialogProps = {
  mode: Mode;
  close: () => void;
  history: string;
  setHistory: (v: string) => void;
  extracted: ExtractedDecision[];
  importHistory: () => void;
  company: string;
  setCompany: (v: string) => void;
  question: string;
  setQuestion: (v: string) => void;
  deadline: string;
  setDeadline: (v: string) => void;
  options: string;
  setOptions: (v: string) => void;
  evidence: string;
  setEvidence: (v: string) => void;
  constraints: string;
  setConstraints: (v: string) => void;
  tradeoff: string;
  setTradeoff: (v: string) => void;
  stopRule: string;
  setStopRule: (v: string) => void;
  weeklyHours: string;
  setWeeklyHours: (v: string) => void;
  commitment: "explore" | "engage" | "dismiss";
  setCommitment: (v: "explore" | "engage" | "dismiss") => void;
  submit: () => void;
  capacityFull: boolean;
};
function OpportunityDialog(p: DialogProps) {
  const { text } = useLanguage();
  const isHistory = p.mode === "history";
  const capacityBlocked =
    p.capacityFull && p.commitment === "engage" && !p.tradeoff.trim();
  const valid = isHistory
    ? Boolean(p.history.trim())
    : Boolean(
        p.company.trim() &&
          p.question.trim() &&
          p.deadline &&
          p.options.trim() &&
          p.tradeoff.trim() &&
          p.stopRule.trim() &&
          p.weeklyHours.trim() &&
          !capacityBlocked,
      );
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-end bg-black/60 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          isHistory ? p.importHistory() : p.submit();
        }}
        className="max-h-[94dvh] w-full overflow-y-auto rounded-t-[28px] bg-[#fffefa] p-6 text-[#1d1d1f] sm:max-w-3xl sm:rounded-[28px] md:p-8"
      >
        <div className="flex justify-between gap-4">
          <h2 className="text-2xl font-semibold">
            {isHistory
              ? text("Importer des décisions passées", "Import past decisions")
              : text(
                  "Quelle décision faut-il trancher ?",
                  "What decision needs to be made?",
                )}
          </h2>
          <button
            type="button"
            onClick={p.close}
            className="grid size-10 place-items-center rounded-full border border-black/10"
          >
            ×
          </button>
        </div>
        {isHistory ? (
          <div className="mt-6">
            <Area
              label={text(
                p.extracted.length
                  ? "Prévisualisation structurée — modifiez le texte pour relancer l’extraction"
                  : "Collez plusieurs décisions, e-mails ou notes de réunion",
                p.extracted.length
                  ? "Structured preview — edit the text to run extraction again"
                  : "Paste multiple decisions, emails or meeting notes",
              )}
              value={p.history}
              set={p.setHistory}
              placeholder={text(
                "Une décision par bloc : situation, options, choix, pourquoi, résultat…",
                "One decision per block: situation, options, choice, why, outcome…",
              )}
            />
            {p.extracted.length > 0 && (
              <div className="mt-4 rounded-2xl border border-[#0071e3]/20 bg-[#eef6ff] p-4">
                <strong className="text-sm">
                  {p.extracted.length} {text("décisions détectées", "decisions detected")}
                </strong>
                <p className="mt-1 text-xs leading-5 text-[#59636f]">
                  {text(
                    "Vérifiez les choix et résultats avant de les ajouter à votre doctrine.",
                    "Review choices and outcomes before adding them to your doctrine.",
                  )}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <span className="text-sm font-semibold">
                {text("Statut visé", "Target status")}
              </span>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(
                  [
                    ["explore", text("Explorer", "Explore")],
                    ["engage", text("Engager", "Commit")],
                    ["dismiss", text("Écarter", "Dismiss")],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={p.commitment === id}
                    onClick={() => p.setCommitment(id)}
                    className={`rounded-xl border px-3 py-3 text-xs font-bold ${p.commitment === id ? "border-[#0071e3] bg-[#eef6ff] text-[#0066cc]" : "border-black/10 bg-white"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Input
              label={text("Sujet ou opportunité", "Topic or opportunity")}
              value={p.company}
              set={p.setCompany}
              placeholder={text(
                "Automatisation d’une ligne de production",
                "Production line automation",
              )}
            />
            <Input
              label={text("Question à trancher", "Decision question")}
              value={p.question}
              set={p.setQuestion}
              placeholder={text(
                "Investir maintenant ou lancer un pilote limité ?",
                "Invest now or run a limited pilot?",
              )}
            />
            <Input
              type="date"
              label={text("Date limite", "Deadline")}
              value={p.deadline}
              set={p.setDeadline}
              placeholder=""
            />
            <Input
              type="number"
              label={text(
                "Heures disponibles / semaine",
                "Available hours / week",
              )}
              value={p.weeklyHours}
              set={p.setWeeklyHours}
              placeholder="8"
            />
            <div className="md:col-span-2">
              <Area
                label={text(
                  "Options réellement envisageables",
                  "Realistic options",
                )}
                value={p.options}
                set={p.setOptions}
                placeholder={text(
                  "Option A / Option B : bénéfices, coûts, risques, réversibilité",
                  "Option A / Option B: benefits, costs, risks, reversibility",
                )}
              />
            </div>
            <Area
              label={text("Preuves disponibles", "Available evidence")}
              value={p.evidence}
              set={p.setEvidence}
              placeholder={text(
                "Entretiens, usage, revenu…",
                "Interviews, usage, revenue…",
              )}
            />
            <Area
              label={text(
                "Contraintes non négociables",
                "Non-negotiable constraints",
              )}
              value={p.constraints}
              set={p.setConstraints}
              placeholder={text(
                "Travail, budget, équipe…",
                "Job, budget, team…",
              )}
            />
            <Area
              label={text(
                "Quel chantier sera arrêté, délégué ou reporté ?",
                "What will be stopped, delegated or postponed?",
              )}
              value={p.tradeoff}
              set={p.setTradeoff}
              placeholder={text("Réponse obligatoire", "Required answer")}
            />
            <Area
              label={text("Critère et date d’arrêt", "Stop criterion and date")}
              value={p.stopRule}
              set={p.setStopRule}
              placeholder={text(
                "Arrêter si moins de 2 pilotes payants après 6 semaines",
                "Stop if fewer than 2 paying pilots after 6 weeks",
              )}
            />
            {p.capacityFull && p.commitment === "engage" && (
              <div className="md:col-span-2 rounded-2xl border border-[#b45309]/20 bg-[#fff7ed] p-4 text-sm">
                <strong>
                  {text(
                    "Confrontation obligatoire : budget d’attention plein. Désignez explicitement le chantier remplacé.",
                    "Mandatory challenge: attention budget full. Explicitly name the initiative being replaced.",
                  )}
                </strong>
              </div>
            )}
          </div>
        )}
        <button
          disabled={!valid}
          className="mt-6 min-h-12 w-full rounded-full bg-[#0071e3] px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
        >
          {isHistory
            ? text(
                p.extracted.length
                  ? "Importer les décisions détectées"
                  : "Extraire 3 à 5 décisions",
                p.extracted.length
                  ? "Import detected decisions"
                  : "Extract 3 to 5 decisions",
              )
            : text(
                "Confronter cette décision à mes critères",
                "Compare this decision with my criteria",
              )}
        </button>
      </form>
    </div>
  );
}
