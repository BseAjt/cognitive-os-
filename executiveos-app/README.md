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

## Cloud setup

1. Create a Supabase project.
2. Run `supabase/schema.sql`.
3. Fill `.env.local`.
4. Add authentication and repository synchronization in the next iteration.
