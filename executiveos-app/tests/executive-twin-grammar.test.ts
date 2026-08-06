import test from "node:test";
import assert from "node:assert/strict";
import { ENTITY_DEFINITIONS, RELATIONSHIP_RULES, validateRelationship } from "../lib/executive-twin-grammar";

test("grammar defines every fundamental entity", () => {
  const expected = ["organization","person","team","project","goal","kpi","decision","decision_case","scenario","context","context_item","risk","opportunity","meeting","conversation","document","email","action","commitment","learning","insight","hypothesis","fact","memory"];
  assert.deepEqual(Object.keys(ENTITY_DEFINITIONS).sort(), expected.sort());
});

test("every entity has role, lifecycle and business rules", () => {
  for (const definition of Object.values(ENTITY_DEFINITIONS)) {
    assert.ok(definition.role.length > 10);
    assert.ok(definition.requiredAttributes.includes("id"));
    assert.ok(definition.lifecycle.length >= 2);
    assert.ok(definition.businessRules.length >= 1);
  }
});

test("decision case contains the executive decision grammar", () => {
  const decisionCase = ENTITY_DEFINITIONS.decision_case;
  for (const attribute of ["id","title","ownerId","objectiveId","contextId","scenarioIds","boardAssessmentIds","selectedScenarioId","rationale","reviewTriggerIds","outcomeMetricIds","status"]) {
    assert.ok([...decisionCase.requiredAttributes, ...decisionCase.optionalAttributes].includes(attribute), attribute);
  }
});

test("canonical CEO and decision graph relationships are allowed", () => {
  assert.equal(validateRelationship("person", "OWNS", "decision_case"), true);
  assert.equal(validateRelationship("person", "ATTENDS", "meeting"), true);
  assert.equal(validateRelationship("person", "SPONSORS", "project"), true);
  assert.equal(validateRelationship("person", "DEFINES", "goal"), true);
  assert.equal(validateRelationship("decision_case", "USES_CONTEXT", "context"), true);
  assert.equal(validateRelationship("decision", "CREATES", "action"), true);
  assert.equal(validateRelationship("decision", "MITIGATES", "risk"), true);
  assert.equal(validateRelationship("decision", "UPDATES", "memory"), true);
});

test("invalid semantic edges are rejected", () => {
  assert.equal(validateRelationship("email", "OWNS", "organization"), false);
  assert.equal(validateRelationship("risk", "ATTENDS", "meeting"), false);
  assert.equal(validateRelationship("kpi", "SELECTS", "scenario"), false);
});

test("relationship vocabulary is unique", () => {
  const keys = RELATIONSHIP_RULES.map((rule) => `${rule.type}:${rule.from.join(",")}:${rule.to.join(",")}`);
  assert.equal(new Set(keys).size, keys.length);
});
