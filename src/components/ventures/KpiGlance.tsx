import { VentureDashboardCard } from "@/components/ventures/VentureDashboardCard";
import { KpiManage } from "@/components/ventures/KpiManage";
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
          <KpiManage ventureId={ventureId} ventureSlug={ventureSlug} kpis={kpis} />
        ) : undefined
      }
    >
      {kpis.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-sm text-muted-foreground">
            Track what matters — users, subscribers, revenue, or anything you check weekly.
          </p>
          <div className="mt-4">
            <KpiManage ventureId={ventureId} ventureSlug={ventureSlug} kpis={kpis} defaultOpen />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {kpis.slice(0, 3).map((kpi) => {
            const previous =
              kpi.history.length >= 2 ? kpi.history[kpi.history.length - 2] : null;
            const delta =
              kpi.latestValue != null && previous != null ? kpi.latestValue - previous : null;

            return (
              <div
                key={kpi.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3.5 py-3 transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{kpi.name}</p>
                  <p className="text-[11px] text-muted-foreground">{kpiUnitLabel(kpi.unit)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-heading text-xl font-semibold tabular-nums">
                    {formatKpiValue(kpi.latestValue, kpi.unit)}
                  </p>
                  {delta != null && delta !== 0 && (
                    <p
                      className={`text-[11px] font-medium tabular-nums ${
                        delta > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
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
