import { TrendChart } from "@/components/charts/TrendChart";
import { formatKpiValue } from "@/lib/kpi-units";
import { kpiUnitLabel } from "@/lib/kpi-units";
import { cn } from "@/lib/utils";

export function KpiCard({
  name,
  value,
  unit,
  history,
  previousValue,
  className,
}: {
  name: string;
  value: number | null;
  unit: string | null;
  history?: number[];
  previousValue?: number | null;
  className?: string;
}) {
  const delta =
    value != null && previousValue != null ? value - previousValue : null;
  const chartData = history?.map((v, i) => ({ label: `${i + 1}`, value: v }));

  return (
    <div className={cn("kpi-card rounded-xl p-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-[11px] text-muted-foreground">{kpiUnitLabel(unit)}</p>
        </div>
        {delta != null && delta !== 0 && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
              delta > 0 ? "status-up" : "status-down"
            )}
          >
            {delta > 0 ? "+" : ""}
            {delta.toLocaleString()}
          </span>
        )}
      </div>
      <p className="mt-3 font-heading text-2xl font-semibold tabular-nums">
        {formatKpiValue(value, unit)}
      </p>
      {chartData && chartData.length > 1 && (
        <div className="mt-4 border-t border-border/50 pt-3">
          <TrendChart data={chartData} variant="kpi" className="h-16" />
        </div>
      )}
    </div>
  );
}
