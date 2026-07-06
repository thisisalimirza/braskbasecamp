import { TrendingDown, TrendingUp } from "lucide-react";
import { VentureDashboardCard } from "@/components/ventures/VentureDashboardCard";
import { KpiMetricsDialog, KpiMetricsDialogProminent } from "@/components/ventures/KpiMetricsDialog";
import { formatKpiValue } from "@/lib/kpi-units";
import type { KpiWithLatest } from "@/lib/kpis";
import { cn } from "@/lib/utils";

export function KpiGlance({
  kpis,
  ventureId,
  ventureSlug,
}: {
  kpis: KpiWithLatest[];
  ventureId: string;
  ventureSlug: string;
}) {
  return (
    <VentureDashboardCard
      label="Key numbers"
      footer={
        kpis.length > 0 ? (
          <KpiMetricsDialog ventureId={ventureId} ventureSlug={ventureSlug} kpis={kpis} />
        ) : undefined
      }
    >
      {kpis.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center gap-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Track what matters — users, subscribers, revenue, or anything you check weekly.
          </p>
          <KpiMetricsDialogProminent ventureId={ventureId} ventureSlug={ventureSlug} kpis={kpis} />
        </div>
      ) : (
        <div className="space-y-2">
          {kpis.slice(0, 4).map((kpi) => {
            const previous =
              kpi.history.length >= 2 ? kpi.history[kpi.history.length - 2] : null;
            const delta =
              kpi.latestValue != null && previous != null ? kpi.latestValue - previous : null;

            return (
              <div
                key={kpi.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-muted/35 px-3.5 py-3"
              >
                <p className="min-w-0 truncate text-sm font-medium">{kpi.name}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <p className="font-heading text-xl font-semibold tabular-nums tracking-tight">
                    {formatKpiValue(kpi.latestValue, kpi.unit)}
                  </p>
                  {delta != null && delta !== 0 && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                        delta > 0
                          ? "bg-emerald-100/60 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : "bg-red-50 text-red-700/90 dark:bg-red-950/40 dark:text-red-300"
                      )}
                      title="Change since previous entry"
                    >
                      {delta > 0 ? (
                        <TrendingUp className="size-2.5" aria-hidden />
                      ) : (
                        <TrendingDown className="size-2.5" aria-hidden />
                      )}
                      {delta > 0 ? "+" : ""}
                      {delta.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </VentureDashboardCard>
  );
}
