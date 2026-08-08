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
