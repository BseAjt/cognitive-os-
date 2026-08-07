import { runRuntimePipeline, type RuntimePipelineResult, type RuntimeStage, type UnifiedRuntimeInput } from "./runtime-pipeline.ts";
import { scheduleKernelCycle, type KernelLane, type KernelPriority, type KernelScheduleDecision } from "./kernel-scheduler.ts";

export type KernelStatus = "running" | "completed" | "blocked" | "failed";
export type KernelEventType = "KernelCycleStarted" | "KernelCycleScheduled" | "KernelStageTransitioned" | "KernelCycleBlocked" | "KernelCycleCompleted" | "KernelCycleFailed";

export interface KernelEvent {
  id: string;
  transactionId: string;
  caseId: string;
  type: KernelEventType;
  stage?: RuntimeStage;
  status: KernelStatus | "skipped";
  detail: string;
  createdAt: string;
}

export interface KernelTransaction {
  id: string;
  caseId: string;
  status: KernelStatus;
  startedAt: string;
  completedAt: string;
  completedStages: RuntimeStage[];
  blockedStages: RuntimeStage[];
  skippedStages: RuntimeStage[];
  eventCount: number;
  priority?: KernelPriority;
  lane?: KernelLane;
  scheduleScore?: number;
}

export interface ExecutiveKernelExecution {
  transaction: KernelTransaction;
  events: KernelEvent[];
  result: RuntimePipelineResult;
}

export interface ExecutiveKernelDependencies {
  runtime?: (input: UnifiedRuntimeInput) => RuntimePipelineResult;
  scheduler?: (input: UnifiedRuntimeInput) => KernelScheduleDecision;
  now?: () => string;
  idFactory?: () => string;
}

export interface ExecutiveKernel {
  execute: (input: UnifiedRuntimeInput) => ExecutiveKernelExecution;
}

export function createExecutiveKernel(dependencies: ExecutiveKernelDependencies = {}): ExecutiveKernel {
  const runtime = dependencies.runtime ?? runRuntimePipeline;
  const scheduler = dependencies.scheduler ?? scheduleKernelCycle;
  const now = dependencies.now ?? (() => new Date().toISOString());
  const idFactory = dependencies.idFactory ?? (() => crypto.randomUUID());

  return {
    execute(input) {
      const transactionId = idFactory();
      const startedAt = now();
      const schedule = scheduler(input);
      const events: KernelEvent[] = [{
        id: idFactory(),
        transactionId,
        caseId: input.cognitiveCase.id,
        type: "KernelCycleStarted",
        status: "running",
        detail: `Cycle cognitif démarré pour ${input.cognitiveCase.title}.`,
        createdAt: startedAt
      }, {
        id: idFactory(),
        transactionId,
        caseId: input.cognitiveCase.id,
        type: "KernelCycleScheduled",
        status: "running",
        detail: `Priorité ${schedule.priority} · lane ${schedule.lane} · score ${schedule.score}/100 · ${schedule.reasons.join(" · ")}.`,
        createdAt: now()
      }];

      try {
        const result = runtime(input);
        for (const trace of result.trace) {
          events.push({
            id: idFactory(),
            transactionId,
            caseId: input.cognitiveCase.id,
            type: "KernelStageTransitioned",
            stage: trace.stage,
            status: trace.status === "blocked" ? "blocked" : trace.status,
            detail: trace.detail,
            createdAt: now()
          });
        }

        const blockedStages = result.trace.filter((item) => item.status === "blocked").map((item) => item.stage);
        if (blockedStages.length) {
          events.push({
            id: idFactory(),
            transactionId,
            caseId: input.cognitiveCase.id,
            type: "KernelCycleBlocked",
            status: "blocked",
            detail: `Cycle partiellement bloqué sur ${blockedStages.join(", ")}.`,
            createdAt: now()
          });
        }

        const completedAt = now();
        const status: KernelStatus = blockedStages.length ? "blocked" : "completed";
        events.push({
          id: idFactory(),
          transactionId,
          caseId: input.cognitiveCase.id,
          type: "KernelCycleCompleted",
          status,
          detail: `${result.trace.filter((item) => item.status === "completed").length} étape(s) complétée(s) · prochaine action : ${result.nextAction}`,
          createdAt: completedAt
        });

        return {
          transaction: {
            id: transactionId,
            caseId: input.cognitiveCase.id,
            status,
            startedAt,
            completedAt,
            completedStages: result.trace.filter((item) => item.status === "completed").map((item) => item.stage),
            blockedStages,
            skippedStages: result.trace.filter((item) => item.status === "skipped").map((item) => item.stage),
            eventCount: events.length,
            priority: schedule.priority,
            lane: schedule.lane,
            scheduleScore: schedule.score
          },
          events,
          result
        };
      } catch (error) {
        const completedAt = now();
        events.push({
          id: idFactory(),
          transactionId,
          caseId: input.cognitiveCase.id,
          type: "KernelCycleFailed",
          status: "failed",
          detail: error instanceof Error ? error.message : "Erreur inconnue du Kernel.",
          createdAt: completedAt
        });
        throw Object.assign(error instanceof Error ? error : new Error("Executive Kernel failure"), { kernelEvents: events, transactionId });
      }
    }
  };
}

export const executiveKernel = createExecutiveKernel();

export function executeExecutiveKernel(input: UnifiedRuntimeInput): ExecutiveKernelExecution {
  return executiveKernel.execute(input);
}
