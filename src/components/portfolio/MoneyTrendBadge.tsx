import { TrendingDown, TrendingUp, Minus, Sparkles } from "lucide-react";
import { formatCents } from "@/lib/format";
import { moneyTrend, moneyTrendDelta, type MoneyTrend } from "@/lib/trends";
import { cn } from "@/lib/utils";

export function MoneyTrendBadge({
  netCents,
  netLastMonthCents,
}: {
  netCents: number;
  netLastMonthCents: number;
}) {
  const trend = moneyTrend(netCents, netLastMonthCents);
  const delta = moneyTrendDelta(netCents, netLastMonthCents);

  const config: Record<
    MoneyTrend,
    { icon: typeof TrendingUp; label: string; className: string }
  > = {
    up: { icon: TrendingUp, label: "Up vs last month", className: "text-emerald-700 dark:text-emerald-400" },
    down: { icon: TrendingDown, label: "Down vs last month", className: "text-red-700 dark:text-red-400" },
    flat: { icon: Minus, label: "Same as last month", className: "text-muted-foreground" },
    new: { icon: Sparkles, label: "New this month", className: "text-emerald-700 dark:text-emerald-400" },
  };

  const { icon: Icon, label, className } = config[trend];

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      title={`${label}${trend !== "flat" && trend !== "new" ? ` (${formatCents(delta)})` : ""}`}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}
