import type { Venture } from "@/lib/ventures";
import type { KpiWithLatest } from "@/lib/kpis";
import type { Trajectory } from "@/lib/checkins";

export type VentureCheckinDraft = {
  venture: Venture;
  kpis: KpiWithLatest[];
  trajectory: Trajectory;
  note: string;
  kpiValues: Record<string, string>;
  stalePnl: boolean;
  daysSincePnl: number | null;
};
