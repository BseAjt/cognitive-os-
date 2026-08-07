# Architecture Phase 2

## Vertical slice

Le navigateur consomme une API HTTP Node.js sans framework. Le noyau métier reste indépendant du transport :

- `agent-contracts.js` formalise l’identité, les capacités, le statut et la version d’un agent ;
- `task-engine.js` porte la machine d’états et l’affectation par capacité ;
- `graph-engine.js` projette l’état métier en nœuds et relations ;
- `store.js` assure une persistance locale atomique à l’échelle du fichier ;
- `postgres-store.js` prépare la persistance PostgreSQL avec JSONB ;
- `server.js` expose les cas d’usage par API.

## États d’une tâche

`backlog → ready → running → completed`

Branches alternatives : `blocked`, `cancelled`.

## Limites assumées

Cette phase n’implémente pas encore la concurrence distribuée, les files de messages, l’authentification ni l’exécution LLM distante. Elle fournit les contrats et invariants nécessaires avant ces ajouts.
