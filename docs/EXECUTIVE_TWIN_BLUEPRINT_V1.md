# Executive Twin Blueprint v1

Status: Foundational product and architecture reference  
Version: 1.0  
Date: 2026-08-06  
Product: Executive Twin  
Platform kernel: ExecutiveOS  
Intelligence runtime: Executive Intelligence Layer

## 1. Product vision

Executive Twin is an executive intelligence platform that helps leaders understand their organization, make contextual decisions, preserve the reasoning behind those decisions, and continuously learn from outcomes.

The product is not positioned as a chatbot or a collection of AI tools. The user experiences one living Twin. Internal engines remain implementation capabilities activated by the Twin.

### Core promise

> The executive twin that learns with your organization.

### Release 1 promise

A leader can open a decision case, establish a reliable context, compare scenarios, consult a multidisciplinary executive board, record a conditional and auditable decision, and know when that decision must be reviewed.

## 2. Product principles

1. Context before recommendation.
2. Evidence before confidence.
3. Scenarios before binary answers.
4. Human accountability remains explicit.
5. Dissent is preserved, not averaged away.
6. Every decision is revisable.
7. Reasoning is a first-class organizational asset.
8. The graph is the shared semantic backbone.
9. Facts, assumptions, preferences, constraints and uncertainties must never be conflated.
10. Engines are invisible to the leader; outcomes and explanations are visible.

## 3. Primary personas

### Chief executive
Needs a concise daily view, decision support, organizational memory and clear accountability.

### Executive committee member
Needs domain-specific assessment, shared context, objections, conditions and follow-up.

### Chief of staff
Needs decision preparation, evidence collection, coordination, auditability and review scheduling.

### Strategy or transformation leader
Needs scenario analysis, dependencies, assumptions, outcomes and organizational learning.

## 4. Release 1 functional scope

### Visible product spaces

- Executive Twin Home
- Decision Room
- Organizational Memory v1
- Enterprise Graph v1
- Decision record and review loop

### Internal capabilities

- Situation Awareness / Context Engine
- Strategic Simulator / Scenario Builder
- Executive Board / Executive Council
- Decision Intelligence / Decision Cockpit
- Organizational Memory foundation
- Enterprise Knowledge Graph foundation

### Out of scope for Release 1

- autonomous execution of irreversible decisions;
- unrestricted external system writes;
- full predictive modeling;
- real-time enterprise digital twin;
- replacement of legal, financial or HR professionals;
- fully automated ingestion from all enterprise systems.

## 5. Canonical domain model

The domain model is divided into nine bounded contexts. Each object has an immutable identifier, organization ownership, timestamps, provenance and lifecycle status.

### 5.1 Organization

#### Organization
The tenant and enterprise boundary.

Key fields: id, name, industry, jurisdictions, strategy, lifecycleStatus.

#### OrganizationalUnit
A business unit, function, legal entity, geography or team.

Relations: PART_OF Organization or OrganizationalUnit; OWNS Goal, KPI, Risk, Project.

#### Person
A human stakeholder.

Key fields: role, organizationalUnitId, decisionRights, expertise, activeStatus.

#### Role
A reusable responsibility and authority definition.

### 5.2 Strategy

#### Goal
A strategic or operational objective.

Key fields: title, targetDate, ownerId, status, priority, successDefinition.

#### KPI
A measurable indicator connected to a goal, process, project or decision.

Key fields: metric, currentValue, targetValue, unit, frequency, source, freshness.

#### Initiative
A coordinated strategic effort.

#### Project
A time-bounded execution structure with milestones, owners and dependencies.

### 5.3 Decision intelligence

#### DecisionCase
The complete working dossier for a decision.

Required fields:
- id
- organizationId
- title
- question
- ownerId
- decisionType
- impactLevel
- reversibility
- deadline
- status
- contextReadiness
- governance
- selectedScenarioId
- rationale
- reviewDate

Lifecycle:
`draft -> context_building -> scenario_analysis -> council_review -> ready_for_decision -> decided -> executing -> under_review -> closed`

A case may move backward when context changes.

#### ContextItem
A single contextual claim or requirement.

Types:
- fact
- hypothesis
- constraint
- preference
- uncertainty

Domains:
- strategy
- finance
- people
- operations
- market
- legal
- history
- governance

Required metadata:
- value
- source
- owner
- confidence
- validationStatus
- capturedAt
- validUntil
- requirementLevel

Validation statuses:
`missing | draft | verified | contested | stale | rejected`

#### Scenario
A coherent possible course of action.

Key fields: description, horizon, reversibility, dependencies, assumptions, impacts, exitConditions, score, scoreConfidence.

A scenario score is nullable. It must remain null if critical evidence is absent, stale or contested.

#### ScenarioImpact
A directional impact in finance, people, operations, legal, strategy, market or time.

#### AgentAssessment
A domain-specific executive assessment.

Key fields: agent, mandate, position, confidence, findings, requiredInputs, conditions, preferredScenarioId.

Positions:
`support | oppose | conditional | insufficient_context`

#### Decision
The accountable human commitment made from a DecisionCase.

Key fields: selectedScenarioId, rationale, conditions, dissentingViews, ownerId, decidedAt, reviewTriggers, outcomeMetrics.

#### ReviewTrigger
A condition that requires reassessment.

#### Outcome
Observed results linked to a decision, scenario, action or project.

### 5.4 Risk and opportunity

#### Risk
An uncertain event with probability, impact, owner, mitigation and trigger.

#### Opportunity
A favorable possibility with value, probability, dependencies and next action.

#### Issue
A current problem requiring resolution.

### 5.5 Execution

#### Action
A concrete task created by a decision, meeting, risk or recommendation.

#### Commitment
A promise with owner, beneficiary, due date and status.

#### Milestone
A significant execution checkpoint.

### 5.6 Organizational memory

#### Experience
A source event such as a meeting, conversation, email, document, incident or observation.

#### MemoryItem
A validated memory object derived from one or more experiences.

Subtypes:
- fact
- hypothesis
- insight
- learning
- decision rationale
- question
- pattern

#### Evidence
A source fragment supporting or contradicting a claim.

#### Learning
A generalized lesson derived from outcomes.

#### Insight
A contextual interpretation that may influence decisions.

#### Version
An immutable snapshot of a mutable domain object.

### 5.7 Collaboration

#### Meeting
A scheduled or completed executive interaction.

#### Conversation
A sequence of messages linked to a case, project or topic.

#### Document
A source artifact with ownership, classification and extracted evidence.

#### Message
An individual communication unit.

### 5.8 Enterprise structure

#### Customer
#### Supplier
#### Partner
#### Competitor
#### Product
#### Service
#### Process
#### Application
#### Contract
#### Market

These objects provide the organizational reality required for future decisions.

### 5.9 Twin model

#### TwinProfile
Represents what the Twin knows about an executive and organization.

Key fields: knowledgeCoverage, decisionStyle, riskPreference, blindSpots, confidenceByDomain, lastLearningAt.

#### DecisionPattern
A recurring relationship between context, choices and outcomes.

#### BiasObservation
A possible cognitive or organizational bias. It is an observation, not a diagnosis.

## 6. Domain invariants

1. Every object belongs to exactly one Organization.
2. A Decision cannot exist without a DecisionCase.
3. A final Decision requires an explicit human owner.
4. A ContextItem without provenance cannot be `verified`.
5. A contested or stale required ContextItem blocks recommendation.
6. Scenario scores are forbidden when critical context is incomplete.
7. Dissenting assessments remain attached to the Decision record.
8. Review triggers are mandatory for high-impact or low-reversibility decisions.
9. Outcome metrics are mandatory before a case is marked `decided`.
10. Memory extraction requires validation before becoming authoritative organizational knowledge.
11. Every material mutation creates a Version or audit event.
12. Deletion of decision evidence is logical and auditable, never silent.

## 7. Enterprise Knowledge Graph

### 7.1 Purpose

The graph is the semantic backbone connecting organizational structure, strategy, evidence, decisions, execution and learning. PostgreSQL remains the transactional source of truth in Release 1. Graph projections may initially be generated from relational records.

### 7.2 Node families

- Organization: Organization, OrganizationalUnit, Person, Role
- Strategy: Goal, KPI, Initiative, Project
- Decision: DecisionCase, ContextItem, Scenario, AgentAssessment, Decision, ReviewTrigger, Outcome
- Intelligence: Risk, Opportunity, Issue, Insight, Learning, Hypothesis, Fact
- Execution: Action, Commitment, Milestone
- Experience: Meeting, Conversation, Document, Message, Experience, Evidence
- Enterprise: Customer, Supplier, Partner, Competitor, Product, Service, Process, Application, Contract, Market
- Twin: TwinProfile, DecisionPattern, BiasObservation

### 7.3 Canonical edge vocabulary

Structural:
- PART_OF
- MEMBER_OF
- REPORTS_TO
- OWNS
- SPONSORS

Strategic:
- SUPPORTS
- MEASURES
- ADVANCES
- CONFLICTS_WITH
- DEPENDS_ON

Decision:
- CONCERNS
- USES_CONTEXT
- CONSIDERS
- ASSESSED_BY
- SELECTS
- REJECTS
- RESULTS_IN
- REQUIRES_REVIEW_WHEN

Evidence and memory:
- DERIVED_FROM
- SUPPORTED_BY
- CONTRADICTED_BY
- SUPERSEDES
- VALIDATES
- INVALIDATES
- LEARNED_FROM

Execution:
- CREATES
- ASSIGNED_TO
- BLOCKS
- MITIGATES
- MONITORS
- ACHIEVES

Enterprise:
- SERVES
- SUPPLIES
- COMPETES_WITH
- GOVERNED_BY
- IMPLEMENTED_BY
- AFFECTS

### 7.4 Edge requirements

Every graph edge includes:
- id
- organizationId
- sourceId and sourceType
- targetId and targetType
- relationType
- confidence
- provenance
- validFrom
- validTo
- createdAt

A relationship may be contested or time-bounded. The graph must support reconstruction at a historical timestamp.

### 7.5 Core decision subgraph

`Person --OWNS--> DecisionCase`

`DecisionCase --USES_CONTEXT--> ContextItem`

`ContextItem --SUPPORTED_BY--> Evidence`

`DecisionCase --CONSIDERS--> Scenario`

`Scenario --DEPENDS_ON--> ContextItem`

`Scenario --ASSESSED_BY--> AgentAssessment`

`DecisionCase --SELECTS--> Scenario`

`DecisionCase --RESULTS_IN--> Decision`

`Decision --CREATES--> Action`

`Decision --REQUIRES_REVIEW_WHEN--> ReviewTrigger`

`Decision --RESULTS_IN--> Outcome`

`Learning --LEARNED_FROM--> Outcome`

### 7.6 Temporal graph and Time Machine readiness

All mutable nodes use versioned snapshots. All important edges have validity intervals. A historical view resolves the latest valid version and active relations at a selected time. Release 1 stores the metadata even if the full Time Machine UI is delivered later.

## 8. Functional architecture

### Executive Twin Home
Answers: What requires attention today?

Inputs: open decisions, stale assumptions, critical risks, overdue commitments, changed KPIs, recent learnings.

### Decision Room
One guided flow:
1. express the decision;
2. classify impact and governance;
3. collect critical context;
4. construct scenarios;
5. convene the Executive Board;
6. arbitrate in the Decision Cockpit;
7. record decision, actions and review triggers.

### Organizational Memory v1
Captures validated experiences, facts, hypotheses, decisions, insights and learnings. Search returns evidence and reasoning, not only document titles.

### Enterprise Graph v1
Provides an explorable projection centered on the active decision or topic.

## 9. Technical architecture

### Release 1 stack

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS
- Zustand for local client state during the alpha
- PostgreSQL for transactional persistence
- pgvector for semantic retrieval
- Supabase SSR for authentication and managed PostgreSQL integration
- Vercel for web deployment
- GitHub for source, reviews and CI

### Architectural boundaries

- UI components cannot implement domain rules.
- Domain services are deterministic and independently testable.
- AI outputs are proposals validated against schemas and governance rules.
- Retrieval returns evidence references.
- Organization isolation is enforced in persistence and queries.

### Planned packages

- `domain`: canonical entities, invariants and lifecycle rules
- `intelligence`: context, scenarios, council, decision cockpit
- `memory`: experiences, extraction, evidence, versions and retrieval
- `graph`: node/edge model and projections
- `integrations`: external connectors
- `ui`: product components and design tokens

## 10. Security and governance

- tenant isolation;
- role-based access control;
- encryption in transit and at rest;
- auditable AI and human actions;
- source-level permissions inherited by derived memory;
- explicit retention and deletion policies;
- sensitive decision classification;
- no model training on tenant data without explicit agreement;
- legal, HR and regulated decisions display professional-validation requirements.

## 11. Release 1 UX principles

- One Twin, not a menu of engines.
- Progressive disclosure.
- One adaptive question at a time for complex cases.
- Confidence always connected to evidence.
- Blocked states explain exactly why.
- High-impact decisions use calm, non-gamified presentation.
- The leader can override recommendations but must provide rationale.

## 12. Release 1 backlog

### Foundation
- canonical domain types and graph vocabulary;
- seeded organization and decision graph;
- application shell and navigation;
- authentication boundary;
- persistence interface;
- audit events.

### Executive Twin Home
- morning briefing;
- attention items;
- open decision cases;
- critical risks;
- learning feed;
- Twin knowledge coverage.

### Decision Room
- natural-language intake;
- decision classification;
- context readiness;
- scenario portfolio;
- Executive Board;
- Decision Cockpit;
- actions and review triggers.

### Organizational Memory v1
- experience capture;
- structured extraction;
- user validation;
- memory timeline;
- evidence-backed search.

### Enterprise Graph v1
- graph projection;
- active-case exploration;
- node details;
- relationship provenance.

## 13. Acceptance criteria for the first executable

1. The app launches as Executive Twin, not a technical engine dashboard.
2. Home shows a populated executive briefing.
3. The seeded organization, goals, KPIs, risks, decision cases, context and memory are represented by canonical domain types.
4. The graph uses a controlled edge vocabulary.
5. A user can enter the Decision Room and use the existing context, scenario, council and cockpit flow.
6. High-impact decisions remain blocked when required evidence is missing.
7. Runtime domain tests pass.
8. The branch is reviewed and merged through GitHub.
9. Vercel reports a successful deployment for the merged commit.

## 14. Seed organization for Release 1

Organization: Novaris Systems  
Industry: B2B software and digital services  
Executive: Sébastien, CEO  
Strategic goal: restore sustainable profitability while protecting critical capabilities  
Open decision: determine the appropriate workforce and cost transformation path  
Known signals: revenue decline, seven months cash runway, critical skills risk, incomplete alternatives, contested operational impact  
Memory: prior hiring freeze, deferred investments and lessons from a previous reorganization

This seed is demonstrative and must never be presented as real company data.

## 15. Definition of done

The Blueprint is considered implemented only when the domain types, graph vocabulary, seeded data, home experience, Decision Room flow, tests, GitHub history and Vercel deployment remain consistent with this document.