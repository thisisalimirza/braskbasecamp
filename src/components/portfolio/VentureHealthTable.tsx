"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  GripVertical,
  ArrowRight,
  CircleDollarSign,
  ClipboardList,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { formatCents, daysAgoMs } from "@/lib/format";
import { TRAJECTORY_LABELS, primaryActionForVenture, type VentureAction } from "@/lib/next-actions";
import { openWeeklyCheckin, openWeeklyCheckinForVenture, openRecordMoneyPrefilled } from "@/components/AppShell";
import { reorderVenturesPriorityAction } from "@/app/actions";
import type { VentureHealth } from "@/lib/venture-health";
import { cn } from "@/lib/utils";

function TrajectoryBadge({ trajectory }: { trajectory: VentureHealth["trajectory"] }) {
  if (!trajectory) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const config = {
    up: { icon: TrendingUp, label: TRAJECTORY_LABELS.up, className: "status-up" },
    flat: { icon: Minus, label: TRAJECTORY_LABELS.flat, className: "status-flat" },
    down: { icon: TrendingDown, label: TRAJECTORY_LABELS.down, className: "status-down" },
  }[trajectory];

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        config.className
      )}
    >
      <Icon className="size-3.5" />
      {config.label}
    </span>
  );
}

function relativeDays(ms: number | null): string {
  if (!ms) return "Not yet";
  const days = Math.floor((Date.now() - ms) / (24 * 60 * 60 * 1000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function NextAction({ action }: { action: VentureAction }) {
  if (action.type === "none") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
        {action.label}
      </span>
    );
  }

  const pillClass = cn(
    "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium whitespace-nowrap",
    "transition-all duration-150 active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  );

  if (action.type === "pulse") {
    return (
      <button
        type="button"
        className={cn(
          pillClass,
          "border border-primary/20 bg-primary/[0.06] text-primary hover:border-primary/35 hover:bg-primary/10"
        )}
        onClick={() =>
          action.ventureId
            ? openWeeklyCheckinForVenture(action.ventureId)
            : openWeeklyCheckin()
        }
        title={action.hint}
      >
        <ClipboardList className="size-3.5 shrink-0" />
        {action.label}
      </button>
    );
  }

  if (action.type === "record_revenue" || action.type === "record_cost") {
    return (
      <button
        type="button"
        className={cn(
          pillClass,
          "border border-amber-200/90 bg-amber-50 text-amber-950 hover:bg-amber-100/90",
          "dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-950/60"
        )}
        onClick={() =>
          openRecordMoneyPrefilled({
            ventureId: action.ventureId,
            kind: action.kind ?? "revenue",
          })
        }
        title={action.hint}
      >
        <CircleDollarSign className="size-3.5 shrink-0" />
        {action.label}
      </button>
    );
  }

  return (
    <Link
      href={`/ventures/${action.ventureSlug}`}
      className={cn(
        pillClass,
        "border border-border/80 bg-background text-foreground shadow-sm hover:border-primary/25 hover:bg-muted/60"
      )}
      title={action.hint}
    >
      {action.label}
      <ArrowRight className="size-3.5 shrink-0 opacity-50" />
    </Link>
  );
}

function SortableRow({
  row,
  cutoff,
  rank,
}: {
  row: VentureHealth;
  cutoff: number;
  rank: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.venture.id,
  });
  const needsAttention = row.reasons.length > 0;
  const action = primaryActionForVenture(row);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "group bg-card transition-colors hover:bg-muted/25",
        isDragging && "relative z-10 bg-card shadow-lg ring-1 ring-primary/20",
        needsAttention && "border-l-2 border-l-amber-400/80"
      )}
    >
      <td className="w-9 py-4 pl-2 pr-0 align-middle">
        <button
          type="button"
          className="flex size-8 cursor-grab items-center justify-center rounded-md text-muted-foreground/70 opacity-60 transition-all hover:bg-muted hover:text-foreground hover:opacity-100 group-hover:opacity-100 active:cursor-grabbing"
          aria-label={`Reorder ${row.venture.name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </td>
      <td className="w-7 py-4 pr-3 align-middle text-center text-[11px] tabular-nums text-muted-foreground">
        {rank}
      </td>
      <td className="min-w-[140px] py-4 pr-4 align-middle">
        <Link
          href={`/ventures/${row.venture.slug}`}
          className="font-medium text-foreground transition-colors hover:text-primary"
        >
          {row.venture.name}
        </Link>
        {row.lastCheckinNote && row.trajectory === "down" && (
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-red-700 dark:text-red-400">
            Stuck on: {row.lastCheckinNote}
          </p>
        )}
      </td>
      <td
        className={cn(
          "py-4 pr-4 align-middle tabular-nums text-[15px] font-semibold",
          row.netCents < 0 && "text-red-700 dark:text-red-400",
          row.netCents > 0 && "text-emerald-700 dark:text-emerald-400",
          row.netCents === 0 && "text-muted-foreground"
        )}
      >
        {formatCents(row.netCents)}
      </td>
      <td className="py-4 pr-4 align-middle">
        {row.trajectory ? (
          <TrajectoryBadge trajectory={row.trajectory} />
        ) : (
          <span className="text-xs text-muted-foreground">No pulse yet</span>
        )}
      </td>
      <td
        className={cn(
          "py-4 pr-4 align-middle text-sm",
          !row.lastCheckinAt || row.lastCheckinAt < cutoff
            ? "font-medium text-amber-800 dark:text-amber-300"
            : "text-muted-foreground"
        )}
      >
        {relativeDays(row.lastCheckinAt)}
      </td>
      <td
        className={cn(
          "py-4 pr-4 align-middle text-sm",
          !row.lastPnlAt || row.lastPnlAt < cutoff
            ? "font-medium text-amber-800 dark:text-amber-300"
            : "text-muted-foreground"
        )}
      >
        {relativeDays(row.lastPnlAt)}
      </td>
      <td className="w-[148px] py-4 pr-3 align-middle">
        <div className="flex justify-end">
          <NextAction action={action} />
        </div>
      </td>
    </tr>
  );
}

export function VentureHealthTable({ summaries }: { summaries: VentureHealth[] }) {
  const cutoff = daysAgoMs(14);
  const [rows, setRows] = useState(summaries);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setRows(summaries);
  }, [summaries]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rows.findIndex((r) => r.venture.id === active.id);
    const newIndex = rows.findIndex((r) => r.venture.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(rows, oldIndex, newIndex);
    setRows(next);

    startTransition(async () => {
      const res = await reorderVenturesPriorityAction(next.map((r) => r.venture.id));
      if (res.error) {
        toast.error(res.error);
        setRows(summaries);
      }
    });
  };

  const ids = rows.map((r) => r.venture.id);

  return (
    <div className={cn("overflow-x-auto", pending && "opacity-70")}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/70 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <th className="pb-3 pl-2 pr-0" aria-label="Reorder" />
              <th className="pb-3 pr-3">#</th>
              <th className="pb-3 pr-4">Venture</th>
              <th className="pb-3 pr-4">This month</th>
              <th className="pb-3 pr-4">Momentum</th>
              <th className="pb-3 pr-4">Last pulse</th>
              <th className="pb-3 pr-4">Money logged</th>
              <th className="pb-3 pr-3 text-right">Next step</th>
            </tr>
          </thead>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <tbody className="divide-y divide-border/50">
              {rows.map((row, index) => (
                <SortableRow key={row.venture.id} row={row} cutoff={cutoff} rank={index + 1} />
              ))}
            </tbody>
          </SortableContext>
        </table>
      </DndContext>
    </div>
  );
}
