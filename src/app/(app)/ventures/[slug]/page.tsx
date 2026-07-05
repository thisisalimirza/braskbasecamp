import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, SectionCard } from "@/components/ui/page-header";
import { MoneyBlock } from "@/components/portfolio/MoneyBlock";
import { ReferencePanel } from "@/components/portfolio/ReferencePanel";
import { PnlEntriesTable } from "@/components/ventures/PnlEntriesTable";
import { KpiSection } from "@/components/ventures/KpiSection";
import { VentureEditDialog } from "@/components/ventures/VentureEditDialog";
import { PipelineBoard } from "@/components/studio/PipelineBoard";
import { ClientList } from "@/components/studio/ClientList";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getVentureBySlug } from "@/lib/ventures";
import { listPnlEntries, monthlyTrend, ventureNetThisMonth } from "@/lib/pnl";
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

  const [netMonth, trend, entries, kpis, checkins, latestCheckin, facts, links, clients, allCategories] =
    await Promise.all([
      ventureNetThisMonth(venture.id),
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
    <div className="space-y-6 pb-4">
      <PageHeader
        eyebrow={
          <Link href="/ventures" className="hover:text-primary">
            ← All ventures
          </Link>
        }
        title={venture.name}
        description={venture.oneLiner ?? undefined}
        actions={
          <div className="flex items-center gap-2">
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

      {latestCheckin?.trajectory === "down" && latestCheckin.note && (
        <div className="rounded-2xl border border-red-200/80 bg-red-50/80 px-5 py-4 dark:border-red-900/50 dark:bg-red-950/20">
          <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-red-700 dark:text-red-400">
            Blocker · check-in {formatDate(latestCheckin.checkedAt)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-red-900 dark:text-red-200">{latestCheckin.note}</p>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-xl bg-muted/60 p-1">
          <TabsTrigger value="overview" className="rounded-lg px-4 py-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="ledger" className="rounded-lg px-4 py-2">
            Ledger
          </TabsTrigger>
          <TabsTrigger value="ritual" className="rounded-lg px-4 py-2">
            Check-ins
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

        <TabsContent value="overview" className="space-y-6">
          <MoneyBlock
            label="Net this month"
            cents={netMonth}
            trend={trendValues}
            trendLabels={trendLabels}
          />
          <SectionCard
            title="Health metrics"
            description="Separate from money — track subscribers, users, clients, or custom counts"
          >
            <KpiSection ventureId={venture.id} ventureSlug={slug} kpis={kpis} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="ledger">
          <SectionCard title="Money ledger" description="All revenue and costs for this venture">
            <PnlEntriesTable entries={entries} ventureSlug={slug} categories={allCategories} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="ritual">
          <SectionCard title="Weekly check-ins" description="Trajectory and blocker notes over time">
            {checkins.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No check-ins yet. Run the weekly check-in from the portfolio home.
              </p>
            ) : (
              <ul className="space-y-3">
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
          </SectionCard>
        </TabsContent>

        {isStudio && (
          <TabsContent value="pipeline" className="space-y-6">
            <SectionCard title="Pipeline board" description="Drag clients between stages">
              <PipelineBoard clients={clients} studioVentureId={venture.id} />
            </SectionCard>
            <SectionCard title="Client revenue" description="Lifetime revenue linked from ledger entries">
              <ClientList clients={clients} />
            </SectionCard>
          </TabsContent>
        )}

        <TabsContent value="reference">
          <ReferencePanel facts={facts} links={links} scope={venture.id} ventureSlug={slug} title="Reference" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
