import { cookies } from "next/headers";
import { listVentures, listActiveVentures } from "@/lib/ventures";
import { listCategories } from "@/lib/categories";
import { listClients } from "@/lib/clients";
import { getKpisWithLatest } from "@/lib/kpis";
import { lastPnlEntryDate } from "@/lib/pnl";
import { daysAgoMs } from "@/lib/format";
import { getPortfolioRitualStatus } from "@/lib/ritual";
import { getLatestCheckin } from "@/lib/checkins";
import type { VentureCheckinDraft } from "@/components/wizards/weekly-checkin-types";
import type { Trajectory } from "@/lib/checkins";

export async function getAppShellData() {
  const [ventures, revenueCategories, costCategories, clients, activeVentures, ritual] =
    await Promise.all([
      listVentures(),
      listCategories("revenue"),
      listCategories("cost"),
      listClients(),
      listActiveVentures(),
      getPortfolioRitualStatus(),
    ]);

  const jar = await cookies();
  const lastVentureId = jar.get("last_venture_id")?.value;

  const checkinDrafts: VentureCheckinDraft[] = [];
  const cutoff = daysAgoMs(14);

  for (const v of activeVentures) {
    const [kpis, latestCheckin, lastPnl] = await Promise.all([
      getKpisWithLatest(v.id),
      getLatestCheckin(v.id),
      lastPnlEntryDate(v.id),
    ]);
    const kpiValues: Record<string, string> = {};
    for (const k of kpis) {
      kpiValues[k.id] = k.latestValue != null ? String(k.latestValue) : "";
    }
    const stale = !lastPnl || lastPnl < cutoff;
    const days =
      lastPnl == null ? null : Math.floor((Date.now() - lastPnl) / (24 * 60 * 60 * 1000));

    checkinDrafts.push({
      venture: v,
      kpis,
      trajectory: latestCheckin?.trajectory ?? ("flat" as Trajectory),
      note: latestCheckin?.note ?? "",
      kpiValues,
      stalePnl: stale,
      daysSincePnl: days,
    });
  }

  return {
    ventures,
    revenueCategories,
    costCategories,
    clients,
    lastVentureId,
    checkinDrafts,
    ritual,
  };
}
