import type { Venture } from "@/lib/ventures";
import type { KpiWithLatest } from "@/lib/kpis";
import type { Trajectory } from "@/lib/checkins";

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
};
