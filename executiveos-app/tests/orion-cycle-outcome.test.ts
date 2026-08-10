import assert from "node:assert/strict";
import test from "node:test";
import { toExecutiveCycleRecord } from "../lib/orion-cycle-outcome.ts";
import { defaultExecutiveAgents } from "../lib/agent-runtime.ts";
import type { CognitiveCase, ContextEvidenceRecord, ContextSourceRecord } from "../domain/canonical.ts";

const cognitiveCase:CognitiveCase={id:"case-ai",title:"Pilote",objective:"Décider du pilote",workingHypothesis:"Le pilote crée de la valeur",context:"Arbitrage",state:"decide",signals:{impact:8,urgency:7,confidence:70,cognitiveCost:5,risk:6}};
const sources:ContextSourceRecord[]=[{id:"source-ai",caseId:cognitiveCase.id,type:"note",title:"Retour pilote",origin:"COMEX",status:"ready",rawContent:"Le délai diminue.",summary:"Gain observé",wordCount:3,createdAt:"2026-08-10T08:00:00.000Z"}];
const evidence:ContextEvidenceRecord[]=[{id:"evidence-ai",caseId:cognitiveCase.id,sourceId:sources[0]!.id,claim:"Le délai diminue.",excerpt:"délai diminue",confidence:90,position:0,createdAt:"2026-08-10T08:00:00.000Z"}];

const baseOutput = {
  synthesis:"ORION recommande un pilote mesuré après confrontation des perspectives spécialisées.",
  recommendation:"Lancer un pilote de quatre semaines avec un critère de sortie explicite.",
  contributions:[
    {agentId:"athena" as const,position:"support" as const,analysis:"Le pilote sert la trajectoire stratégique et limite le risque initial.",confidence:84,citations:["S1"]},
    {agentId:"turing" as const,position:"conditional" as const,analysis:"Le propriétaire et le seuil de succès doivent être définis avant lancement.",confidence:81,citations:["S1"]},
    {agentId:"seneca" as const,position:"challenge" as const,analysis:"La réversibilité doit être garantie par un seuil d’arrêt observable.",confidence:79,citations:["S1"]}
  ],
  debates:[
    {criticId:"athena" as const,targetId:"turing" as const,objection:"La prudence opérationnelle ne doit pas retarder inutilement le pilote.",objectionCitations:["S1"],response:"Le pilote peut démarrer avec un responsable et un seuil documentés.",responseCitations:["S1"],resolution:"resolved" as const,unresolvedPoint:null},
    {criticId:"turing" as const,targetId:"seneca" as const,objection:"Le seuil d’arrêt proposé doit pouvoir être mesuré chaque semaine.",objectionCitations:["S1"],response:"Une mesure hebdomadaire rend effectivement la sortie actionnable.",responseCitations:["S1"],resolution:"partial" as const,unresolvedPoint:"Définir la métrique exacte."},
    {criticId:"seneca" as const,targetId:"athena" as const,objection:"Le bénéfice stratégique reste dépendant d’une hypothèse encore fragile.",objectionCitations:["S1"],response:"Le pilote est précisément conçu pour tester cette hypothèse à faible coût.",responseCitations:["S1"],resolution:"resolved" as const,unresolvedPoint:null}
  ],
  assumptions:[],missingEvidence:[],confidence:82,
  decisionMemo:{status:"conditional" as const,rationale:[{claim:"Un pilote limité produit la preuve manquante avec un engagement réversible.",citations:["S1"],agentIds:["athena" as const,"seneca" as const]}],conditions:["Définir le seuil d’arrêt avant lancement."],confidenceExplanation:"La confiance est soutenue par la preuve disponible et limitée par une hypothèse à tester."}
};

function result(output=baseOutput){return {output,runtime:"ai_gateway" as const,model:"test",generatedAt:"2026-08-10T10:00:00.000Z",durationMs:12,trace:{cycleId:"cycle-ai",stages:[] as never[],evidenceManifest:[{citation:"S1",evidenceId:evidence[0]!.id,sourceId:sources[0]!.id,sourceTitle:sources[0]!.title,confidence:90}]}};}

test("AI council result becomes an actionable persisted executive cycle",()=>{
  const cycle=toExecutiveCycleRecord({objective:"Arbitrer le pilote",cognitiveCase,sources,evidence},result(),defaultExecutiveAgents);
  assert.equal(cycle.status,"completed");
  assert.equal(cycle.id,"cycle-ai");
  assert.equal(cycle.contributions.length,3);
  assert.equal(cycle.divergences.length,1);
  assert.deepEqual(cycle.sourceIds,[sources[0]!.id]);
});

test("a hold memo remains blocked and cannot silently create a decision",()=>{
  const output={...baseOutput,recommendation:null,missingEvidence:["Ajouter un retour client."],decisionMemo:{...baseOutput.decisionMemo,status:"hold" as const}};
  const cycle=toExecutiveCycleRecord({objective:"Arbitrer",cognitiveCase,sources,evidence},result(output),defaultExecutiveAgents);
  assert.equal(cycle.status,"blocked");
  assert.equal(cycle.recommendation,null);
  assert.ok(cycle.missingEvidence.includes("Ajouter un retour client."));
});
