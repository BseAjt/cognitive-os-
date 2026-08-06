# ExecutiveOS — Phase 2

Deuxième vertical slice exécutable d’ExecutiveOS.

## Modules

- Executive Command Center
- Task Engine avec machine d’états
- affectation automatique selon les capacités des agents
- contrats d’agents validables et versionnés
- Cognitive Graph objectifs/décisions/mémoires/tâches/agents
- API REST
- stockage JSON local immédiat
- schéma PostgreSQL et adaptateur optionnel
- tests automatisés

## Lancer

```bash
npm start
```

Ouvrir `http://localhost:8080`.

## Tester

```bash
npm test
npm run check
```

## PostgreSQL

Le mode local ne demande aucune dépendance. Pour préparer PostgreSQL :

```bash
npm install
psql "$DATABASE_URL" -f database/schema.sql
```

Le fichier `src/postgres-store.js` fournit l’adaptateur PostgreSQL. Son activation complète par configuration est prévue dans le prochain incrément afin de conserver un démarrage zéro dépendance dans cette phase.

## API ajoutée

- `GET /api/graph`
- `POST /api/tasks`
- `POST /api/tasks/:id/assign`
- `POST /api/tasks/:id/run`
- `POST /api/tasks/:id/transition`
- `POST /api/agents`
- `POST /api/agents/validate`
