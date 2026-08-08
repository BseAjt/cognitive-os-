import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("production configuration exposes security headers and hides framework disclosure", () => {
  const config = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
  assert.match(config, /poweredByHeader:\s*false/);
  for (const header of ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"]) {
    assert.match(config, new RegExp(header));
  }
});

test("operational health route is dynamic and non-cacheable", () => {
  const route = readFileSync(new URL("../app/api/health/route.ts", import.meta.url), "utf8");
  assert.match(route, /dynamic = "force-dynamic"/);
  assert.match(route, /status: "ok"/);
  assert.match(route, /"Cache-Control": "no-store"/);
});

test("App Router provides user-safe error, loading and not-found states", () => {
  for (const file of ["error.tsx", "loading.tsx", "not-found.tsx"]) {
    assert.doesNotThrow(() => readFileSync(new URL(`../app/${file}`, import.meta.url), "utf8"));
  }
});
