import { TrendChart } from "@/components/charts/TrendChart";
import { formatCents } from "@/lib/format";
import { cn } from "@/lib/utils";

export function VentureMoneySnapshot({
  revenueCents,
  costCents,
  netCents,
  trend,
  trendLabels,
}: {
  revenueCents: number;
  costCents: number;
  netCents: number;
  trend: number[];
  trendLabels: string[];
}) {
  const tone = netCents > 0 ? "money-positive" : netCents < 0 ? "money-negative" : "money-neutral";
  const chartData = trendLabels.map((label, i) => ({ label, value: trend[i] ?? 0 }));

  return (
    <div className={cn("flex h-full flex-col rounded-2xl p-5 shadow-sm", tone)}>
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] opacity-70">
        Money · this month
      </p>
      <p className="mt-2 font-heading text-3xl font-semibold tabular-nums tracking-tight">
        {formatCents(netCents)}
      </p>
      <p className="mt-2 text-sm opacity-80">
        <span className="text-emerald-800 dark:text-emerald-300">{formatCents(revenueCents)} in</span>
        <span className="mx-1.5 opacity-50">·</span>
        <span>{formatCents(costCents)} out</span>
      </p>
      {chartData.length > 1 && (
        <div className="mt-auto border-t border-current/10 pt-4">
          <p className="mb-2 text-[10px] uppercase tracking-wider opacity-60">6-month net</p>
          <TrendChart data={chartData} variant="money" />
        </div>
      )}
    </div>
  );
}
