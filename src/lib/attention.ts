import { listActiveVentures } from "./ventures";
import { getLatestCheckin, lastCheckinDate } from "./checkins";
import { lastPnlEntryDate, ventureNetThisMonth, ventureNetLastMonth } from "./pnl";
import { getKpisWithLatest } from "./kpis";
import { collectVentureAttentionReasons, ventureTracksMoney } from "./kpi-tracking";
import { friendlyActionHint } from "./next-actions";

export type AttentionReason =
  | "trajectory_down"
  | "stale_checkin"
  | "stale_pnl"
  | "stale_kpi"
  | "new_negative_month";

export type AttentionItem = {
  ventureId: string;
  ventureName: string;
  ventureSlug: string;
  reasons: AttentionReason[];
  message: string;
};

const REASON_LABELS: Record<AttentionReason, string> = {
  trajectory_down: friendlyActionHint("trajectory_down"),
  stale_checkin: friendlyActionHint("stale_checkin"),
  stale_pnl: friendlyActionHint("stale_pnl"),
  stale_kpi: friendlyActionHint("stale_kpi"),
  new_negative_month: friendlyActionHint("new_negative_month"),
};

export async function getAttentionItems(): Promise<AttentionItem[]> {
  const ventures = await listActiveVentures();
  const items: AttentionItem[] = [];

  for (const v of ventures) {
    const [latestCheckin, lastCheckin, lastPnl, kpis, thisMonth, lastMonth] = await Promise.all([
      getLatestCheckin(v.id),
      lastCheckinDate(v.id),
      lastPnlEntryDate(v.id),
      getKpisWithLatest(v.id),
      ventureNetThisMonth(v.id),
      ventureNetLastMonth(v.id),
    ]);

    const reasons = collectVentureAttentionReasons({
      trajectory: latestCheckin?.trajectory ?? null,
      lastCheckinAt: lastCheckin,
      lastPnlAt: lastPnl,
      netCents: thisMonth,
      netLastMonth: lastMonth,
      tracksMoney: ventureTracksMoney(kpis),
      kpis,
    });

    if (reasons.length > 0) {
      items.push({
        ventureId: v.id,
        ventureName: v.name,
        ventureSlug: v.slug,
        reasons,
        message: reasons.map((r) => REASON_LABELS[r]).join("; "),
      });
    }
  }

  return items;
}

export async function getBiggestProblem(): Promise<{
  ventureName: string;
  ventureSlug: string;
  netCents: number;
} | null> {
  const { ventureRanking } = await import("./pnl");
  const { startOfMonthMs } = await import("./format");
  const ranking = await ventureRanking(startOfMonthMs());
  if (ranking.length === 0) return null;

  const attention = await getAttentionItems();
  if (attention.length > 0) {
    const first = attention[0];
    const rank = ranking.find((r) => r.slug === first.ventureSlug);
    return {
      ventureName: first.ventureName,
      ventureSlug: first.ventureSlug,
      netCents: rank?.netCents ?? 0,
    };
  }

  const worst = [...ranking].sort((a, b) => a.netCents - b.netCents)[0];
  return { ventureName: worst.name, ventureSlug: worst.slug, netCents: worst.netCents };
}
