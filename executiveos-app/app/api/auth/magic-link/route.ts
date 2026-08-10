import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/";
}

export async function POST(request: Request) {
  const input = await request.json().catch(() => null) as { email?: unknown; next?: unknown } | null;
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const client = await createClient();
  if (!client) return NextResponse.json({ error: "cloud_not_configured" }, { status: 503 });

  const next = safeNext(input?.next);
  const origin = new URL(request.url).origin;
  const emailRedirectTo = `${getSiteUrl(origin)}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo } });

  if (error) {
    console.warn("[auth/magic-link] request failed", { code: error.code, status: error.status });
    return NextResponse.json(
      { error: error.code ?? "magic_link_failed" },
      { status: error.status === 429 ? 429 : 400 },
    );
  }

  return NextResponse.json({ sent: true });
}
