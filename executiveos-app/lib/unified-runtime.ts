import { executeExecutiveKernel, type KernelEvent, type KernelTransaction } from "./executive-kernel.ts";
import type { RuntimePipelineResult, UnifiedRuntimeInput } from "./runtime-pipeline.ts";

export type {
  ActionProposal,
  DecisionProposal,
  KnowledgeCandidate,
  MemoryCandidate,
  ReasoningProposal,
  ReasoningStepId,
  RuntimeStage,
  RuntimeStageTrace,
  UnifiedRuntimeInput
} from "./runtime-pipeline.ts";

export type UnifiedRuntimeResult = RuntimePipelineResult & {
  kernel: KernelTransaction;
  kernelEvents: KernelEvent[];
};

/**
 * Compatibility facade. All ExecutiveOS callers now execute through the
 * Executive Kernel while keeping the historical Unified Runtime contract.
 */
export function runUnifiedRuntime(input: UnifiedRuntimeInput): UnifiedRuntimeResult {
  const execution = executeExecutiveKernel(input);
  return {
    ...execution.result,
    kernel: execution.transaction,
    kernelEvents: execution.events
  };
}
