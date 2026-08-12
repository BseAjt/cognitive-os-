import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = new Set<EmailOtpType>([
  "email",
  "magiclink",
  "recovery",
  "invite",
  "signup",
  "email_change",
]);

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(url.searchParams.get("next"));
  const client = await createClient();

  if (client && tokenHash && type && allowedTypes.has(type)) {
    const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    console.error("[auth/callback] token verification failed", {
      errorCode: error.code,
      status: error.status,
      type,
    });
  }

  if (client && code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    console.error("[auth/callback] code exchange failed", {
      errorCode: error.code,
      status: error.status,
    });
  }

  return NextResponse.redirect(new URL("/sign-in?error=session_exchange_failed", url.origin));
}
