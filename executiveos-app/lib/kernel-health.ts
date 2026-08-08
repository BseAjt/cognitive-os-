import type { KernelEvent, KernelTransaction } from "./executive-kernel.ts";

export type KernelHealthStatus = "healthy" | "degraded" | "critical";

export interface KernelHealthReport {
  status: KernelHealthStatus;
  transactionCount: number;
  completedRate: number;
  blockedRate: number;
  failedRate: number;
  retryRate: number;
  criticalPriorityCount: number;
  guardedCount: number;
  integrityErrors: string[];
}

function percentage(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

export function assessKernelHealth(transactions: KernelTransaction[], events: KernelEvent[]): KernelHealthReport {
  const completed = transactions.filter((item) => item.status === "completed").length;
  const blocked = transactions.filter((item) => item.status === "blocked").length;
  const failed = transactions.filter((item) => item.status === "failed").length;
  const retried = transactions.filter((item) => (item.attemptCount ?? 1) > 1).length;
  const criticalPriorityCount = transactions.filter((item) => item.priority === "critical").length;
  const guardedCount = transactions.filter((item) => item.policyDecision && item.policyDecision !== "allow").length;
  const integrityErrors: string[] = [];

  for (const transaction of transactions) {
    const transactionEvents = events.filter((event) => event.transactionId === transaction.id);
    if (transactionEvents.length !== transaction.eventCount) integrityErrors.push(`event_count:${transaction.id}`);
    if (transactionEvents.some((event) => event.caseId !== transaction.caseId)) integrityErrors.push(`case_scope:${transaction.id}`);
    if (!transactionEvents.some((event) => event.type === "KernelCycleStarted")) integrityErrors.push(`missing_start:${transaction.id}`);
    if (transaction.status !== "failed" && !transactionEvents.some((event) => event.type === "KernelCycleCompleted")) integrityErrors.push(`missing_completion:${transaction.id}`);
  }

  const transactionCount = transactions.length;
  const failedRate = percentage(failed, transactionCount);
  const status: KernelHealthStatus = integrityErrors.length || failedRate >= 20 ? "critical" : failedRate > 0 || percentage(blocked, transactionCount) >= 40 ? "degraded" : "healthy";

  return {
    status,
    transactionCount,
    completedRate: percentage(completed, transactionCount),
    blockedRate: percentage(blocked, transactionCount),
    failedRate,
    retryRate: percentage(retried, transactionCount),
    criticalPriorityCount,
    guardedCount,
    integrityErrors
  };
}
