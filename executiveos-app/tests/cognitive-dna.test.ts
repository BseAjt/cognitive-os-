import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCognitiveProfile } from "../lib/cognitive-dna.ts";
import type { DecisionRecord, LearningEventRecord, ReflectionRecord } from "../domain/canonical.ts";

const decisions: DecisionRecord[] = [
  { id:"d1", caseId:"dna", recommendation:"A", outcome:"Lancer", rationale:"r", confidence:92, createdAt:"2026-08-01T10:00:00.000Z" },
  { id:"d2", caseId:"dna", recommendation:"B", outcome:"Reporter", rationale:"r", confidence:88, createdAt:"2026-08-02T10:00:00.000Z" }
];
const events: LearningEventRecord[] = [
  { id:"e1",caseId:"dna",type:"BeliefReinforced",title:"Hypothèse renforcée",detail:"A",significance:"medium",confidence:85,source:"cognitive_diff",createdAt:"2026-08-03T10:00:00.000Z" },
  { id:"e2",caseId:"dna",type:"BeliefInvalidated",title:"Hypothèse invalidée",detail:"B",significance:"high",confidence:90,source:"cognitive_diff",createdAt:"2026-08-03T10:00:00.000Z" },
  { id:"e3",caseId:"dna",type:"DecisionReversed",title:"Décision renversée",detail:"Avant: Lancer · Après: Reporter",significance:"high",confidence:88,source:"cognitive_diff",createdAt:"2026-08-03T10:00:00.000Z" },
  { id:"e4",caseId:"dna",type:"RiskDetected",title:"Risque",detail:"Churn",significance:"medium",confidence:82,source:"cognitive_diff",createdAt:"2026-08-03T10:00:00.000Z" },
  { id:"e5",caseId:"dna",type:"RiskResolved",title:"Risque résolu",detail:"Churn",significance:"medium",confidence:84,source:"cognitive_diff",createdAt:"2026-08-04T10:00:00.000Z" },
  { id:"e6",caseId:"dna",type:"KnowledgeLearned",title:"Apprentissage",detail:"Segment entreprise",significance:"low",confidence:80,source:"cognitive_diff",createdAt:"2026-08-04T10:00:00.000Z" }
];
const reflections: ReflectionRecord[] = [{ id:"r1",caseId:"dna",summary:"Réviser",whatChanged:["décision"],whyItChanged:["preuve"],learned:["segment"],uncertainties:[],decisionsToReconsider:["Reporter"],confidence:86,significance:"high",source:"reflection_engine",createdAt:"2026-08-04T10:00:00.000Z" }];

test("cognitive DNA derives bounded calibration metrics from history",()=>{
  const profile=buildCognitiveProfile({caseId:"dna",decisions,learningEvents:events,reflections,createdAt:"2026-08-05T10:00:00.000Z"});
  for(const value of [profile.calibration,profile.beliefStability,profile.revisionRate,profile.riskDiscipline,profile.learningQuality]) assert.ok(value>=0&&value<=100);
  assert.equal(profile.caseId,"dna"); assert.ok(profile.sampleSize>0); assert.equal(profile.riskDiscipline,100); assert.ok(profile.revisionRate>0);
});

test("cognitive DNA keeps stable identity across recalibration",()=>{
  const first=buildCognitiveProfile({caseId:"dna",decisions,learningEvents:events,reflections,createdAt:"2026-08-05T10:00:00.000Z"});
  const second=buildCognitiveProfile({caseId:"dna",decisions,learningEvents:events,reflections,previous:first,createdAt:"2026-08-06T10:00:00.000Z"});
  assert.equal(second.id,first.id); assert.equal(second.createdAt,first.createdAt); assert.notEqual(second.updatedAt,first.updatedAt);
});

const here=dirname(fileURLToPath(import.meta.url)); const root=resolve(here,".."); const source=(path:string)=>readFileSync(resolve(root,path),"utf8");
const canonical=source("domain/canonical.ts"),types=source("store/types.ts"),slices=source("store/slices.ts"),commands=source("store/commands.ts"),store=source("store/executive-store.ts");
for(const [name,file,expected] of [
 ["canonical cognitive profile exists",canonical,"interface CognitiveProfileRecord"],
 ["state exposes cognitive profiles",types,"cognitiveProfiles:CognitiveProfileRecord[]"],
 ["profile slice initializes",slices,"cognitiveProfiles: []"],
 ["runtime recalibrates profile",commands,"buildCognitiveProfile"],
 ["runtime persists profile",commands,"cognitiveProfiles: [profile"],
 ["runtime projects profile graph node",commands,"type: \"cognitive_profile\""],
 ["persistence schema is v13",store,"version:13"]
] as const) test(name,()=>assert.ok(file.includes(expected),`Missing cognitive DNA contract: ${expected}`));
