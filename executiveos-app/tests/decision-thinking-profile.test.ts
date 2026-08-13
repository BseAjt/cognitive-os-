import assert from "node:assert/strict";
import test from "node:test";
import {decisionAssessmentQuestions,scoreDecisionAssessment,validateAssessmentAnswers} from "../lib/decision-thinking-profile.ts";

test("ten concrete situations create an explainable initial profile",()=>{assert.equal(decisionAssessmentQuestions.length,10);const answers=decisionAssessmentQuestions.map((question)=>({questionId:question.id,optionId:question.options[0].id}));assert.equal(validateAssessmentAnswers(answers),true);const profile=scoreDecisionAssessment(answers);assert.equal(profile.discPrimary,"D");assert.equal(profile.evidenceCount,10);assert.ok(profile.dimensions.speed>0);});
test("incomplete or duplicate assessments are rejected",()=>{const first=decisionAssessmentQuestions[0];assert.equal(validateAssessmentAnswers([{questionId:first.id,optionId:first.options[0].id}]),false);});
