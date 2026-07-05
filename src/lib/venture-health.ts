import { listActiveVentures, type Venture } from "./ventures";
import { getLatestCheckin } from "./checkins";
import { lastPnlEntryDate, ventureNetThisMonth } from "./pnl";
import type { Trajectory } from "./checkins";
import type { AttentionReason } from "./attention";
import { pickNextPlanStep, primaryActionForVenture } from "./next-actions";
import type { VenturePlanStep } from "./next-actions";
import { getPrimaryBlockersForVentures, countOpenBlockersForVentures } from "./blockers";
import { getFocusPlanItemsForVentures, getUpcomingPlanItemsForVentures } from "./plan";
import type { PlanItemStatus } from "./plan-types";
import { getKpisWithLatest } from "./kpis";
import {
  buildKpiSnapshots,
  buildKpiStatuses,
  collectVentureAttentionReasons,
  firstStaleNonMoneyKpi,
  ventureTracksMoney,
  type KpiSnapshot,
  type KpiStatusChip,
} from "./kpi-tracking";

export type VentureHealth = {
  venture: Venture;
  netCents: number;
  netLastMonthCents: number;
  trajectory: Trajectory | null;
  lastCheckinAt: number | null;
  lastCheckinNote: string | null;
  lastPnlAt: number | null;
  tracksMoney: boolean;
  kpiSnapshots: KpiSnapshot[];
  kpiStatuses: KpiStatusChip[];
  staleKpiName: string | null;
  reasons: AttentionReason[];
  primaryAction: string;
  primaryBlocker: { id: string; body: string } | null;
  openBlockerCount: number;
  focusPlanItem: { id: string; title: string; status: PlanItemStatus } | null;
  nextPlanStep: VenturePlanStep | null;
};

export async function getVentureHealthSummaries(): Promise<VentureHealth[]> {
  const ventures = await listActiveVentures();
  const ventureIds = ventures.map((v) => v.id);
  const { ventureNetLastMonth } = await import("./pnl");

  const [primaryBlockers, blockerCounts, focusPlans, upcomingPlans] = await Promise.all([
    getPrimaryBlockersForVentures(ventureIds),
    countOpenBlockersForVentures(ventureIds),
    getFocusPlanItemsForVentures(ventureIds),
    getUpcomingPlanItemsForVentures(ventureIds),
  ]);

  const summaries: VentureHealth[] = [];

  for (const venture of ventures) {
    const [netCents, netLastMonth, latestCheckin, lastPnlAt, kpis] = await Promise.all([
      ventureNetThisMonth(venture.id),
      ventureNetLastMonth(venture.id),
      getLatestCheckin(venture.id),
      lastPnlEntryDate(venture.id),
      getKpisWithLatest(venture.id),
    ]);

    const tracksMoney = ventureTracksMoney(kpis);
    const kpiSnapshots = buildKpiSnapshots(kpis);
    const kpiStatuses = buildKpiStatuses(kpis, lastPnlAt);
    const staleKpi = firstStaleNonMoneyKpi(kpis, lastPnlAt);
    const planItems = upcomingPlans.get(venture.id) ?? [];
    const nextPlanStep = pickNextPlanStep(planItems);

    const reasons = collectVentureAttentionReasons({
      trajectory: latestCheckin?.trajectory ?? null,
      lastCheckinAt: latestCheckin?.checkedAt ?? null,
      lastPnlAt,
      netCents,
      netLastMonth,
      tracksMoney,
      kpis,
    });

    const primary = primaryBlockers.get(venture.id) ?? null;
    const focus = focusPlans.get(venture.id) ?? null;

    const row = {
      venture,
      netCents,
      netLastMonthCents: netLastMonth,
      trajectory: latestCheckin?.trajectory ?? null,
      lastCheckinAt: latestCheckin?.checkedAt ?? null,
      lastCheckinNote: latestCheckin?.note ?? null,
      lastPnlAt,
      tracksMoney,
      kpiSnapshots,
      kpiStatuses,
      staleKpiName: staleKpi?.name ?? null,
      reasons,
      primaryAction: "",
      primaryBlocker: primary ? { id: primary.id, body: primary.body } : null,
      openBlockerCount: blockerCounts.get(venture.id) ?? 0,
      focusPlanItem: focus
        ? { id: focus.id, title: focus.title, status: focus.status }
        : null,
      nextPlanStep,
    };

    summaries.push({
      ...row,
      primaryAction: primaryActionForVenture(row).label,
    });
  }

  return summaries;
}
