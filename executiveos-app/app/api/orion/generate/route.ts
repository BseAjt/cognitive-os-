import { createClient } from "@/lib/supabase/server";
import {
  generateOrionCycle,
  isOrionAIRuntimeConfigured,
  OrionAIRuntimeUnavailableError,
  type OrionAIGenerationInput
} from "@/lib/orion-ai-runtime";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const headers = { "Cache-Control": "private, no-store" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers });

export function GET() {
  return json({ configured: isOrionAIRuntimeConfigured(), runtime: "ai_gateway" });
}

export async function POST(request: Request) {
  const client = await createClient();
  if (!client) return json({ error: "cloud_not_configured" }, 503);
  const { data: { user } } = await client.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);
  if (Number(request.headers.get("content-length") ?? 0) > 250_000) return json({ error: "payload_too_large" }, 413);

  const input = await request.json().catch(() => null) as OrionAIGenerationInput | null;
  if (!input?.objective || !input.cognitiveCase?.id || !Array.isArray(input.sources) || !Array.isArray(input.evidence)) {
    return json({ error: "invalid_orion_request" }, 400);
  }

  try {
    return json(await generateOrionCycle(input));
  } catch (error) {
    if (error instanceof OrionAIRuntimeUnavailableError) return json({ error: "ai_runtime_not_configured" }, 503);
    console.error("ORION_AI_GENERATION_FAILED", { caseId: input.cognitiveCase.id, error });
    return json({ error: "orion_generation_failed" }, 502);
  }
}
