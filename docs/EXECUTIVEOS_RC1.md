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

## Historical modules

`modules/executiveos-phase2` is retained as an archived implementation reference only. It is not deployed, is not a source of truth and must not receive new product functionality.

## Continuous validation

There is one canonical GitHub Actions workflow: `.github/workflows/runtime-tests.yml`.

Every relevant pull request and every push to `main` must run:

1. dependency installation;
2. runtime regression tests;
3. TypeScript application validation;
4. production Next.js build;
5. Playwright test typecheck;
6. browser end-to-end tests.

The application also exposes `npm run validate` to execute the complete validation chain locally.

### Dependency reproducibility

RC1 currently uses `npm install --no-audit --no-fund` because no `package-lock.json` exists in the repository yet. Generating and committing a lockfile from an environment with access to the public npm registry is the next hardening step; once committed, the CI install step should be switched to `npm ci`.

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
