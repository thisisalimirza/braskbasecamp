"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { TrendingDown, TrendingUp, Minus, GripVertical } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { formatCents, daysAgoMs } from "@/lib/format";
import { TRAJECTORY_LABELS, primaryActionForVenture } from "@/lib/next-actions";
import { openWeeklyCheckin, openRecordMoneyPrefilled } from "@/components/AppShell";
import { reorderVenturesPriorityAction } from "@/app/actions";
import type { VentureHealth } from "@/lib/venture-health";
import { cn } from "@/lib/utils";

function TrajectoryIcon({ trajectory }: { trajectory: VentureHealth["trajectory"] }) {
  if (trajectory === "up") return <TrendingUp className="size-4 text-emerald-600" />;
  if (trajectory === "down") return <TrendingDown className="size-4 text-red-600" />;
  if (trajectory === "flat") return <Minus className="size-4 text-stone-500" />;
  return null;
}

function relativeDays(ms: number | null): string {
  if (!ms) return "Not yet";
  const days = Math.floor((Date.now() - ms) / (24 * 60 * 60 * 1000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function ActionCell({ row }: { row: VentureHealth }) {
  const action = primaryActionForVenture(row);

  if (action.type === "none") {
    return <span className="text-xs text-muted-foreground">{action.label}</span>;
  }

  if (action.type === "pulse") {
    return (
      <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => openWeeklyCheckin()}>
        {action.label}
      </Button>
    );
  }

  if (action.type === "record_revenue" || action.type === "record_cost") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        onClick={() =>
          openRecordMoneyPrefilled({
            ventureId: action.ventureId,
            kind: action.kind ?? "revenue",
          })
        }
      >
        {action.label}
      </Button>
    );
  }

  return (
    <Link
      href={`/ventures/${action.ventureSlug}`}
      className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-xs font-medium shadow-xs transition-colors hover:bg-muted"
    >
      {action.label}
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card transition-colors",
        isDragging && "relative z-10 shadow-md ring-1 ring-primary/20",
        needsAttention && "bg-amber-50/50 dark:bg-amber-950/10"
      )}
    >
      <td className="w-10 py-3.5 pl-1 pr-0">
        <button
          type="button"
          className="flex size-8 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label={`Reorder ${row.venture.name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </td>
      <td className="w-8 py-3.5 pr-2 text-center text-xs tabular-nums text-muted-foreground">{rank}</td>
      <td className="py-3.5 pr-4">
        <Link
          href={`/ventures/${row.venture.slug}`}
          className="font-medium transition-colors hover:text-primary hover:underline"
        >
          {row.venture.name}
        </Link>
        {row.lastCheckinNote && row.trajectory === "down" && (
          <p className="mt-1 line-clamp-1 text-xs text-red-700 dark:text-red-400">
            Stuck on: {row.lastCheckinNote}
          </p>
        )}
      </td>
      <td
        className={cn(
          "py-3.5 pr-4 tabular-nums font-medium",
          row.netCents < 0 && "text-red-700 dark:text-red-400",
          row.netCents > 0 && "text-emerald-700 dark:text-emerald-400"
        )}
      >
        {formatCents(row.netCents)}
      </td>
      <td className="py-3.5 pr-4">
        {row.trajectory ? (
          <div className="flex items-center gap-1.5">
            <TrajectoryIcon trajectory={row.trajectory} />
            <span className="text-muted-foreground">{TRAJECTORY_LABELS[row.trajectory]}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">No pulse yet</span>
        )}
      </td>
      <td
        className={cn(
          "py-3.5 pr-4 text-muted-foreground",
          (!row.lastCheckinAt || row.lastCheckinAt < cutoff) && "font-medium text-amber-700 dark:text-amber-400"
        )}
      >
        {relativeDays(row.lastCheckinAt)}
      </td>
      <td
        className={cn(
          "py-3.5 pr-4 text-muted-foreground",
          (!row.lastPnlAt || row.lastPnlAt < cutoff) && "font-medium text-amber-700 dark:text-amber-400"
        )}
      >
        {relativeDays(row.lastPnlAt)}
      </td>
      <td className="py-3.5">
        <ActionCell row={row} />
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
    <div className={cn("overflow-x-auto", pending && "opacity-80")}>
      <p className="mb-3 text-xs text-muted-foreground">
        Drag ventures to set your priority order — top of the list is what you care about most.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="pb-3 pl-1 pr-0 font-medium" aria-label="Reorder" />
              <th className="pb-3 pr-2 font-medium">#</th>
              <th className="pb-3 pr-4 font-medium">Venture</th>
              <th className="pb-3 pr-4 font-medium">Money this month</th>
              <th className="pb-3 pr-4 font-medium">How it&apos;s going</th>
              <th className="pb-3 pr-4 font-medium">Last pulse</th>
              <th className="pb-3 pr-4 font-medium">Last money logged</th>
              <th className="pb-3 font-medium">Do this next</th>
            </tr>
          </thead>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <tbody className="divide-y divide-border/60">
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
