import type { AttentionReason } from "./attention";
import type { VentureHealth } from "./venture-health";
import type { PlanItemStatus } from "./plan-types";

export const TRAJECTORY_LABELS = {
  up: "Improving",
  flat: "Steady",
  down: "Struggling",
} as const;

export type VentureAction = {
  label: string;
  type: "pulse" | "record_revenue" | "record_cost" | "view_venture" | "view_plan" | "none";
  ventureId?: string;
  ventureSlug?: string;
  kind?: "revenue" | "cost";
  hint?: string;
};

/** First matching issue wins — same order as collectReasons in venture-health. */
const REASON_ACTIONS: Record<AttentionReason, (row: VentureHealth) => VentureAction> = {
  trajectory_down: (row) => ({
    label: "Update pulse",
    type: "pulse",
    ventureId: row.venture.id,
    hint: "Marked as struggling — update momentum and what's blocking",
  }),
  stale_checkin: (row) => ({
    label: "Run a pulse",
    type: "pulse",
    ventureId: row.venture.id,
    hint: "No fresh pulse in over two weeks",
  }),
  stale_pnl: (row) => ({
    label: "Log money",
    type: "record_revenue",
    ventureId: row.venture.id,
    kind: "revenue",
    hint: "Revenue KPI venture — no money logged in 2+ weeks",
  }),
  stale_kpi: (row) => ({
    label: "Update metrics",
    type: "pulse",
    ventureId: row.venture.id,
    hint: row.staleKpiName
      ? `${row.staleKpiName} wasn't updated on your last pulse`
      : "Refresh your key numbers on the next pulse",
  }),
  new_negative_month: (row) => ({
    label: "Review spending",
    type: "view_venture",
    ventureSlug: row.venture.slug,
    hint: "Spending more than earning this month",
  }),
};

export function primaryActionForVenture(row: VentureHealth): VentureAction {
  if (row.reasons.length === 0) {
    if (row.focusPlanItem) {
      const doing = row.focusPlanItem.status === "doing";
      return {
        label: doing ? "Continue" : "Start next",
        type: "view_plan",
        ventureSlug: row.venture.slug,
        hint: row.focusPlanItem.title,
      };
    }
    return { label: "All set", type: "none" };
  }
  return REASON_ACTIONS[row.reasons[0]](row);
}

export function planStatusLabel(status: PlanItemStatus): string {
  switch (status) {
    case "backlog":
      return "Idea";
    case "next":
      return "Up next";
    case "doing":
      return "In progress";
    case "done":
      return "Done";
  }
}

export function friendlyActionHint(reason: AttentionReason): string {
  switch (reason) {
    case "trajectory_down":
      return "Marked as struggling — capture what's blocking progress";
    case "stale_checkin":
      return "No fresh pulse in over two weeks";
    case "stale_pnl":
      return "No money logged in over two weeks";
    case "stale_kpi":
      return "A key metric wasn't updated on your last pulse";
    case "new_negative_month":
      return "Spending more than earning this month";
  }
}
