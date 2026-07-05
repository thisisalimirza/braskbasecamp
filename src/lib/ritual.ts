import { listActiveVentures } from "./ventures";
import { getDb } from "./db";
import { daysAgoMs } from "./format";
import type { PortfolioRitualStatus, RitualStatus } from "./ritual-copy";

export type { PortfolioRitualStatus, RitualStatus } from "./ritual-copy";
export { ritualButtonCopy, ritualWizardTitle, portfolioHeaderLine } from "./ritual-copy";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const OVERDUE_MS = 14 * 24 * 60 * 60 * 1000;

/** Latest timestamp where every active venture was checked in together (one ritual session). */
export async function getLastFullRitualAt(activeCount: number): Promise<number | null> {
  if (activeCount === 0) return null;
  const db = await getDb();
  const res = await db.execute(
    `
    SELECT checked_at, COUNT(DISTINCT venture_id) AS venture_count
    FROM checkins
    GROUP BY checked_at
    HAVING venture_count >= ?
    ORDER BY checked_at DESC
    LIMIT 1
  `,
    [activeCount]
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
    };
  }

  const lastFullRitualAt = await getLastFullRitualAt(activeVentureCount);
  const weekCutoff = daysAgoMs(7);

  let venturesMissingPulse = 0;
  const { getLatestCheckin } = await import("./checkins");
  for (const v of activeVentures) {
    const latest = await getLatestCheckin(v.id);
    if (!latest || latest.checkedAt < weekCutoff) venturesMissingPulse++;
  }

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
    status = "due";
  }

  return {
    status,
    lastFullRitualAt,
    daysSinceLastRitual,
    activeVentureCount,
    venturesMissingPulse,
  };
}
