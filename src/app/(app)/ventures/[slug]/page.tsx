import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { VentureMoneySnapshot } from "@/components/ventures/VentureMoneySnapshot";
import { KpiGlance } from "@/components/ventures/KpiGlance";
import { VentureStatusPanel } from "@/components/ventures/VentureStatusPanel";
import { VentureEditDialog } from "@/components/ventures/VentureEditDialog";
import { VenturePageActions } from "@/components/ventures/VenturePageActions";
import { VentureDetailTabs } from "@/components/ventures/VentureDetailTabs";
import { Badge } from "@/components/ui/badge";
import { getVentureBySlug } from "@/lib/ventures";
import { listPnlEntries, monthlyTrend, ventureMonthBreakdown } from "@/lib/pnl";
import { getKpisWithLatest } from "@/lib/kpis";
import { listCheckins, getLatestCheckin } from "@/lib/checkins";
import { listFacts, listLinks } from "@/lib/reference";
import { listClients } from "@/lib/clients";
import { listCategories } from "@/lib/categories";
import { listBlockers, getPrimaryBlocker } from "@/lib/blockers";
import { listPlanItems, getFocusPlanItem, countPortfolioDoingItems } from "@/lib/plan";
import { nowMs } from "@/lib/db";
import { STUDIO_SLUG } from "@/lib/venture-config";
import { cn } from "@/lib/utils";

export default async function VenturePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const venture = await getVentureBySlug(slug);
  if (!venture) notFound();

  const [
    breakdown,
    trend,
    entries,
    kpis,
    checkins,
    latestCheckin,
    facts,
    links,
    clients,
    allCategories,
    blockers,
    planItems,
    primaryBlocker,
    focusPlan,
    portfolioDoingCount,
  ] = await Promise.all([
    ventureMonthBreakdown(venture.id),
    monthlyTrend(venture.id, 6),
    listPnlEntries({ ventureId: venture.id, limit: 30 }),
    getKpisWithLatest(venture.id),
    listCheckins(venture.id, 10),
    getLatestCheckin(venture.id),
    listFacts(venture.id),
    listLinks(venture.id),
    slug === STUDIO_SLUG ? listClients() : Promise.resolve([]),
    listCategories(),
    listBlockers(venture.id, { includeResolved: true }),
    listPlanItems(venture.id),
    getPrimaryBlocker(venture.id),
    getFocusPlanItem(venture.id),
    countPortfolioDoingItems(),
  ]);

  const isStudio = slug === STUDIO_SLUG;
  const trendValues = trend.map((t) => t.netCents);
  const trendLabels = trend.map((t) => t.month);
  const openBlockerCount = blockers.filter((b) => b.status === "open").length;
  const activePlanCount = planItems.filter((i) => i.status !== "done").length;
  const defaultTab = tab ?? "plan";

  return (
    <div className="space-y-8 pb-28">
      <PageHeader
        eyebrow={
          <Link href="/ventures" className="hover:text-primary">
            ← All ventures
          </Link>
        }
        title={venture.name}
        description={venture.oneLiner ?? undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "border-0 capitalize",
                venture.status === "active" && "status-up",
                venture.status === "paused" && "status-flat"
              )}
            >
              {venture.status}
            </Badge>
            <VenturePageActions ventureId={venture.id} />
            <VentureEditDialog venture={venture} />
          </div>
        }
      />

      {/* Execution first: status + next step lead, metrics and money follow. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <VentureStatusPanel
          latestCheckin={latestCheckin}
          ventureId={venture.id}
          ventureSlug={slug}
          primaryBlocker={primaryBlocker ? { id: primaryBlocker.id, body: primaryBlocker.body } : null}
          openBlockerCount={openBlockerCount}
          focusPlanItem={
            focusPlan
              ? {
                  id: focusPlan.id,
                  title: focusPlan.title,
                  status: focusPlan.status,
                  kpiName: focusPlan.kpiName,
                }
              : null
          }
          now={nowMs()}
        />
        <KpiGlance kpis={kpis} ventureId={venture.id} ventureSlug={slug} />
        <VentureMoneySnapshot
          revenueCents={breakdown.revenueCents}
          costCents={breakdown.costCents}
          netCents={breakdown.netCents}
          trend={trendValues}
          trendLabels={trendLabels}
        />
      </div>

      <VentureDetailTabs
        key={defaultTab}
        defaultTab={defaultTab}
        ventureId={venture.id}
        ventureSlug={slug}
        ventureName={venture.name}
        isStudio={isStudio}
        checkins={checkins}
        entries={entries}
        categories={allCategories}
        clients={clients}
        facts={facts}
        links={links}
        blockers={blockers}
        planItems={planItems}
        kpis={kpis}
        planCount={activePlanCount}
        openBlockerCount={openBlockerCount}
        portfolioDoingCount={portfolioDoingCount}
      />
    </div>
  );
}
