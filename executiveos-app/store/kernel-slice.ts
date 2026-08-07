import type { StateCreator } from "zustand";
import type { KernelEvent, KernelTransaction } from "../lib/executive-kernel.ts";
import type { ExecutiveState, KernelSlice } from "./types.ts";

export const createKernelSlice: StateCreator<ExecutiveState, [], [], KernelSlice> = (set) => ({
  kernelTransactions: [],
  kernelEvents: [],
  recordKernelExecution: (transaction: KernelTransaction, events: KernelEvent[]) =>
    set((state) => ({
      kernelTransactions: [transaction, ...state.kernelTransactions.filter((item) => item.id !== transaction.id)],
      kernelEvents: [...events, ...state.kernelEvents.filter((item) => item.transactionId !== transaction.id)]
    }))
});
