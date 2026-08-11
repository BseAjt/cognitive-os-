import assert from "node:assert/strict";
import test from "node:test";
import { publicCopy } from "../lib/public-copy.ts";

test("internal agent identities never reach user-facing copy", () => {
  const visible = publicCopy("ORION confronte ATHENA, TURING et SENECA.");
  assert.equal(/\b(?:ORION|ATHENA|TURING|SENECA)\b/i.test(visible), false);
  assert.match(visible, /Perspective stratégique/);
  assert.match(visible, /Perspective de faisabilité/);
  assert.match(visible, /Perspective de prudence/);
});
