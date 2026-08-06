# Executive Twin Grammar v1

## Purpose

This document defines the common language of Executive Twin. It is the canonical contract shared by the user experience, APIs, storage, Knowledge Graph, intelligence engines and integrations.

A feature is conformant only when it uses these entities, lifecycle states, relationship types and business invariants without creating hidden parallel concepts.

## Core semantic families

### Organization and actors
- Organization: the governed enterprise boundary.
- Person: an individual stakeholder or decision maker.
- Team: an accountable organizational group.

### Strategy and execution
- Goal: an intended outcome.
- KPI: a measurable signal attached to a goal, project or risk.
- Project: a bounded initiative.
- Action: executable work.
- Commitment: an explicit promise with an owner and deadline.

### Decision intelligence
- DecisionCase: the complete living dossier before, during and after an executive decision.
- Context: the situational model for a DecisionCase.
- ContextItem: one fact, hypothesis, constraint, preference or uncertainty.
- Scenario: one option considered by a DecisionCase.
- Decision: the formal selection and rationale.
- Risk: a possible negative event.
- Opportunity: a possible positive event.

### Organizational memory
- Meeting, Conversation, Document and Email: source experiences.
- Fact: validated evidence-backed statement.
- Hypothesis: falsifiable belief.
- Insight: synthesized interpretation.
- Learning: validated lesson derived from outcomes.
- Memory: durable, versioned organizational understanding that preserves reasoning.

## DecisionCase canonical shape

A DecisionCase contains:
- id
- title
- ownerId
- objectiveId
- contextId
- scenarioIds
- boardAssessmentIds
- selectedScenarioId
- rationale
- reviewTriggerIds
- outcomeMetricIds
- deadline
- status

Rules:
1. A case starts as `draft` and becomes `active` once an owner and objective exist.
2. Missing, stale or contested required ContextItems move it to `blocked`.
3. Scenarios may be compared but never numerically ranked without sufficient evidence.
4. A selected scenario, rationale, conditions and dissenting views are mandatory before validation.
5. Validation creates a Decision; it does not erase the DecisionCase.
6. The case remains open for outcome monitoring and re-evaluation.
7. Review triggers can supersede the Decision and reactivate the case.

## Knowledge Graph grammar

The graph is directed, typed, temporal and evidence-aware.

Every edge stores:
- id
- type
- fromId
- toId
- sourceId
- confidence
- validFrom
- validTo
- createdAt
- createdBy

Canonical executive examples:

```text
CEO --OWNS--> DecisionCase
CEO --ATTENDS--> Meeting
CEO --SPONSORS--> Project
CEO --DEFINES--> Goal

DecisionCase --USES_CONTEXT--> Context
DecisionCase --CONSIDERS--> Scenario
DecisionCase --ASSESSED_BY--> Person/Team/Insight
Decision --SELECTS--> Scenario
Decision --CREATES--> Action
Decision --MITIGATES--> Risk
Decision --UPDATES--> Memory
KPI --MEASURES--> Goal
Learning --LEARNED_FROM--> Decision
```

No source evidence is overwritten. A correction creates a new node or version and marks the former statement as superseded.

## Primary journey 1 — Create and manage a decision

```text
Leader expresses a decision question
→ Twin classifies impact, reversibility and domain
→ DecisionCase is created
→ Situation Awareness collects and validates ContextItems
→ Strategic Simulator constructs scenarios
→ Executive Board produces assessments, objections and conditions
→ Leader arbitrates in the Decision Room
→ Decision and rationale are recorded
→ Actions and commitments are created
→ Outcome KPIs and review triggers are monitored
→ Case is reactivated when context changes
→ Outcomes generate Facts, Learnings and Memory updates
```

Acceptance rules:
- The Twin asks one high-value contextual question at a time.
- Recommendations remain blocked while mandatory evidence is weak.
- The leader remains the final decision authority.
- Rejected scenarios and dissent are retained.
- Every recommendation can be traced to context and sources.

## Primary journey 2 — Import and learn from a meeting

```text
Meeting is imported or captured
→ transcript, participants and source metadata are stored
→ extraction proposes Facts, Hypotheses, Decisions, Risks, Actions and Commitments
→ a human validates or edits each proposal
→ validated objects are added to the Knowledge Graph
→ related DecisionCases, Projects, Goals and People are linked
→ affected context and memory are updated through new versions
→ future decisions retrieve this evidence with provenance
```

Acceptance rules:
- Extracted statements are provisional until validated.
- Facts, hypotheses and insights are never conflated.
- Actions require an owner; commitments require an owner and deadline.
- Duplicate entities are resolved before graph insertion.
- Imported content respects organization-level permissions.

## Iterative enrichment loop

The product evolves through a closed loop:

```text
Experience
→ Extraction
→ Human validation
→ Knowledge Graph
→ Context enrichment
→ Decision
→ Execution
→ Outcome
→ Learning
→ Versioned organizational memory
→ Better future context
```

This loop is the fundamental compounding mechanism of Executive Twin.

## Governance invariants

1. Every entity belongs to one Organization.
2. Every authoritative statement preserves provenance.
3. Facts require evidence; hypotheses require falsifiability.
4. Decisions require an accountable owner and explicit rationale.
5. Critical risks require an owner and mitigation.
6. Validated objects are immutable; changes produce versions.
7. Historical graph states must remain reconstructable.
8. Access rights propagate from Organization, Team and source sensitivity.
9. AI-generated objects remain proposals until validation unless a policy explicitly authorizes automation.
10. Confidence is never a substitute for missing evidence.
