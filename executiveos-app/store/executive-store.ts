"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createActionSlice, createChallengeSlice, createConversationSlice, createDecisionSlice, createEventSlice } from "@/store/slices";
import { createExecutiveCommands } from "@/store/commands";
import type { ExecutiveState } from "@/store/types";

export type { ConversationMessage, ExecutiveState } from "@/store/types";

export const useExecutiveStore = create<ExecutiveState>()(
  persist(
    (...args) => ({
      ...createChallengeSlice(...args),
      ...createConversationSlice(...args),
      ...createDecisionSlice(...args),
      ...createActionSlice(...args),
      ...createEventSlice(...args),
      ...createExecutiveCommands(...args)
    }),
    {
      name: "executiveos-v2",
      version: 3
    }
  )
);
