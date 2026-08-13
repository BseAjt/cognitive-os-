import { createClient } from "@/lib/supabase/server";
import {
  scoreDecisionAssessment,
  validateAssessmentAnswers,
  type AssessmentAnswer,
} from "@/lib/decision-thinking-profile";

const headers = { "Cache-Control": "private, no-store" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers });

async function context() {
  const client = await createClient();
  if (!client) return { error: json({ error: "cloud_not_configured" }, 503) };
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { error: json({ error: "unauthorized" }, 401) };
  const { data: membership } = await client
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!membership) return { error: json({ error: "organization_not_found" }, 404) };
  return { client, user, organizationId: membership.organization_id };
}

export async function GET() {
  const current = await context();
  if ("error" in current) return current.error;
  const { data, error } = await current.client
    .from("user_decision_profiles")
    .select("disc_primary,disc_secondary,disc_adapted,disc_scores,dimension_scores,confidence,evidence_count,assessment_answers,updated_at")
    .eq("organization_id", current.organizationId)
    .eq("user_id", current.user.id)
    .maybeSingle();
  if (error) return json({ error: "profile_read_failed" }, 500);
  return json({ profile: data ?? null });
}

export async function PUT(request: Request) {
  const current = await context();
  if ("error" in current) return current.error;
  const input = await request.json().catch(() => null) as { answers?: AssessmentAnswer[] } | null;
  const answers = input?.answers ?? [];
  if (!validateAssessmentAnswers(answers)) return json({ error: "invalid_assessment" }, 400);
  const profile = scoreDecisionAssessment(answers);
  const row = {
    organization_id: current.organizationId,
    user_id: current.user.id,
    disc_primary: profile.discPrimary,
    disc_secondary: profile.discSecondary,
    disc_adapted: profile.discPrimary,
    disc_scores: profile.discScores,
    dimension_scores: profile.dimensions,
    assessment_answers: answers,
    confidence: profile.confidence,
    evidence_count: profile.evidenceCount,
    source: "self_assessment",
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await current.client
    .from("user_decision_profiles")
    .upsert(row, { onConflict: "organization_id,user_id" })
    .select("disc_primary,disc_secondary,disc_scores,dimension_scores,confidence,evidence_count,assessment_answers,updated_at")
    .single();
  if (error) return json({ error: "profile_save_failed" }, 500);
  return json({ profile: data });
}
