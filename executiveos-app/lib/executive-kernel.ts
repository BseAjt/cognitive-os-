import { runRuntimePipeline, type RuntimePipelineResult, type RuntimeStage, type UnifiedRuntimeInput } from "./runtime-pipeline.ts";
import { scheduleKernelCycle, type KernelLane, type KernelPriority, type KernelScheduleDecision } from "./kernel-scheduler.ts";
import { evaluateKernelPolicy, type KernelPolicyDecision, type KernelPolicyResult, type KernelPolicyRisk } from "./kernel-policy.ts";

export type KernelStatus = "running" | "completed" | "blocked" | "failed";
export type KernelEventType = "KernelCycleStarted" | "KernelCycleScheduled" | "KernelPolicyEvaluated" | "KernelStageTransitioned" | "KernelCycleBlocked" | "KernelCycleCompleted" | "KernelCycleFailed";

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
  policyDecision?: KernelPolicyDecision;
  policyRisk?: KernelPolicyRisk;
  policyRules?: string[];
}

export interface ExecutiveKernelExecution {
  transaction: KernelTransaction;
  events: KernelEvent[];
  result: RuntimePipelineResult;
}

export interface ExecutiveKernelDependencies {
  runtime?: (input: UnifiedRuntimeInput) => RuntimePipelineResult;
  scheduler?: (input: UnifiedRuntimeInput) => KernelScheduleDecision;
  policy?: (input: UnifiedRuntimeInput) => KernelPolicyResult;
  now?: () => string;
  idFactory?: () => string;
}

export interface ExecutiveKernel {
  execute: (input: UnifiedRuntimeInput) => ExecutiveKernelExecution;
}

export function createExecutiveKernel(dependencies: ExecutiveKernelDependencies = {}): ExecutiveKernel {
  const runtime = dependencies.runtime ?? runRuntimePipeline;
  const scheduler = dependencies.scheduler ?? scheduleKernelCycle;
  const policy = dependencies.policy ?? evaluateKernelPolicy;
  const now = dependencies.now ?? (() => new Date().toISOString());
  const idFactory = dependencies.idFactory ?? (() => crypto.randomUUID());

  return {
    execute(input) {
      const transactionId = idFactory();
      const startedAt = now();
      const schedule = scheduler(input);
      const policyResult = policy(input);
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
      }, {
        id: idFactory(),
        transactionId,
        caseId: input.cognitiveCase.id,
        type: "KernelPolicyEvaluated",
        status: policyResult.decision === "allow" ? "running" : "blocked",
        detail: `Policy ${policyResult.decision} · risque ${policyResult.risk} · ${policyResult.rationale}${policyResult.rules.length ? ` · règles: ${policyResult.rules.join(", ")}` : ""}`,
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

        const runtimeBlockedStages = result.trace.filter((item) => item.status === "blocked").map((item) => item.stage);
        const policyBlocked = policyResult.decision !== "allow";
        const blockedStages = runtimeBlockedStages;
        if (runtimeBlockedStages.length || policyBlocked) {
          events.push({
            id: idFactory(),
            transactionId,
            caseId: input.cognitiveCase.id,
            type: "KernelCycleBlocked",
            status: "blocked",
            detail: runtimeBlockedStages.length
              ? `Cycle partiellement bloqué sur ${runtimeBlockedStages.join(", ")}.`
              : `Cycle sous garde-fou Kernel: ${policyResult.rationale}`,
            createdAt: now()
          });
        }

        const completedAt = now();
        const status: KernelStatus = runtimeBlockedStages.length || policyBlocked ? "blocked" : "completed";
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
            scheduleScore: schedule.score,
            policyDecision: policyResult.decision,
            policyRisk: policyResult.risk,
            policyRules: policyResult.rules
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
