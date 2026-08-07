# Step 2.2 — Memory + Knowledge persistence

The Unified Executive Runtime now persists memory and knowledge outputs as canonical records scoped by `caseId`.

- `MemoryRecord` stores cognitive kind, content, confidence, durability, provenance and timestamp.
- `KnowledgeRecord` stores graph-facing type, title, confidence, provenance and timestamp.
- `applyRuntimeCycle()` writes memories and knowledge atomically with case, conversation, reasoning, decision, action and events.
- Zustand persistence schema is version 8 and migrates previous states by initializing the new collections safely.
- Runtime and persistence contract tests are included in the Vercel build gate.
