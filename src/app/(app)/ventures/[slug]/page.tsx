import Link from "next/link";
import { notFound } from "next/navigation";
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
import { listCheckins } from "@/lib/checkins";
import { listFacts, listLinks } from "@/lib/reference";
import { listClients } from "@/lib/clients";
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

  const [netMonth, trend, entries, kpis, checkins, facts, links, clients] = await Promise.all([
    ventureNetThisMonth(venture.id),
    monthlyTrend(venture.id, 6),
    listPnlEntries({ ventureId: venture.id, limit: 30 }),
    getKpisWithLatest(venture.id),
    listCheckins(venture.id, 10),
    listFacts(venture.id),
    listLinks(venture.id),
    slug === STUDIO_SLUG ? listClients() : Promise.resolve([]),
  ]);

  const isStudio = slug === STUDIO_SLUG;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/ventures" className="text-xs text-muted-foreground hover:underline">
            ← Ventures
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{venture.name}</h1>
          {venture.oneLiner && (
            <p className="text-sm text-muted-foreground">{venture.oneLiner}</p>
          )}
          <Badge
            variant="outline"
            className={cn(
              "mt-2 border-0 capitalize",
              venture.status === "active" && "status-up",
              venture.status === "paused" && "status-flat"
            )}
          >
            {venture.status}
          </Badge>
        </div>
        <VentureEditDialog venture={venture} />
      </header>

      <MoneyBlock
        label="Net this month"
        cents={netMonth}
        trend={trend.map((t) => t.netCents)}
      />

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          P&L entries
        </h2>
        <PnlEntriesTable entries={entries} ventureSlug={slug} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Health metrics
        </h2>
        <KpiSection ventureId={venture.id} ventureSlug={slug} kpis={kpis} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Check-in history
        </h2>
        {checkins.length === 0 ? (
          <p className="text-sm text-muted-foreground">No check-ins yet</p>
        ) : (
          <ul className="space-y-2">
            {checkins.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-lg border px-4 py-2 text-sm">
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-xs capitalize",
                    c.trajectory === "up" && "status-up",
                    c.trajectory === "flat" && "status-flat",
                    c.trajectory === "down" && "status-down"
                  )}
                >
                  {c.trajectory}
                </span>
                <span className="text-muted-foreground">{formatDate(c.checkedAt)}</span>
                {c.note && <span>{c.note}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {isStudio && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Studio pipeline
          </h2>
          <Tabs defaultValue="pipeline">
            <TabsList>
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
            </TabsList>
            <TabsContent value="pipeline" className="mt-4">
              <PipelineBoard clients={clients} studioVentureId={venture.id} />
            </TabsContent>
            <TabsContent value="clients" className="mt-4">
              <ClientList clients={clients} />
            </TabsContent>
          </Tabs>
        </section>
      )}

      <ReferencePanel
        facts={facts}
        links={links}
        scope={venture.id}
        ventureSlug={slug}
        title="Reference"
      />
    </div>
  );
}
