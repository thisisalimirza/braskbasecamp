import type { AttentionReason } from "./attention";
import type { VentureHealth } from "./venture-health";

export const TRAJECTORY_LABELS = {
  up: "Improving",
  flat: "Steady",
  down: "Struggling",
} as const;

export type VentureAction = {
  label: string;
  type: "pulse" | "record_revenue" | "record_cost" | "view_venture" | "none";
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
    hint: "Marked as struggling — capture what's blocking progress",
  }),
  stale_checkin: (row) => ({
    label: "Run a pulse",
    type: "pulse",
    ventureId: row.venture.id,
    hint: "No fresh pulse in over two weeks",
  }),
  stale_pnl: (row) => ({
    label: "Log update",
    type: "pulse",
    ventureId: row.venture.id,
    hint: "No money logged — note what's going on or log revenue",
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
    return { label: "All set", type: "none" };
  }
  return REASON_ACTIONS[row.reasons[0]](row);
}

export function friendlyActionHint(reason: AttentionReason): string {
  switch (reason) {
    case "trajectory_down":
      return "Marked as struggling — capture what's blocking progress";
    case "stale_checkin":
      return "No fresh pulse in over two weeks";
    case "stale_pnl":
      return "No money logged recently";
    case "new_negative_month":
      return "Spending more than earning this month";
  }
}
