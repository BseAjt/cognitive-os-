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

## Bloc 7.1 — Context Ingestion

Chaque dossier cognitif peut ingérer des notes, des contenus web copiés et des fichiers textuels (`TXT`, `Markdown`, `CSV`, `JSON`, `HTML`). Le runtime conserve la source brute, sa provenance, les preuves extraites et une synthèse citée au niveau du `CognitiveCase`. Les sources sont persistées dans le store versionné et restent isolées par dossier.

## Bloc 7.3 — ORION Executive Cycle

Un dossier peut convoquer un cycle exécutif persistant autour d'un mandat précis. ATHENA, TURING et SENECA produisent des contributions sourcées, ORION conserve les divergences et bloque toute recommandation lorsque les preuves du dossier sont insuffisantes.

## Cloud setup

1. Create a Supabase project.
2. Run `supabase/schema.sql`.
3. Fill `.env.local`.
4. Add authentication and repository synchronization in the next iteration.
