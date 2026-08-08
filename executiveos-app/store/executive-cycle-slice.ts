import type { StateCreator } from "zustand";
import type { ExecutiveCycleSlice, ExecutiveState } from "./types.ts";

export const createExecutiveCycleSlice: StateCreator<ExecutiveState, [], [], ExecutiveCycleSlice> = (set) => ({
  executiveCycles: [],
  prependExecutiveCycle: (record) => set((state) => ({
    executiveCycles: [record, ...state.executiveCycles],
    events: [{ id: crypto.randomUUID(), type: "ExecutiveCycleCompleted", detail: `${record.status} · ${record.contributions.length} perspective(s) · confiance ${record.confidence}%`, createdAt: record.createdAt }, ...state.events]
  }))
});
