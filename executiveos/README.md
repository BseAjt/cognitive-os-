# ExecutiveOS — Modules 1–10

This directory contains the cumulative executable ExecutiveOS runtime produced module by module.

## Cognitive stack

1. Executive Runtime / ORION
2. Memory Engine
3. Decision Engine
4. Reflection Engine
5. Knowledge Engine / Knowledge Graph
6. Reasoning Engine / Reasoning Timeline
7. Cognitive Twin
8. Executive Planning / Action Engine
9. Goals / Objectives Engine
10. Executive Dashboard / Command Center

The code under `runtime/` is the current integrated implementation. Earlier module boundaries are preserved conceptually in the architecture and tests; Module 10 is cumulative and contains the engines delivered before it.

## Run

```bash
cd executiveos/runtime
python -m pip install -r requirements.txt
python run.py
```

Then open `http://127.0.0.1:8080`.

## Command Center

`http://127.0.0.1:8080/ui/command-center.html`

## Validation

Run the smoke tests in `runtime/tests/`.

## Integration note

This code is being introduced on a dedicated branch so it can be reconciled safely with the existing Executive Twin / Cognitive OS architecture already present in this repository.