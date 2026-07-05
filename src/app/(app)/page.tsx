import Link from "next/link";
import { PageHeader, SectionCard } from "@/components/ui/page-header";
import { MoneyBlock } from "@/components/portfolio/MoneyBlock";
import { VentureHealthTable } from "@/components/portfolio/VentureHealthTable";
import { ReferencePanel } from "@/components/portfolio/ReferencePanel";
import { PortfolioPulseBanner } from "@/components/portfolio/PortfolioPulseBanner";
import { ThisWeekWork } from "@/components/portfolio/ThisWeekWork";
import { AttentionChips } from "@/components/portfolio/AttentionChips";
import { companyNetThisMonth, monthlyTrend } from "@/lib/pnl";
import { getVentureHealthSummaries } from "@/lib/venture-health";
import { portfolioAttentionSnippet, topPortfolioAttention } from "@/lib/venture-display";
import { PlanKpiBadge } from "@/components/plan/PlanKpiBadge";
import { getPortfolioRitualStatus, portfolioHeaderLine } from "@/lib/ritual";
import { listGlobalFacts, listLinks } from "@/lib/reference";
import { countPortfolioDoingItems } from "@/lib/plan";
import { PortfolioPulseCta } from "@/components/portfolio/PortfolioPulseCta";

export default async function PortfolioPage() {
  const [netThisMonth, trend, summaries, globalFacts, globalLinks, ritual, portfolioDoingCount] =
    await Promise.all([
      companyNetThisMonth(),
      monthlyTrend(null, 6),
      getVentureHealthSummaries(),
      listGlobalFacts(),
      listLinks("global"),
      getPortfolioRitualStatus(),
      countPortfolioDoingItems(),
    ]);

  const trendValues = trend.map((t) => t.netCents);
  const trendLabels = trend.map((t) => t.month);
  const strugglingVentures = summaries
    .filter((s) => s.trajectory === "down")
    .map((s) => ({ name: s.venture.name }));
  const topAttention = topPortfolioAttention(summaries);
  const attentionSnippet = topAttention ? portfolioAttentionSnippet(topAttention) : null;
  const allHaveNextStep = summaries.length > 0 && summaries.every((s) => s.nextPlanStep);
  const missingNextStep = summaries.filter((s) => !s.nextPlanStep);

  return (
    <div className="space-y-6 pb-28">
      <PageHeader
        eyebrow="Brask Group"
        title="Base Camp"
        description={portfolioHeaderLine(ritual, strugglingVentures)}
      />

      <PortfolioPulseBanner ritual={ritual} />

      <ThisWeekWork summaries={summaries} portfolioDoingCount={portfolioDoingCount} />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-4">
          {topAttention && attentionSnippet ? (
            <SectionCard
              title="Top priority venture"
              description={
                attentionSnippet.badge === "Latest pulse"
                  ? "From your most recent pulse"
                  : "Current blocker — name the step that unblocks it"
              }
            >
              <Link href={`/ventures/${topAttention.venture.slug}?tab=plan`} className="group block">
                <p className="font-heading text-lg font-semibold group-hover:text-primary">
                  {topAttention.venture.name}
                </p>
                <AttentionChips row={topAttention} className="mt-2" />
                {attentionSnippet.badge && (
                  <p className="mt-2 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {attentionSnippet.badge}
                  </p>
                )}
                <p className="mt-1 text-sm leading-relaxed text-red-950/80 dark:text-red-200/85">
                  {attentionSnippet.headline}
                </p>
                {attentionSnippet.context && (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {attentionSnippet.context}
                  </p>
                )}
                {topAttention.focusPlanItem && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      Minimum next: {topAttention.focusPlanItem.title}
                    </p>
                    {topAttention.focusPlanItem.kpiName && (
                      <PlanKpiBadge name={topAttention.focusPlanItem.kpiName} />
                    )}
                  </div>
                )}
                <p className="mt-3 text-xs font-medium text-primary">Open plan →</p>
              </Link>
            </SectionCard>
          ) : allHaveNextStep ? (
            <SectionCard
              title="Plans are set"
              description="Every venture has a minimum next step queued."
            >
              <p className="text-sm text-muted-foreground">
                Work from <Link href="/tasks" className="font-medium text-primary hover:underline">Tasks</Link> or
                mark steps done as you ship. Run a pulse when your week resets.
              </p>
              {ritual.consecutiveFullPulseWeeks > 1 && (
                <p className="mt-3 text-xs text-emerald-800 dark:text-emerald-300">
                  {ritual.consecutiveFullPulseWeeks} weeks of full portfolio pulses in a row.
                </p>
              )}
            </SectionCard>
          ) : (
            <SectionCard
              title="Set next steps"
              description={`${missingNextStep.length} venture${missingNextStep.length === 1 ? "" : "s"} still need a minimum next step.`}
            >
              <ul className="space-y-1 text-sm">
                {missingNextStep.slice(0, 4).map((s) => (
                  <li key={s.venture.id}>
                    <Link
                      href={`/ventures/${s.venture.slug}?tab=plan`}
                      className="text-primary hover:underline"
                    >
                      {s.venture.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <PortfolioPulseCta
                className="mt-4"
                label="Run pulse to set steps"
                ventureIds={ritual.venturesNeedingPulse.map((v) => v.id)}
              />
            </SectionCard>
          )}
        </div>
        <MoneyBlock
          label="Company net · this month"
          cents={netThisMonth}
          trend={trendValues}
          trendLabels={trendLabels}
        />
      </div>

      <SectionCard
        title="Venture priorities"
        description="Ranked list — blocker-linked next steps surface first."
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
