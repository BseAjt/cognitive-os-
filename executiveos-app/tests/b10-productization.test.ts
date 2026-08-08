import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {buildActivation} from "../lib/product-activation.ts";

test("B10.2 activation is derived from real product evidence",()=>{
  const result=buildActivation({cases:1,sources:1,orionCycles:1,decisions:1,actions:1,members:2,cloudConnected:true});
  assert.equal(result.proof.activation,100);assert.equal(result.proof.timeToValueReady,true);assert.equal(result.proof.decisionCoverage,100);
});

test("B10.2 activation remains honest for an empty workspace",()=>{
  const result=buildActivation({cases:0,sources:0,orionCycles:0,decisions:0,actions:0,members:1,cloudConnected:false});
  assert.equal(result.proof.activation,0);assert.equal(result.proof.timeToValueReady,false);
});

const profileApi=readFileSync(new URL("../app/api/product/profile/route.ts",import.meta.url),"utf8");
const invitationApi=readFileSync(new URL("../app/api/team/invitations/route.ts",import.meta.url),"utf8");
const schema=readFileSync(new URL("../supabase/schema.sql",import.meta.url),"utf8");
test("B10.3 and B10.4 cloud routes authenticate and remain organization scoped",()=>{
  assert.match(profileApi,/auth\.getUser/);assert.match(profileApi,/organization_id/);
  assert.match(invitationApi,/auth\.getUser/);assert.match(invitationApi,/organization_invitations/);
  assert.match(schema,/organization_product_profiles/);assert.match(schema,/product_events/);
});
