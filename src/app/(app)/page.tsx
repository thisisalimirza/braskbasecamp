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
import { requireUser } from "@/lib/current-user";
import { PortfolioPulseCta } from "@/components/portfolio/PortfolioPulseCta";

export default async function PortfolioPage() {
  const [user, netThisMonth, trend, summaries, globalFacts, globalLinks, ritual, portfolioDoingCount] =
    await Promise.all([
      requireUser(),
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

  // Brand-new account: one clear path in, no empty dashboards.
  if (summaries.length === 0) {
    return (
      <div className="space-y-6 pb-28">
        <PageHeader
          eyebrow="Base Camp"
          title="Welcome to Base Camp"
          description="Track what you're building, name the smallest next step, and keep moving one step at a time."
        />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 px-6 py-20 text-center">
          <p className="font-heading text-xl font-semibold">Start with one venture</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            A venture is anything you&apos;re working on — a product, a service, a side project.
            Once it&apos;s in, you&apos;ll run a quick weekly pulse, log what&apos;s blocking you, and
            always have one minimum next step queued.
          </p>
          <Link
            href="/ventures"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Add your first venture
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      <PageHeader
        eyebrow={user.name}
        title="Base Camp"
        description={portfolioHeaderLine(ritual, strugglingVentures)}
      />

      <PortfolioPulseBanner ritual={ritual} />

      {/* On mobile the wrappers dissolve (`contents`) so cards stack in reading
          order; at lg they become the main column and right rail. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="contents lg:block lg:min-w-0 lg:space-y-6">
          <div className="order-1 min-w-0 lg:order-none">
            <ThisWeekWork summaries={summaries} portfolioDoingCount={portfolioDoingCount} />
          </div>

          <div className="order-4 min-w-0 lg:order-none">
            <SectionCard
              title="Venture priorities"
              description="Ranked list — blocker-linked next steps surface first."
              tone="quiet"
            >
              <VentureHealthTable summaries={summaries} />
            </SectionCard>
          </div>
        </div>

        <div className="contents lg:block lg:space-y-6">
          {/* Attention first: the rail reads act → monitor → reference. */}
          <div className="order-2 lg:order-none">
          {topAttention && attentionSnippet ? (
            <SectionCard
              title="Top priority venture"
              description={
                attentionSnippet.badge === "Latest pulse"
                  ? "From your most recent pulse"
                  : "Current blocker — name the step that unblocks it"
              }
              tone="attention"
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
              tone="quiet"
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

          <div className="order-3 lg:order-none">
            <MoneyBlock
              label="Company net · this month"
              cents={netThisMonth}
              trend={trendValues}
              trendLabels={trendLabels}
            />
          </div>

          <div className="order-5 lg:order-none">
            <ReferencePanel
              facts={globalFacts}
              links={globalLinks}
              scope="global"
              title="Company reference"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
