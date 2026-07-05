import { daysAgoMs } from "./format";
import type { KpiWithLatest } from "./kpis";
import type { Trajectory } from "./checkins";
import type { AttentionReason } from "./attention";
import { formatKpiValue } from "./kpi-units";

export const KPI_STALE_MS = daysAgoMs(14);

export function isMoneyKpi(unit: string | null): boolean {
  return unit === "$";
}

export function ventureTracksMoney(kpis: { unit: string | null }[]): boolean {
  return kpis.some((k) => isMoneyKpi(k.unit));
}

export type KpiSnapshot = {
  id: string;
  name: string;
  unit: string | null;
  value: number | null;
  trend: "up" | "down" | "flat" | null;
  formattedValue: string;
};

export function kpiTrend(history: number[]): "up" | "down" | "flat" | null {
  if (history.length < 2) return null;
  const prev = history[history.length - 2];
  const curr = history[history.length - 1];
  if (curr > prev) return "up";
  if (curr < prev) return "down";
  return "flat";
}

export function buildKpiSnapshots(kpis: KpiWithLatest[]): KpiSnapshot[] {
  return kpis.map((kpi) => ({
    id: kpi.id,
    name: kpi.name,
    unit: kpi.unit,
    value: kpi.latestValue,
    trend: kpiTrend(kpi.history),
    formattedValue: formatKpiValue(kpi.latestValue, kpi.unit),
  }));
}

export type KpiStatusChip = {
  id: string;
  name: string;
  unit: string | null;
  lastAt: number | null;
  stale: boolean;
};

export function kpiLastUpdatedAt(kpi: KpiWithLatest, lastPnlAt: number | null): number | null {
  if (isMoneyKpi(kpi.unit)) {
    return lastPnlAt ?? kpi.lastRecordedAt;
  }
  return kpi.lastRecordedAt;
}

export function isKpiStale(
  kpi: KpiWithLatest,
  lastPnlAt: number | null,
  cutoff: number = KPI_STALE_MS
): boolean {
  const lastAt = kpiLastUpdatedAt(kpi, lastPnlAt);
  if (!lastAt) return true;
  return lastAt < cutoff;
}

export function buildKpiStatuses(
  kpis: KpiWithLatest[],
  lastPnlAt: number | null,
  cutoff: number = KPI_STALE_MS
): KpiStatusChip[] {
  return kpis.map((kpi) => ({
    id: kpi.id,
    name: kpi.name,
    unit: kpi.unit,
    lastAt: kpiLastUpdatedAt(kpi, lastPnlAt),
    stale: isKpiStale(kpi, lastPnlAt, cutoff),
  }));
}

export function firstStaleNonMoneyKpi(
  kpis: KpiWithLatest[],
  lastPnlAt: number | null,
  cutoff: number = KPI_STALE_MS
): KpiWithLatest | null {
  return kpis.find((k) => !isMoneyKpi(k.unit) && isKpiStale(k, lastPnlAt, cutoff)) ?? null;
}

export function collectVentureAttentionReasons(input: {
  trajectory: Trajectory | null;
  lastCheckinAt: number | null;
  lastPnlAt: number | null;
  netCents: number;
  netLastMonth: number;
  tracksMoney: boolean;
  kpis: KpiWithLatest[];
}): AttentionReason[] {
  const cutoff = KPI_STALE_MS;
  const reasons: AttentionReason[] = [];
  const pulseStale = !input.lastCheckinAt || input.lastCheckinAt < cutoff;
  if (pulseStale) {
    reasons.push(input.trajectory === "down" ? "trajectory_down" : "stale_checkin");
  }
  if (input.tracksMoney && (!input.lastPnlAt || input.lastPnlAt < cutoff)) {
    reasons.push("stale_pnl");
  }
  if (firstStaleNonMoneyKpi(input.kpis, input.lastPnlAt, cutoff)) {
    reasons.push("stale_kpi");
  }
  if (input.tracksMoney && input.netCents < 0 && input.netLastMonth >= 0) {
    reasons.push("new_negative_month");
  }
  return reasons;
}
