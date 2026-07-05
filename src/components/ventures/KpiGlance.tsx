import { VentureDashboardCard } from "@/components/ventures/VentureDashboardCard";
import { KpiMetricsDialog, KpiMetricsDialogProminent } from "@/components/ventures/KpiMetricsDialog";
import { formatKpiValue, kpiUnitLabel } from "@/lib/kpi-units";
import type { KpiWithLatest } from "@/lib/kpis";

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
                className="flex items-center justify-between gap-3 rounded-xl border border-transparent bg-muted/35 px-3.5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{kpi.name}</p>
                  <p className="text-[11px] text-muted-foreground">{kpiUnitLabel(kpi.unit)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-heading text-xl font-semibold tabular-nums tracking-tight">
                    {formatKpiValue(kpi.latestValue, kpi.unit)}
                  </p>
                  {delta != null && delta !== 0 && (
                    <p
                      className={`text-[11px] font-medium tabular-nums ${
                        delta > 0
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {delta > 0 ? "+" : ""}
                      {delta.toLocaleString()}
                    </p>
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
