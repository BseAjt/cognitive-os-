# MemoryOS — Itération 10 Cloud

Cette version ajoute un backend Supabase/PostgreSQL réel tout en conservant un fallback local.

## Fonctionnement

- Sans variables Supabase : mode local automatique.
- Avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` : authentification par lien email et synchronisation cloud.
- `VITE_MEMORYOS_MODE=local` force le stockage local.
- `VITE_MEMORYOS_MODE=cloud` exige une configuration Supabase valide.

## Installation

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Activation du cloud

1. Créer un projet Supabase.
2. Exécuter `supabase/schema.sql` dans le SQL Editor.
3. Renseigner `.env.local`.
4. Dans Authentication > URL Configuration, ajouter `http://localhost:8080`.
5. Relancer l’application.

## Sécurité

Toutes les tables exposées utilisent Row Level Security. Chaque ligne est isolée par `auth.uid()`.

## Architecture

- `src/lib/supabase.js` : client Supabase.
- `src/services/memoryRepository.js` : abstraction local/cloud.
- `supabase/schema.sql` : modèle PostgreSQL, RLS et pgvector.
