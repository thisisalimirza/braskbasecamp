import { Sparkline } from "@/components/charts/Sparkline";
import { cn } from "@/lib/utils";

export function KpiCard({
  name,
  value,
  unit,
  history,
  className,
}: {
  name: string;
  value: number | null;
  unit: string | null;
  history?: number[];
  className?: string;
}) {
  const display =
    value == null
      ? "—"
      : unit === "$"
        ? `$${value.toLocaleString()}`
        : unit === "%"
          ? `${value}%`
          : `${value.toLocaleString()}${unit ? ` ${unit}` : ""}`;

  return (
    <div className={cn("kpi-card rounded-xl p-4", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{name}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="text-xl font-semibold tabular-nums">{display}</p>
        {history && history.length > 1 && <Sparkline values={history} />}
      </div>
    </div>
  );
}
