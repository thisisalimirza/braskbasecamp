import Link from "next/link";
import { MoneyBlock } from "@/components/portfolio/MoneyBlock";
import { ReferencePanel } from "@/components/portfolio/ReferencePanel";
import { PortfolioActions } from "@/components/portfolio/PortfolioActions";
import { Badge } from "@/components/ui/badge";
import { companyNetThisMonth, monthlyTrend, ventureRanking, ownerEquityCents } from "@/lib/pnl";
import { getAttentionItems, getBiggestProblem } from "@/lib/attention";
import { listGlobalFacts, listLinks } from "@/lib/reference";
import { formatCents, startOfMonthMs } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function PortfolioPage() {
  const [
    netThisMonth,
    trend,
    ranking,
    attention,
    problem,
    ownerEquity,
    globalFacts,
    globalLinks,
  ] = await Promise.all([
    companyNetThisMonth(),
    monthlyTrend(null, 6),
    ventureRanking(startOfMonthMs()),
    getAttentionItems(),
    getBiggestProblem(),
    ownerEquityCents(),
    listGlobalFacts(),
    listLinks("global"),
  ]);

  const trendValues = trend.map((t) => t.netCents);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <MoneyBlock label="Company net this month" cents={netThisMonth} trend={trendValues} />
          {problem && (
            <div
              className={cn(
                "rounded-xl p-4",
                problem.netCents < 0 ? "money-negative" : "money-neutral"
              )}
            >
              <p className="text-xs font-medium uppercase tracking-wide opacity-70">
                Biggest attention
              </p>
              <Link href={`/ventures/${problem.ventureSlug}`} className="mt-1 block">
                <p className="text-xl font-semibold hover:underline">{problem.ventureName}</p>
                <p className="text-sm opacity-80">{formatCents(problem.netCents)} this month</p>
              </Link>
            </div>
          )}
        </div>
        <PortfolioActions />
      </section>

      {attention.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Needs attention
          </h2>
          <div className="space-y-2">
            {attention.map((item) => (
              <Link
                key={item.ventureId}
                href={`/ventures/${item.ventureSlug}`}
                className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:hover:bg-red-950/50"
              >
                <span className="font-medium">{item.ventureName}</span>
                <span className="text-xs text-muted-foreground">{item.message}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Ventures this month
        </h2>
        <div className="space-y-2">
          {ranking.map((v, i) => (
            <Link
              key={v.id}
              href={`/ventures/${v.slug}`}
              className="flex items-center justify-between rounded-lg border px-4 py-3 transition hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                <span className="font-medium">{v.name}</span>
                {v.netCents < 0 && (
                  <Badge variant="outline" className="status-down border-0 text-xs">
                    Negative
                  </Badge>
                )}
              </div>
              <span
                className={cn(
                  "tabular-nums font-medium",
                  v.netCents > 0 && "text-emerald-700 dark:text-emerald-400",
                  v.netCents < 0 && "text-red-700 dark:text-red-400"
                )}
              >
                {formatCents(v.netCents)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Owner equity
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatCents(ownerEquity)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Contributions minus draws</p>
        </div>
      </section>

      <ReferencePanel
        facts={globalFacts}
        links={globalLinks}
        scope="global"
        title="Brask Group reference"
      />
    </div>
  );
}
