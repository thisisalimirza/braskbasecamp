import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ReferencePanel } from "@/components/portfolio/ReferencePanel";
import { PnlEntriesTable } from "@/components/ventures/PnlEntriesTable";
import { VentureMoneySnapshot } from "@/components/ventures/VentureMoneySnapshot";
import { KpiGlance } from "@/components/ventures/KpiGlance";
import { VentureStatusPanel } from "@/components/ventures/VentureStatusPanel";
import { VentureEditDialog } from "@/components/ventures/VentureEditDialog";
import { VentureMoneyActions } from "@/components/ventures/RecordMoneyButton";
import { PipelineBoard } from "@/components/studio/PipelineBoard";
import { ClientList } from "@/components/studio/ClientList";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getVentureBySlug } from "@/lib/ventures";
import { listPnlEntries, monthlyTrend, ventureMonthBreakdown } from "@/lib/pnl";
import { getKpisWithLatest } from "@/lib/kpis";
import { listCheckins, getLatestCheckin } from "@/lib/checkins";
import { listFacts, listLinks } from "@/lib/reference";
import { listClients } from "@/lib/clients";
import { listCategories } from "@/lib/categories";
import { STUDIO_SLUG } from "@/lib/venture-config";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function VenturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const venture = await getVentureBySlug(slug);
  if (!venture) notFound();

  const [breakdown, trend, entries, kpis, checkins, latestCheckin, facts, links, clients, allCategories] =
    await Promise.all([
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
    ]);

  const isStudio = slug === STUDIO_SLUG;
  const trendValues = trend.map((t) => t.netCents);
  const trendLabels = trend.map((t) => t.month);

  return (
    <div className="space-y-8 pb-4">
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
            <VentureMoneyActions ventureId={venture.id} ventureName={venture.name} compact />
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
            <VentureEditDialog venture={venture} />
          </div>
        }
      />

      {/* First fold: the three things that matter */}
      <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
        <VentureMoneySnapshot
          revenueCents={breakdown.revenueCents}
          costCents={breakdown.costCents}
          netCents={breakdown.netCents}
          trend={trendValues}
          trendLabels={trendLabels}
        />
        <KpiGlance kpis={kpis} ventureId={venture.id} ventureSlug={slug} />
        <VentureStatusPanel latestCheckin={latestCheckin} />
      </div>

      {/* Secondary detail — tabs, not competing with the dashboard */}
      <Tabs defaultValue="ledger" className="space-y-4">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="ledger" className="rounded-lg px-4 py-2">
            Money ledger
          </TabsTrigger>
          <TabsTrigger value="ritual" className="rounded-lg px-4 py-2">
            Check-in history
          </TabsTrigger>
          {isStudio && (
            <TabsTrigger value="pipeline" className="rounded-lg px-4 py-2">
              Pipeline
            </TabsTrigger>
          )}
          <TabsTrigger value="reference" className="rounded-lg px-4 py-2">
            Reference
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ledger">
          <PnlEntriesTable
            entries={entries}
            ventureSlug={slug}
            ventureId={venture.id}
            ventureName={venture.name}
            categories={allCategories}
          />
        </TabsContent>

        <TabsContent value="ritual">
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <h2 className="font-heading text-base font-semibold">Check-in history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Trajectory and notes from each weekly ritual.
            </p>
            {checkins.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                No check-ins yet. Use <strong>Weekly check-in</strong> on the portfolio home.
              </p>
            ) : (
              <ul className="mt-6 space-y-3">
                {checkins.map((c) => (
                  <li key={c.id} className="rounded-xl border border-border/70 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          c.trajectory === "up" && "status-up",
                          c.trajectory === "flat" && "status-flat",
                          c.trajectory === "down" && "status-down"
                        )}
                      >
                        {c.trajectory}
                      </span>
                      <span className="text-sm text-muted-foreground">{formatDate(c.checkedAt)}</span>
                    </div>
                    {c.note ? (
                      <p className="mt-2 text-sm leading-relaxed">{c.note}</p>
                    ) : (
                      <p className="mt-2 text-sm italic text-muted-foreground">No note</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        {isStudio && (
          <TabsContent value="pipeline" className="space-y-6">
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
              <h2 className="font-heading text-base font-semibold">Pipeline</h2>
              <div className="mt-4">
                <PipelineBoard clients={clients} studioVentureId={venture.id} />
              </div>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
              <h2 className="font-heading text-base font-semibold">Clients & revenue</h2>
              <div className="mt-4">
                <ClientList clients={clients} />
              </div>
            </div>
          </TabsContent>
        )}

        <TabsContent value="reference">
          <ReferencePanel facts={facts} links={links} scope={venture.id} ventureSlug={slug} title="Reference" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
