import Link from "next/link";
import { PageHeader, SectionCard } from "@/components/ui/page-header";
import { MoneyBlock } from "@/components/portfolio/MoneyBlock";
import { VentureHealthTable } from "@/components/portfolio/VentureHealthTable";
import { ReferencePanel } from "@/components/portfolio/ReferencePanel";
import { PortfolioActions } from "@/components/portfolio/PortfolioActions";
import { companyNetThisMonth, monthlyTrend, ownerEquityCents } from "@/lib/pnl";
import { getVentureHealthSummaries } from "@/lib/venture-health";
import { listGlobalFacts, listLinks } from "@/lib/reference";
import { formatCents } from "@/lib/format";

export default async function PortfolioPage() {
  const [netThisMonth, trend, summaries, ownerEquity, globalFacts, globalLinks] =
    await Promise.all([
      companyNetThisMonth(),
      monthlyTrend(null, 6),
      getVentureHealthSummaries(),
      ownerEquityCents(),
      listGlobalFacts(),
      listLinks("global"),
    ]);

  const trendValues = trend.map((t) => t.netCents);
  const trendLabels = trend.map((t) => t.month);
  const attentionCount = summaries.filter((s) => s.reasons.length > 0).length;
  const topBlocker = summaries.find((s) => s.trajectory === "down" && s.lastCheckinNote);

  return (
    <div className="space-y-8 pb-4">
      <PageHeader
        eyebrow="Brask Group"
        title="Base Camp"
        description={
          attentionCount > 0
            ? `${attentionCount} venture${attentionCount === 1 ? "" : "s"} need your attention this week.`
            : "All ventures checked in recently. Company pulse looks steady."
        }
        actions={<PortfolioActions />}
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <MoneyBlock
          label="Company net · this month"
          cents={netThisMonth}
          trend={trendValues}
          trendLabels={trendLabels}
        />
        <div className="flex flex-col gap-4">
          {topBlocker ? (
            <SectionCard title="Active blocker" description="From latest check-in">
              <Link href={`/ventures/${topBlocker.venture.slug}`} className="group block">
                <p className="font-heading text-lg font-semibold group-hover:text-primary">
                  {topBlocker.venture.name}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {topBlocker.lastCheckinNote}
                </p>
                <p className="mt-3 text-xs font-medium text-primary">View venture →</p>
              </Link>
            </SectionCard>
          ) : (
            <SectionCard title="Owner equity" description="Contributions minus draws">
              <p className="font-heading text-3xl font-semibold tabular-nums">{formatCents(ownerEquity)}</p>
            </SectionCard>
          )}
        </div>
      </div>

      <SectionCard
        title="Venture pulse"
        description="Money, trajectory, and freshness — sorted by what needs you first"
      >
        <VentureHealthTable summaries={summaries} />
      </SectionCard>

      <ReferencePanel
        facts={globalFacts}
        links={globalLinks}
        scope="global"
        title="Company reference"
      />
    </div>
  );
}
