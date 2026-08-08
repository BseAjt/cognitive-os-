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

test("production magic links use the browser-independent confirmation route", async () => {
  const { readFile } = await import("node:fs/promises");
  const signIn = await readFile(new URL("../components/cloud-sign-in.tsx", import.meta.url), "utf8");
  const confirm = await readFile(new URL("../app/auth/confirm/route.ts", import.meta.url), "utf8");
  assert.match(signIn, /\/auth\/confirm/);
  assert.match(confirm, /verifyOtp/);
  assert.match(confirm, /token_hash/);
});
