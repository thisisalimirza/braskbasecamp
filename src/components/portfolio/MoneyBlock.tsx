import { formatCents } from "@/lib/format";
import { Sparkline } from "@/components/charts/Sparkline";
import { cn } from "@/lib/utils";

export function MoneyBlock({
  label,
  cents,
  trend,
  className,
}: {
  label: string;
  cents: number;
  trend?: number[];
  className?: string;
}) {
  const tone = cents > 0 ? "money-positive" : cents < 0 ? "money-negative" : "money-neutral";

  return (
    <div className={cn("rounded-xl p-4", tone, className)}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold tabular-nums sm:text-3xl">{formatCents(cents)}</p>
        {trend && trend.length > 1 && (
          <Sparkline values={trend} positive={cents >= 0} />
        )}
      </div>
    </div>
  );
}
