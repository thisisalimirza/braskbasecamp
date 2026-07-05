import type { Venture } from "@/lib/ventures";
import type { KpiWithLatest } from "@/lib/kpis";
import type { Trajectory } from "@/lib/checkins";
import type { GlobalPlanItem } from "@/lib/plan-types";

export type VentureCheckinDraft = {
  venture: Venture;
  kpis: KpiWithLatest[];
  trajectory: Trajectory;
  note: string;
  kpiValues: Record<string, string>;
  tracksMoney: boolean;
  stalePnl: boolean;
  daysSincePnl: number | null;
  staleKpiNames: string[];
  /** Existing minimum next step on the plan, if any. */
  existingFocusTitle: string | null;
  /** User-entered minimum next step during pulse. */
  nextStepTitle: string;
  nextStepKpiDefinitionId: string;
  /** When note is present: sync to primary blocker (default on if struggling). */
  updateBlocker: boolean;
};

export type PulseReviewContext = {
  recentlyDone: GlobalPlanItem[];
  pulseStreakWeeks: number;
};
