# ExecutiveOS v1 — Product Foundation

A real Next.js/TypeScript product foundation for the Decision Operating System.

## Included

- Next.js App Router
- TypeScript
- Tailwind CSS 4
- Zustand persisted workspace
- Executive Room
- Cognitive Scheduler
- Reasoning Graph with React Flow
- Decision Ledger
- Cognitive Bus
- Supabase client preparation
- PostgreSQL/RLS schema

## Start locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

The app works without Supabase configuration using local persisted state.

## Cloud setup

1. Create a Supabase project.
2. Run `supabase/schema.sql`.
3. Fill `.env.local`.
4. Add authentication and repository synchronization in the next iteration.
