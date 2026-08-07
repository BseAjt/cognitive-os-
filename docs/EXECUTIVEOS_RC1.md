# ExecutiveOS RC1

## Release intent

RC1 establishes a single production source of truth for ExecutiveOS and removes ambiguity created by the incremental prototypes used during early development.

## Canonical product

`executiveos-app` is the only active product runtime.

```text
executiveos-app/
├── app/            Next.js entry points
├── components/     product UX
├── lib/            cognitive and executive engines
├── store/          persisted workspace state
├── types/          canonical domain contracts
├── supabase/       production persistence foundation
└── tests/          regression and E2E coverage
```

## Canonical runtime contracts

The active runtime uses one shared domain model for:

- Challenges
- Decisions
- Actions / Tasks
- Agent Contracts
- Cognitive Events
- Reasoning Revisions

Task execution, capability-based assignment and cognitive graph projection are implemented in `lib/executive-runtime.ts` and consume the same state as the user interface.

## Product engines

The current production product includes the Context Engine, Scenario Builder, Executive Council, Decision Cockpit, Conversation Runtime, Reasoning Flow, Decision Timeline, Impact Analysis, ORION Decision Copilot and Executive Runtime.

## Historical Phase 2

The standalone `modules/executiveos-phase2` source tree has been physically removed from the repository after its useful capabilities were ported into `executiveos-app`.

The retained historical record is documentation-only under `docs/PHASE2_MIGRATION.md`; it captures the original invariants and their canonical RC1 replacements.

## Continuous validation

There is one canonical GitHub Actions workflow: `.github/workflows/runtime-tests.yml`.

Every relevant pull request and every push to `main` must run:

1. deterministic dependency installation with `npm ci`;
2. runtime regression tests;
3. TypeScript application validation;
4. production Next.js build;
5. Playwright test typecheck;
6. browser end-to-end tests.

The application also exposes `npm run validate` to execute the complete validation chain locally.

### Dependency reproducibility

`executiveos-app/package-lock.json` is committed with lockfile version 3. Dependencies that were previously declared as `latest` are pinned to explicit stable versions in `package.json`, and CI uses `npm ci` against the committed lockfile.

## Branch and PR policy

- `main` is the production source of truth.
- Superseded implementation PRs should be closed rather than kept indefinitely.
- New features should be developed against the canonical runtime and should not introduce parallel models or standalone product stacks.
- Vercel production must deploy from `main` only.

## RC1 definition of done

RC1 is considered healthy when:

- the GitHub validation workflow succeeds;
- the Vercel production deployment is `READY`;
- no runtime errors are reported by Vercel;
- no competing production runtime exists in the repository;
- all newly introduced runtime behavior has regression coverage.
