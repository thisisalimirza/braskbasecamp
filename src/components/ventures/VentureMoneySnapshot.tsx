import { TrendChart } from "@/components/charts/TrendChart";
import { VentureDashboardCard } from "@/components/ventures/VentureDashboardCard";
import { formatCents } from "@/lib/format";

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
  const tone = netCents > 0 ? "positive" : netCents < 0 ? "negative" : "neutral";
  const chartData = trendLabels.map((label, i) => ({ label, value: trend[i] ?? 0 }));

  return (
    <VentureDashboardCard
      label="Money · this month"
      tone={tone}
      footer={
        chartData.length > 1 ? (
          <>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              6-month net
            </p>
            <TrendChart data={chartData} variant="money" />
          </>
        ) : undefined
      }
    >
      <p className="font-heading text-3xl font-semibold tabular-nums tracking-tight">
        {formatCents(netCents)}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        <span className="text-emerald-700 dark:text-emerald-400">{formatCents(revenueCents)} in</span>
        <span className="mx-1.5 opacity-40">·</span>
        <span>{formatCents(costCents)} out</span>
      </p>
    </VentureDashboardCard>
  );
}
