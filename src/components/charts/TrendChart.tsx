"use client";

import { formatCents } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TrendChart({
  data,
  className,
  variant = "money",
}: {
  data: { label: string; value: number }[];
  className?: string;
  variant?: "money" | "kpi";
}) {
  if (data.length === 0) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;
  const height = 120;

  const formatValue = (v: number) => (variant === "money" ? formatCents(v) : v.toLocaleString());

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((point) => {
          const barHeight = Math.max(8, ((point.value - min) / range) * (height - 24));
          const isNegative = variant === "money" && point.value < 0;
          const isPositive = variant === "money" && point.value > 0;
          return (
            <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {formatValue(point.value)}
              </span>
              <div
                className={cn(
                  "w-full max-w-[48px] rounded-t-md transition-colors",
                  variant === "kpi" && "bg-stone-300 dark:bg-stone-600",
                  variant === "money" && isNegative && "bg-red-300/80 dark:bg-red-800/60",
                  variant === "money" && isPositive && "bg-emerald-400/80 dark:bg-emerald-700/60",
                  variant === "money" && point.value === 0 && "bg-stone-200 dark:bg-stone-700"
                )}
                style={{ height: barHeight }}
                title={`${point.label}: ${formatValue(point.value)}`}
              />
              <span className="text-[10px] font-medium text-muted-foreground">{point.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
