import { KpiCard } from "@/components/portfolio/KpiCard";
import { KpiManage } from "@/components/ventures/KpiManage";
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
    <div className="flex h-full flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Health metrics
      </p>

      {kpis.length === 0 ? (
        <div className="mt-4 flex flex-1 flex-col justify-center">
          <p className="text-sm text-muted-foreground">No metrics yet — add subscribers, users, or clients.</p>
          <div className="mt-4">
            <KpiManage ventureId={ventureId} ventureSlug={ventureSlug} kpis={kpis} defaultOpen />
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {kpis.slice(0, 3).map((kpi) => {
              const previous =
                kpi.history.length >= 2 ? kpi.history[kpi.history.length - 2] : null;
              return (
                <KpiCard
                  key={kpi.id}
                  name={kpi.name}
                  value={kpi.latestValue}
                  unit={kpi.unit}
                  history={kpi.history}
                  previousValue={previous}
                  className="shadow-none"
                />
              );
            })}
          </div>
          <div className="mt-4 border-t border-border/60 pt-3">
            <KpiManage ventureId={ventureId} ventureSlug={ventureSlug} kpis={kpis} />
          </div>
        </>
      )}
    </div>
  );
}
