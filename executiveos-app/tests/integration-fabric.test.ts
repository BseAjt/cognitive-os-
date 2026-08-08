import test from "node:test";
import assert from "node:assert/strict";
import { buildSyncRun, demoSignals, normalizeExternalSignal, PROVIDER_CATALOG } from "../lib/integration-fabric.ts";
import type { IntegrationConnectionRecord } from "../domain/canonical.ts";

const connection:IntegrationConnectionRecord={id:"connector",provider:"gmail",label:"Gmail",status:"connected",enabled:true,scopes:["messages.read"],caseId:"case-b8",createdAt:"2026-08-08T08:00:00.000Z",updatedAt:"2026-08-08T08:00:00.000Z"};

test("B8 exposes the six product integrations behind one contract",()=>{assert.deepEqual(Object.keys(PROVIDER_CATALOG),["gmail","calendar","slack","notion","drive","meetings"]);assert.ok(Object.values(PROVIDER_CATALOG).every((item)=>item.scopes.length>0));});

test("B8 normalizes an external item with a stable idempotency fingerprint",()=>{const signal=demoSignals("gmail","2026-08-08T09:00:00.000Z")[0]!;const first=normalizeExternalSignal(connection,signal);const second=normalizeExternalSignal(connection,signal);assert.equal(first.fingerprint,"integration:gmail:gmail-2026-08-08");assert.equal(first.fingerprint,second.fingerprint);assert.equal(first.type,"message");assert.match(first.content,/budget du pilote/);});

test("B8 rejects cross-provider signals",()=>{assert.throws(()=>normalizeExternalSignal(connection,demoSignals("slack")[0]!),/ne correspond pas/);});

test("B8 records partial syncs without hiding failures",()=>{const run=buildSyncRun({id:"run",connection,discovered:3,ingested:1,duplicates:1,failed:1,sourceIds:["source"],startedAt:"2026-08-08T09:00:00.000Z",completedAt:"2026-08-08T09:01:00.000Z",errors:["Signal illisible"]});assert.equal(run.status,"partial");assert.equal(run.cursor,run.completedAt);assert.deepEqual(run.errors,["Signal illisible"]);});
