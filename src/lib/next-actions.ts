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
};

const REASON_ACTIONS: Record<AttentionReason, (row: VentureHealth) => VentureAction> = {
  trajectory_down: (row) => ({
    label: "See what's stuck",
    type: "view_venture",
    ventureSlug: row.venture.slug,
  }),
  stale_checkin: () => ({
    label: "Run a pulse",
    type: "pulse",
  }),
  stale_pnl: (row) => ({
    label: "Log money",
    type: "record_revenue",
    ventureId: row.venture.id,
    kind: "revenue",
  }),
  new_negative_month: (row) => ({
    label: "Review spending",
    type: "view_venture",
    ventureSlug: row.venture.slug,
  }),
};

export function primaryActionForVenture(row: VentureHealth): VentureAction {
  if (row.reasons.length === 0) {
    return { label: "Looks good", type: "none" };
  }
  return REASON_ACTIONS[row.reasons[0]](row);
}

export function friendlyActionHint(reason: AttentionReason): string {
  switch (reason) {
    case "trajectory_down":
      return "Marked as struggling — see what's blocking it";
    case "stale_checkin":
      return "Hasn't had a pulse in a while";
    case "stale_pnl":
      return "No money logged recently — worth a quick check";
    case "new_negative_month":
      return "Spending more than earning this month";
  }
}
