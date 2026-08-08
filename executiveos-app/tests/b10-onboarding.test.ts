import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const page=readFileSync(new URL("../app/page.tsx",import.meta.url),"utf8");
const gate=readFileSync(new URL("../components/cloud-workspace-gate.tsx",import.meta.url),"utf8");
const onboarding=readFileSync(new URL("../components/product-onboarding.tsx",import.meta.url),"utf8");
const api=readFileSync(new URL("../app/api/onboarding/route.ts",import.meta.url),"utf8");
const schema=readFileSync(new URL("../supabase/schema.sql",import.meta.url),"utf8");

test("B10 sends authenticated users without membership through onboarding",()=>{
  assert.match(page,/organization_members/);
  assert.match(gate,/user && !membership/);
});

test("B10 offers a real first dossier and an investor demo",()=>{
  assert.match(onboarding,/Mon premier dossier/);
  assert.match(onboarding,/Explorer la démo/);
  assert.match(onboarding,/createBlankWorkspace/);
  assert.match(onboarding,/loadInvestorDemo/);
});

test("B10 authenticates onboarding and limits all user supplied values",()=>{
  assert.match(api,/auth\.getUser/);
  assert.match(api,/length>80/);
  assert.match(schema,/auth\.uid\(\)/);
  assert.match(schema,/workspace already initialized/);
  assert.match(schema,/revoke all on function public\.bootstrap_organization\(text,text\) from public,anon/);
  assert.match(schema,/grant execute on function public\.bootstrap_organization\(text,text\) to authenticated/);
  assert.match(schema,/private\.bootstrap_organization_core/);
  assert.match(schema,/public\.bootstrap_organization[\s\S]*security invoker/);
});
