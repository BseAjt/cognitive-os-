import assert from "node:assert/strict";
import test from "node:test";
import {buildDiscDecisionBrief,isDiscDecisionProfile} from "../lib/disc-decision-profile.ts";

test("DISC brief keeps mastered strengths separate from complementary challenges",()=>{
  const brief=buildDiscDecisionBrief({primary:"D",secondary:"C",adapted:"S"});
  assert.match(brief.title,/Dominant/);
  assert.ok(brief.mastered.includes("passage à l’action"));
  assert.ok(brief.complements.includes("réversibilité"));
  assert.match(brief.adaptedContext,/stable/);
});

test("DISC profile requires distinct primary and secondary styles",()=>{
  assert.equal(isDiscDecisionProfile({primary:"I",secondary:"S",adapted:"D"}),true);
  assert.equal(isDiscDecisionProfile({primary:"I",secondary:"I",adapted:"D"}),false);
  assert.equal(isDiscDecisionProfile({primary:"X",secondary:"S",adapted:"D"}),false);
});
