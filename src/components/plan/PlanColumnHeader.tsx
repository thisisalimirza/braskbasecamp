import { Plus } from "lucide-react";
import type { PLAN_COLUMNS } from "@/lib/plan-types";
import { cn } from "@/lib/utils";

type PlanColumn = (typeof PLAN_COLUMNS)[number];

const COLUMN_DOT: Record<PlanColumn["id"], string> = {
  backlog: "bg-stone-400/80",
  next: "bg-sky-400/80",
  doing: "bg-amber-400/90",
  done: "bg-emerald-400/80",
};

const EMPTY_HINTS: Record<PlanColumn["id"], string> = {
  backlog: "Capture ideas here — no commitment yet.",
  next: "Queue the next small step.",
  doing: "Drag a step here when you start it.",
  done: "Finished steps land here.",
};

export function PlanColumnHeader({
  column,
  count,
  onAdd,
}: {
  column: PlanColumn;
  count: number;
  onAdd?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2 px-3 pb-2.5 pt-3">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span className={cn("size-1.5 shrink-0 rounded-full", COLUMN_DOT[column.id])} aria-hidden />
          {column.label}
          <span className="rounded-full bg-background px-1.5 py-px text-[10px] font-medium tabular-nums text-muted-foreground/80 ring-1 ring-inset ring-border/50">
            {count}
          </span>
        </p>
        <p className="mt-1 text-[10px] leading-tight text-muted-foreground/70">{column.hint}</p>
      </div>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          title={`Add to ${column.label}`}
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export function PlanColumnEmptyHint({ column }: { column: PlanColumn }) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 px-3 py-6">
      <p className="text-center text-xs leading-relaxed text-muted-foreground/60">
        {EMPTY_HINTS[column.id]}
      </p>
    </div>
  );
}
