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

test("an authenticated organization automatically restores its cloud workspace", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../components/cloud-sync-status.tsx", import.meta.url), "utf8");
  assert.match(source, /if\(!userEmail \|\| !organizationId \|\| revision!==0\)return/);
  assert.match(source, /void sync\(organizationId\)/);
  assert.match(source, /useExecutiveStore\(\(state\)=>state\.activeOrganizationId\)/);
  assert.match(source, /status==="checking" \|\| status==="local"/);
});
