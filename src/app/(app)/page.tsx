import Link from "next/link";
import { PageHeader, SectionCard } from "@/components/ui/page-header";
import { MoneyBlock } from "@/components/portfolio/MoneyBlock";
import { VentureHealthTable } from "@/components/portfolio/VentureHealthTable";
import { ReferencePanel } from "@/components/portfolio/ReferencePanel";
import { PortfolioPulseBanner } from "@/components/portfolio/PortfolioPulseBanner";
import { companyNetThisMonth, monthlyTrend, ownerEquityCents } from "@/lib/pnl";
import { getVentureHealthSummaries } from "@/lib/venture-health";
import { portfolioAttentionSnippet, topPortfolioAttention } from "@/lib/venture-display";
import { getPortfolioRitualStatus, portfolioHeaderLine } from "@/lib/ritual";
import { listGlobalFacts, listLinks } from "@/lib/reference";
import { formatCents } from "@/lib/format";

export default async function PortfolioPage() {
  const [netThisMonth, trend, summaries, ownerEquity, globalFacts, globalLinks, ritual] =
    await Promise.all([
      companyNetThisMonth(),
      monthlyTrend(null, 6),
      getVentureHealthSummaries(),
      ownerEquityCents(),
      listGlobalFacts(),
      listLinks("global"),
      getPortfolioRitualStatus(),
    ]);

  const trendValues = trend.map((t) => t.netCents);
  const trendLabels = trend.map((t) => t.month);
  const attentionCount = summaries.filter((s) => s.reasons.length > 0).length;
  const topAttention = topPortfolioAttention(summaries);
  const attentionSnippet = topAttention ? portfolioAttentionSnippet(topAttention) : null;

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        eyebrow="Brask Group"
        title="Base Camp"
        description={portfolioHeaderLine(ritual, attentionCount)}
      />

      <PortfolioPulseBanner ritual={ritual} />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <MoneyBlock
          label="Company net · this month"
          cents={netThisMonth}
          trend={trendValues}
          trendLabels={trendLabels}
        />
        <div className="flex flex-col gap-4">
          {topAttention && attentionSnippet ? (
            <SectionCard
              title="Needs attention"
              description={
                attentionSnippet.badge === "Latest pulse"
                  ? "From your most recent pulse"
                  : "Your main blocker"
              }
            >
              <Link href={`/ventures/${topAttention.venture.slug}?tab=plan`} className="group block">
                <p className="font-heading text-lg font-semibold group-hover:text-primary">
                  {topAttention.venture.name}
                </p>
                {attentionSnippet.badge && (
                  <p className="mt-2 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {attentionSnippet.badge}
                  </p>
                )}
                <p className="mt-1 text-sm leading-relaxed text-red-800 dark:text-red-300">
                  {attentionSnippet.headline}
                </p>
                {attentionSnippet.context && (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {attentionSnippet.context}
                  </p>
                )}
                {topAttention.focusPlanItem && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Next up: {topAttention.focusPlanItem.title}
                  </p>
                )}
                <p className="mt-3 text-xs font-medium text-primary">Open plan →</p>
              </Link>
            </SectionCard>
          ) : (
            <SectionCard title="Owner equity" description="Contributions minus draws">
              <p className="font-heading text-3xl font-semibold tabular-nums">{formatCents(ownerEquity)}</p>
            </SectionCard>
          )}
        </div>
      </div>

      <SectionCard title="Venture priorities" description="Your ranked list — reorder when your focus shifts.">
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
