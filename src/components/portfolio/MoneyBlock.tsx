import { formatCents } from "@/lib/format";
import { TrendChart } from "@/components/charts/TrendChart";
import { cn } from "@/lib/utils";

export function MoneyBlock({
  label,
  cents,
  trend,
  trendLabels,
  className,
  compact,
}: {
  label: string;
  cents: number;
  trend?: number[];
  trendLabels?: string[];
  className?: string;
  compact?: boolean;
}) {
  const tone = cents > 0 ? "money-positive" : cents < 0 ? "money-negative" : "money-neutral";
  const chartData =
    trend && trendLabels
      ? trendLabels.map((l, i) => ({ label: l, value: trend[i] ?? 0 }))
      : trend?.map((v, i) => ({ label: `M${i + 1}`, value: v }));

  return (
    <div className={cn("rounded-2xl p-5 shadow-sm", tone, className)}>
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] opacity-70">
        {label}
      </p>
      <p className={cn("mt-2 font-heading font-semibold tabular-nums tracking-tight", compact ? "text-2xl" : "text-4xl")}>
        {formatCents(cents)}
      </p>
      {chartData && chartData.length > 1 && !compact && (
        <div className="mt-5 border-t border-current/10 pt-4">
          <TrendChart data={chartData} variant="money" />
        </div>
      )}
    </div>
  );
}
