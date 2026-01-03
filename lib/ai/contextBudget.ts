import type { PlanType } from "@/types";

export type PlanKey = "standard" | "premium";

export type ContextBudget = {
  inputTokens: number;
  keepLastTurns: number;
};

// Budgets are intentionally conservative to leave headroom for output tokens.
const DEFAULT_BUDGETS: Record<PlanKey, ContextBudget> = {
  standard: { inputTokens: 10000, keepLastTurns: 6 },
  premium: { inputTokens: 30000, keepLastTurns: 12 },
};

const normalizePlan = (planType?: PlanType | string): PlanKey =>
  planType === "premium" ? "premium" : "standard";

export const resolvePlanBudget = (planType?: PlanType | string): ContextBudget =>
  DEFAULT_BUDGETS[normalizePlan(planType)];

export const aggressiveBudget = (budget: ContextBudget): ContextBudget => ({
  inputTokens: Math.max(2000, Math.floor(budget.inputTokens * 0.7)),
  keepLastTurns: Math.max(2, Math.floor(budget.keepLastTurns / 2)),
});
