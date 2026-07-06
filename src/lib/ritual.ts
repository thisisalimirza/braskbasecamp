import { listActiveVentures } from "./ventures";
import { getDb } from "./db";
import { requireUserId } from "./current-user";
import { OWNED_VENTURES } from "./ownership";
import { daysAgoMs } from "./format";
import type { PortfolioRitualStatus, RitualStatus, VenturePulseNeed } from "./ritual-copy";

export type { PortfolioRitualStatus, RitualStatus, VenturePulseNeed } from "./ritual-copy";
export { pulseBannerCopy, ritualWizardTitle, portfolioHeaderLine, remainingPulseWizardTitle } from "./ritual-copy";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const OVERDUE_MS = 14 * 24 * 60 * 60 * 1000;

/** Count consecutive calendar weeks (ending this week or last) with a full portfolio pulse. */
export async function getConsecutiveFullPulseWeeks(activeCount: number): Promise<number> {
  if (activeCount === 0) return 0;
  const userId = await requireUserId();
  const db = await getDb();
  const res = await db.execute(
    `
    SELECT checked_at, COUNT(DISTINCT venture_id) AS venture_count
    FROM checkins
    WHERE venture_id IN ${OWNED_VENTURES}
    GROUP BY checked_at
    HAVING venture_count >= ?
    ORDER BY checked_at DESC
    LIMIT 52
  `,
    [userId, activeCount]
  );
  if (res.rows.length === 0) return 0;

  const weekBuckets = new Set<number>();
  for (const row of res.rows) {
    const ts = Number(row.checked_at);
    weekBuckets.add(Math.floor(ts / WEEK_MS));
  }

  const thisWeek = Math.floor(Date.now() / WEEK_MS);
  let streak = 0;
  for (let w = thisWeek; w >= thisWeek - 51; w--) {
    if (weekBuckets.has(w)) streak++;
    else if (w < thisWeek) break;
  }
  return streak;
}

/** Latest timestamp where every active venture was checked in together (one ritual session). */
export async function getLastFullRitualAt(activeCount: number): Promise<number | null> {
  if (activeCount === 0) return null;
  const userId = await requireUserId();
  const db = await getDb();
  const res = await db.execute(
    `
    SELECT checked_at, COUNT(DISTINCT venture_id) AS venture_count
    FROM checkins
    WHERE venture_id IN ${OWNED_VENTURES}
    GROUP BY checked_at
    HAVING venture_count >= ?
    ORDER BY checked_at DESC
    LIMIT 1
  `,
    [userId, activeCount]
  );
  if (res.rows.length === 0) return null;
  return Number(res.rows[0].checked_at);
}

export async function getPortfolioRitualStatus(): Promise<PortfolioRitualStatus> {
  const activeVentures = await listActiveVentures();
  const activeVentureCount = activeVentures.length;

  if (activeVentureCount === 0) {
    return {
      status: "current",
      lastFullRitualAt: null,
      daysSinceLastRitual: null,
      activeVentureCount: 0,
      venturesMissingPulse: 0,
      venturesNeedingPulse: [],
      consecutiveFullPulseWeeks: 0,
    };
  }

  const lastFullRitualAt = await getLastFullRitualAt(activeVentureCount);
  const consecutiveFullPulseWeeks = await getConsecutiveFullPulseWeeks(activeVentureCount);
  const weekCutoff = daysAgoMs(7);

  const venturesNeedingPulse: VenturePulseNeed[] = [];
  const { getLatestCheckin } = await import("./checkins");
  for (const v of activeVentures) {
    const latest = await getLatestCheckin(v.id);
    if (!latest || latest.checkedAt < weekCutoff) {
      venturesNeedingPulse.push({ id: v.id, name: v.name, slug: v.slug });
    }
  }

  const venturesMissingPulse = venturesNeedingPulse.length;
  const age = lastFullRitualAt ? Date.now() - lastFullRitualAt : null;
  const daysSinceLastRitual = age != null ? Math.floor(age / (24 * 60 * 60 * 1000)) : null;

  let status: RitualStatus;
  if (venturesMissingPulse === 0) {
    status = "current";
  } else if (!lastFullRitualAt) {
    status = "never";
  } else if (age! > OVERDUE_MS) {
    status = "overdue";
  } else if (age! > WEEK_MS) {
    status = "due";
  } else {
    status = "current";
  }

  return {
    status,
    lastFullRitualAt,
    daysSinceLastRitual,
    activeVentureCount,
    venturesMissingPulse,
    venturesNeedingPulse,
    consecutiveFullPulseWeeks,
  };
}
