import { PageHeader } from "@/components/ui/page-header";
import { GlobalTasksBoard } from "@/components/tasks/GlobalTasksBoard";
import { listAllPlanItems } from "@/lib/plan";
import { listAllOpenBlockers } from "@/lib/blockers";
import { listActiveVentures } from "@/lib/ventures";
import type { VentureBlocker } from "@/lib/blocker-types";

export default async function TasksPage() {
  const [items, ventures, openBlockers] = await Promise.all([
    listAllPlanItems(),
    listActiveVentures(),
    listAllOpenBlockers(),
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
        description="Every planned step across your ventures — board, list, filters, and drag-and-drop."
      />
      <GlobalTasksBoard
        initialItems={items}
        ventures={ventures}
        blockersByVenture={blockersByVenture}
      />
    </div>
  );
}
