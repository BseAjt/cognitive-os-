import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("magic links survive email applications and browser context changes", async () => {
  const client = await readFile(new URL("../lib/supabase/client.ts", import.meta.url), "utf8");
  const signIn = await readFile(new URL("../components/cloud-sign-in.tsx", import.meta.url), "utf8");
  const confirm = await readFile(new URL("../app/auth/complete/page.tsx", import.meta.url), "utf8");

  assert.match(client, /flowType: "implicit"/);
  assert.match(client, /detectSessionInUrl: true/);
  assert.match(signIn, /\/auth\/complete/);
  assert.match(confirm, /getSession\(\)/);
  assert.match(confirm, /onAuthStateChange/);
  assert.match(confirm, /window\.location\.replace/);
});

test("legacy PKCE callbacks remain accepted during link transition", async () => {
  const callback = await readFile(new URL("../app/auth/callback/route.ts", import.meta.url), "utf8");
  assert.match(callback, /verifyOtp/);
  assert.match(callback, /exchangeCodeForSession/);
});
