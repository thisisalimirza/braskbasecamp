import type { AttentionReason } from "./attention";
import type { PlanItem, PlanItemStatus } from "./plan-types";
import type { VentureHealth } from "./venture-health";

export const TRAJECTORY_LABELS = {
  up: "Improving",
  flat: "Steady",
  down: "Struggling",
} as const;

export type VenturePlanStep = {
  title: string;
  status: PlanItemStatus;
  linkedToBlocker: boolean;
  otherBlockerLinkedCount: number;
};

export type VentureAction = {
  label: string;
  type: "view_plan" | "none";
  ventureSlug?: string;
  hint?: string;
  planStep?: VenturePlanStep | null;
};

function sortPlanItems(a: PlanItem, b: PlanItem): number {
  const statusOrder: Record<PlanItemStatus, number> = {
    doing: 0,
    next: 1,
    backlog: 2,
    done: 3,
  };
  return statusOrder[a.status] - statusOrder[b.status] || a.sortOrder - b.sortOrder;
}

/** Pick the headline plan step — blocker-linked items win, then doing over next. */
export function pickNextPlanStep(items: PlanItem[]): VenturePlanStep | null {
  const upcoming = items.filter((i) => i.status === "doing" || i.status === "next");
  if (upcoming.length === 0) return null;

  const blockerLinked = upcoming.filter((i) => i.blockerId).sort(sortPlanItems);
  const unlinked = upcoming.filter((i) => !i.blockerId).sort(sortPlanItems);
  const primary = blockerLinked[0] ?? unlinked[0];
  if (!primary) return null;

  return {
    title: primary.title,
    status: primary.status,
    linkedToBlocker: !!primary.blockerId,
    otherBlockerLinkedCount: blockerLinked.length > 1 ? blockerLinked.length - 1 : 0,
  };
}

export function primaryActionForVenture(row: VentureHealth): VentureAction {
  const step = row.nextPlanStep;
  if (!step) return { label: "All set", type: "none" };

  const hint =
    step.otherBlockerLinkedCount > 0
      ? `Linked to a blocker · +${step.otherBlockerLinkedCount} more`
      : step.linkedToBlocker
        ? "Linked to a blocker"
        : step.status === "doing"
          ? "In progress on your plan"
          : "Up next on your plan";

  return {
    label: step.title,
    type: "view_plan",
    ventureSlug: row.venture.slug,
    hint,
    planStep: step,
  };
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
