import { listActiveVentures } from "./ventures";
import { getLatestCheckin, lastCheckinDate } from "./checkins";
import { lastPnlEntryDate, ventureNetThisMonth, ventureNetLastMonth } from "./pnl";
import { daysAgoMs } from "./format";

export type AttentionReason =
  | "trajectory_down"
  | "stale_checkin"
  | "stale_pnl"
  | "new_negative_month";

export type AttentionItem = {
  ventureId: string;
  ventureName: string;
  ventureSlug: string;
  reasons: AttentionReason[];
  message: string;
};

const REASON_LABELS: Record<AttentionReason, string> = {
  trajectory_down: "Latest check-in trajectory is down",
  stale_checkin: "No check-in in over 14 days",
  stale_pnl: "No money entry in over 14 days",
  new_negative_month: "Net negative this month (was positive last month)",
};

export async function getAttentionItems(): Promise<AttentionItem[]> {
  const ventures = await listActiveVentures();
  const cutoff = daysAgoMs(14);
  const items: AttentionItem[] = [];

  for (const v of ventures) {
    const reasons: AttentionReason[] = [];

    const latestCheckin = await getLatestCheckin(v.id);
    if (latestCheckin?.trajectory === "down") reasons.push("trajectory_down");

    const lastCheckin = await lastCheckinDate(v.id);
    if (!lastCheckin || lastCheckin < cutoff) reasons.push("stale_checkin");

    const lastPnl = await lastPnlEntryDate(v.id);
    if (!lastPnl || lastPnl < cutoff) reasons.push("stale_pnl");

    const thisMonth = await ventureNetThisMonth(v.id);
    const lastMonth = await ventureNetLastMonth(v.id);
    if (thisMonth < 0 && lastMonth >= 0) reasons.push("new_negative_month");

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
