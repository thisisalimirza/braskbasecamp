import { listActiveVentures, type Venture } from "./ventures";
import { getLatestCheckin } from "./checkins";
import { lastPnlEntryDate, ventureNetThisMonth } from "./pnl";
import { daysAgoMs } from "./format";
import type { Trajectory } from "./checkins";
import type { AttentionReason } from "./attention";

export type VentureHealth = {
  venture: Venture;
  netCents: number;
  trajectory: Trajectory | null;
  lastCheckinAt: number | null;
  lastCheckinNote: string | null;
  lastPnlAt: number | null;
  reasons: AttentionReason[];
  primaryAction: string;
};

const ACTION_HINTS: Record<AttentionReason, string> = {
  trajectory_down: "Review blocker in check-in",
  stale_checkin: "Run weekly check-in",
  stale_pnl: "Record money or verify Stripe",
  new_negative_month: "Review costs this month",
};

function collectReasons(
  trajectory: Trajectory | null,
  lastCheckinAt: number | null,
  lastPnlAt: number | null,
  netCents: number,
  netLastMonth: number
): AttentionReason[] {
  const cutoff = daysAgoMs(14);
  const reasons: AttentionReason[] = [];
  if (trajectory === "down") reasons.push("trajectory_down");
  if (!lastCheckinAt || lastCheckinAt < cutoff) reasons.push("stale_checkin");
  if (!lastPnlAt || lastPnlAt < cutoff) reasons.push("stale_pnl");
  if (netCents < 0 && netLastMonth >= 0) reasons.push("new_negative_month");
  return reasons;
}

export async function getVentureHealthSummaries(): Promise<VentureHealth[]> {
  const ventures = await listActiveVentures();
  const { ventureNetLastMonth } = await import("./pnl");
  const summaries: VentureHealth[] = [];

  for (const venture of ventures) {
    const [netCents, netLastMonth, latestCheckin, lastPnlAt] = await Promise.all([
      ventureNetThisMonth(venture.id),
      ventureNetLastMonth(venture.id),
      getLatestCheckin(venture.id),
      lastPnlEntryDate(venture.id),
    ]);

    const reasons = collectReasons(
      latestCheckin?.trajectory ?? null,
      latestCheckin?.checkedAt ?? null,
      lastPnlAt,
      netCents,
      netLastMonth
    );

    summaries.push({
      venture,
      netCents,
      trajectory: latestCheckin?.trajectory ?? null,
      lastCheckinAt: latestCheckin?.checkedAt ?? null,
      lastCheckinNote: latestCheckin?.note ?? null,
      lastPnlAt,
      reasons,
      primaryAction: reasons.length > 0 ? ACTION_HINTS[reasons[0]] : "On track",
    });
  }

  return summaries.sort((a, b) => {
    if (a.reasons.length !== b.reasons.length) return b.reasons.length - a.reasons.length;
    return a.netCents - b.netCents;
  });
}
