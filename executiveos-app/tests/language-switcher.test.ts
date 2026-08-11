import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const provider = readFileSync(new URL("../components/language-provider.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../components/executive-home-v4.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");

test("French and English preference is persisted and updates the document language", () => {
  assert.match(provider, /cognitiveos-language/);
  assert.match(provider, /localStorage\.setItem/);
  assert.match(provider, /document\.documentElement\.lang = language/);
});

test("the bilingual selector is available from the persistent application header", () => {
  assert.match(layout, /<LanguageProvider>/);
  assert.match(home, /<LanguageSwitcher\/>/);
  assert.match(home, /Your private decision twin/);
  assert.match(home, /Analyze an opportunity/);
});
