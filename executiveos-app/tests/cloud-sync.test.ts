import test from "node:test";
import assert from "node:assert/strict";
import { cloudSyncDecision,readLocalSnapshot } from "../lib/cloud-sync.ts";

test("reads only the persisted Zustand state",()=>{
  const storage={getItem:()=>JSON.stringify({state:{activeOrganizationId:"org-1",cases:[]},version:25})};
  assert.deepEqual(readLocalSnapshot(storage),{activeOrganizationId:"org-1",cases:[]});
});

test("rejects corrupted local snapshots",()=>assert.equal(readLocalSnapshot({getItem:()=>"{"}),null));
test("cloud revisions select pull, push or conflict deterministically",()=>{
  assert.equal(cloudSyncDecision(1,2),"pull");
  assert.equal(cloudSyncDecision(2,2),"push");
  assert.equal(cloudSyncDecision(3,2),"conflict");
});
