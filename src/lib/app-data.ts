import { cookies } from "next/headers";
import { requireUser } from "@/lib/current-user";
import { listVentures, listActiveVentures } from "@/lib/ventures";
import { listCategories } from "@/lib/categories";
import { listClients } from "@/lib/clients";
import { getKpisWithLatest } from "@/lib/kpis";
import { lastPnlEntryDate } from "@/lib/pnl";
import { ventureTracksMoney, buildKpiStatuses } from "@/lib/kpi-tracking";
import { getPortfolioRitualStatus } from "@/lib/ritual";
import { getAppSettings } from "@/lib/settings";
import {
  getFocusPlanItem,
  listRecentlyDonePlanItems,
  countPortfolioDoingItems,
} from "@/lib/plan";
import { daysAgoMs } from "@/lib/format";
import type { VentureCheckinDraft } from "@/components/wizards/weekly-checkin-types";

export async function getAppShellData() {
  const user = await requireUser();
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

  const [recentlyDone, portfolioDoingCount, appSettings] = await Promise.all([
    listRecentlyDonePlanItems(daysAgoMs(7)),
    countPortfolioDoingItems(),
    getAppSettings(),
  ]);

  const checkinDrafts: VentureCheckinDraft[] = [];

  for (const v of activeVentures) {
    const [kpis, lastPnl, focus] = await Promise.all([
      getKpisWithLatest(v.id),
      lastPnlEntryDate(v.id),
      getFocusPlanItem(v.id),
    ]);
    const kpiValues: Record<string, string> = {};
    for (const k of kpis) {
      kpiValues[k.id] = "";
    }
    const tracksMoney = ventureTracksMoney(kpis);
    const kpiStatuses = buildKpiStatuses(kpis, lastPnl);
    const stalePnl = tracksMoney && kpiStatuses.some((k) => k.unit === "$" && k.stale);
    const staleKpiNames = kpiStatuses.filter((k) => k.stale && k.unit !== "$").map((k) => k.name);
    const moneyKpi = kpiStatuses.find((k) => k.unit === "$");
    const days =
      moneyKpi?.lastAt == null
        ? null
        : Math.floor((Date.now() - moneyKpi.lastAt) / (24 * 60 * 60 * 1000));

    checkinDrafts.push({
      venture: v,
      kpis,
      trajectory: "flat",
      note: "",
      kpiValues,
      tracksMoney,
      stalePnl,
      daysSincePnl: days,
      staleKpiNames,
      existingFocusTitle: focus?.title ?? null,
      nextStepTitle: "",
      nextStepKpiDefinitionId: "",
      updateBlocker: false,
    });
  }

  return {
    user: { name: user.name, email: user.email },
    ventures,
    revenueCategories,
    costCategories,
    clients,
    lastVentureId,
    checkinDrafts,
    ritual,
    recentlyDone,
    portfolioDoingCount,
    appSettings,
  };
}
