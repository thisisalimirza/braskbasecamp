import { PageHeader } from "@/components/ui/page-header";
import { GlobalTasksBoard } from "@/components/tasks/GlobalTasksBoard";
import { listAllPlanItems, countPortfolioDoingItems } from "@/lib/plan";
import { listAllOpenBlockers } from "@/lib/blockers";
import { listActiveVentures } from "@/lib/ventures";
import { listKpiDefinitionsForVentures } from "@/lib/kpis";
import type { VentureBlocker } from "@/lib/blocker-types";

export default async function TasksPage() {
  const [items, ventures, openBlockers] = await Promise.all([
    listAllPlanItems(),
    listActiveVentures(),
    listAllOpenBlockers(),
  ]);

  const ventureIds = ventures.map((v) => v.id);
  const [kpisByVenture, portfolioDoingCount] = await Promise.all([
    listKpiDefinitionsForVentures(ventureIds),
    countPortfolioDoingItems(),
  ]);

  const blockersByVenture: Record<string, VentureBlocker[]> = {};
  for (const v of ventures) blockersByVenture[v.id] = [];
  for (const b of openBlockers) {
    if (!blockersByVenture[b.ventureId]) blockersByVenture[b.ventureId] = [];
    blockersByVenture[b.ventureId].push(b);
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Portfolio"
        title="Tasks"
        description="Do today's minimum steps — board and full list when you need the big picture."
      />
      <GlobalTasksBoard
        initialItems={items}
        ventures={ventures}
        blockersByVenture={blockersByVenture}
        kpisByVenture={kpisByVenture}
        portfolioDoingCount={portfolioDoingCount}
      />
    </div>
  );
}
