# MemoryOS — Itération 9

Migration du prototype monofichier vers une application React/Vite structurée.

## Lancer

```bash
npm install
npm run dev
```

Puis ouvrir `http://localhost:8080`.

## Construire

```bash
npm run build
```

## Fonctionnalités

- gestion de Journeys ;
- Command Center ;
- Memory Engine ;
- Knowledge Graph ;
- Reasoning Timeline ;
- Decision Engine ;
- Reflection Engine ;
- AI Mentor local ;
- persistance dans `localStorage` ;
- export JSON.

## Note de validation

Le code source a été produit et contrôlé structurellement. Le build n’a pas pu être exécuté dans l’environnement de génération, car son registre npm interne ne contient pas `@vitejs/plugin-react`. Sur un environnement npm standard, exécuter `npm install` puis `npm run build`.
