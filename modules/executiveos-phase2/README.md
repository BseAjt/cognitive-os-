# ExecutiveOS Phase 2 — archived reference

> **Status: archived specification.** This directory is no longer a production runtime and must not be deployed independently.

The original Phase 2 vertical slice proved the Task Engine, capability-based agent assignment, versioned agent contracts, cognitive graph projection, local JSON persistence and a lightweight REST server.

As of **ExecutiveOS RC1**, the product capabilities that remain canonical have been ported into `executiveos-app`:

- Task/action state machine → `executiveos-app/lib/executive-runtime.ts`
- capability-based assignment → `executiveos-app/lib/executive-runtime.ts`
- versioned agent contracts → `executiveos-app/types/domain.ts`
- live cognitive graph projection → `executiveos-app/lib/executive-runtime.ts`
- persisted client runtime → `executiveos-app/store/executive-store.ts`
- production database foundation → `executiveos-app/supabase/schema.sql`
- user surfaces → **Agir** and **Explorer** in the Next.js application

The standalone HTTP server, JSON store and generic PostgreSQL adapter in this folder are retained only as historical implementation notes. They are **not** sources of truth and should not receive new product features.

## Canonical runtime

```text
executiveos-app/
  app/          Next.js application
  components/   product surfaces
  lib/          cognitive and executive engines
  store/        persisted workspace state
  types/        canonical domain contracts
  supabase/     production persistence schema
  tests/        runtime and product regression coverage
```

All new ExecutiveOS development must target `executiveos-app` and pass the single RC1 validation workflow in `.github/workflows/runtime-tests.yml`.
