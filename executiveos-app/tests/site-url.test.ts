import assert from "node:assert/strict";
import test from "node:test";
import { getSiteUrl } from "../lib/site-url.ts";

test("uses and normalizes the canonical production URL", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://cognitive-os-lovat.vercel.app/";
  assert.equal(getSiteUrl("https://preview.example"), "https://cognitive-os-lovat.vercel.app");
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

test("uses the runtime origin when no canonical URL is configured", () => {
  assert.equal(getSiteUrl("https://preview.example/"), "https://preview.example");
});

test("production magic links use the server endpoint and support both Supabase callback formats", async () => {
  const { readFile } = await import("node:fs/promises");
  const signIn = await readFile(new URL("../components/cloud-sign-in.tsx", import.meta.url), "utf8");
  const magicLink = await readFile(new URL("../app/api/auth/magic-link/route.ts", import.meta.url), "utf8");
  const callback = await readFile(new URL("../app/auth/callback/route.ts", import.meta.url), "utf8");
  const confirm = await readFile(new URL("../app/auth/confirm/route.ts", import.meta.url), "utf8");

  assert.match(signIn, /fetch\("\/api\/auth\/magic-link"/);
  assert.match(signIn, /next: nextPath/);
  assert.match(magicLink, /signInWithOtp/);
  assert.match(magicLink, /emailRedirectTo/);
  assert.match(callback, /exchangeCodeForSession/);
  assert.match(callback, /verifyOtp/);
  assert.match(callback, /token_hash/);
  assert.match(callback, /code exchange failed/);
  assert.match(confirm, /verifyOtp/);
  assert.match(confirm, /token_hash/);
  assert.match(confirm, /exchangeCodeForSession/);
});

test("sign-in exposes the actual Supabase error instead of masking every failure as a delay", async () => {
  const { readFile } = await import("node:fs/promises");
  const signIn = await readFile(new URL("../components/cloud-sign-in.tsx", import.meta.url), "utf8");
  assert.match(signIn, /over_email_send_rate_limit/);
  assert.match(signIn, /result\.error/);
});
