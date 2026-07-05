"use client";

import { useEffect, useState, useTransition, type ComponentProps } from "react";
import Link from "next/link";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  GripVertical,
  ArrowRight,
  Lock,
  Pencil,
  Link2,
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
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";
import { TRAJECTORY_LABELS, primaryActionForVenture, planStatusLabel, type VentureAction } from "@/lib/next-actions";
import { reorderVenturesPriorityAction } from "@/app/actions";
import type { VentureHealth } from "@/lib/venture-health";
import { attentionHeadline, portfolioAttentionSnippet } from "@/lib/venture-display";
import { MoneyTrendBadge } from "@/components/portfolio/MoneyTrendBadge";
import type { KpiSnapshot } from "@/lib/kpi-tracking";
import { cn } from "@/lib/utils";

function KpiTrendIcon({ trend }: { trend: KpiSnapshot["trend"] }) {
  if (trend === "up") return <TrendingUp className="size-3 text-emerald-600 dark:text-emerald-400" />;
  if (trend === "down") return <TrendingDown className="size-3 text-red-600 dark:text-red-400" />;
  if (trend === "flat") return <Minus className="size-3 text-muted-foreground" />;
  return null;
}

function KpiSnapshotRow({ kpi }: { kpi: KpiSnapshot }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px] leading-tight">
      <span className="truncate text-muted-foreground">{kpi.name}</span>
      <span className="inline-flex shrink-0 items-center gap-1 font-medium tabular-nums text-foreground">
        {kpi.formattedValue}
        <KpiTrendIcon trend={kpi.trend} />
      </span>
    </div>
  );
}

function TrajectoryBadge({ trajectory }: { trajectory: VentureHealth["trajectory"] }) {
  if (!trajectory) {
    return <span className="text-xs text-muted-foreground">—</span>;
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

function NextAction({ action }: { action: VentureAction }) {
  if (action.type === "none") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
        {action.label}
      </span>
    );
  }

  const step = action.planStep;
  const pillClass = cn(
    "inline-flex min-h-9 max-w-[200px] flex-col items-end justify-center gap-0.5 rounded-xl px-3 py-2 text-right text-xs font-medium",
    "transition-all duration-150 active:scale-[0.98]",
    "border border-primary/20 bg-primary/[0.06] text-primary hover:border-primary/35 hover:bg-primary/10",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  );

  return (
    <Link href={`/ventures/${action.ventureSlug}?tab=plan`} className={pillClass} title={action.hint}>
      <span className="inline-flex items-center gap-1.5 leading-snug">
        {step?.linkedToBlocker && <Link2 className="size-3 shrink-0 opacity-70" aria-hidden />}
        <span className="line-clamp-2">{action.label}</span>
        <ArrowRight className="size-3.5 shrink-0 opacity-50" />
      </span>
      {step && (
        <span className="text-[10px] font-normal text-muted-foreground">
          {step.otherBlockerLinkedCount > 0
            ? `+${step.otherBlockerLinkedCount} more linked to blockers`
            : planStatusLabel(step.status)}
        </span>
      )}
    </Link>
  );
}

function VentureRow({
  row,
  rank,
  reorderMode,
  sortable,
}: {
  row: VentureHealth;
  rank: number;
  reorderMode: boolean;
  sortable?: {
    attributes: ReturnType<typeof useSortable>["attributes"];
    listeners: ReturnType<typeof useSortable>["listeners"];
    setNodeRef: ReturnType<typeof useSortable>["setNodeRef"];
    transform: ReturnType<typeof useSortable>["transform"];
    transition: ReturnType<typeof useSortable>["transition"];
    isDragging: boolean;
  };
}) {
  const needsAttention = row.trajectory === "down" || row.openBlockerCount > 0;
  const action = primaryActionForVenture(row);
  const blockerText = attentionHeadline(row);
  const attentionContext = portfolioAttentionSnippet(row)?.context;

  const style = sortable
    ? {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }
    : undefined;

  return (
    <tr
      ref={sortable?.setNodeRef}
      style={style}
      className={cn(
        "group bg-card transition-colors hover:bg-muted/20",
        sortable?.isDragging && "relative z-10 shadow-lg ring-1 ring-primary/20",
        needsAttention && "border-l-2 border-l-amber-400/80"
      )}
    >
      <td className="w-9 py-4 pl-2 pr-0 align-middle">
        {reorderMode && sortable ? (
          <button
            type="button"
            className="flex size-8 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
            aria-label={`Reorder ${row.venture.name}`}
            {...sortable.attributes}
            {...sortable.listeners}
          >
            <GripVertical className="size-4" />
          </button>
        ) : (
          <span className="flex size-8 items-center justify-center text-[11px] tabular-nums text-muted-foreground">
            {rank}
          </span>
        )}
      </td>
      <td className="min-w-[148px] py-4 pr-4 align-middle">
        <Link
          href={`/ventures/${row.venture.slug}`}
          className="font-medium text-foreground transition-colors hover:text-primary"
        >
          {row.venture.name}
        </Link>
        {blockerText && (
          <p
            className="mt-1 line-clamp-2 text-xs leading-snug text-red-700 dark:text-red-400"
            title={attentionContext ?? undefined}
          >
            {row.trajectory === "down" && row.lastCheckinNote?.trim() === blockerText
              ? "Latest: "
              : "Blocked: "}
            {blockerText}
            {row.openBlockerCount > 1 && (
              <span className="text-muted-foreground"> · +{row.openBlockerCount - 1} more</span>
            )}
          </p>
        )}
      </td>
      <td className="py-4 pr-4 align-middle">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "tabular-nums text-[15px] font-semibold",
              row.netCents < 0 && "text-red-700 dark:text-red-400",
              row.netCents > 0 && "text-emerald-700 dark:text-emerald-400",
              row.netCents === 0 && "text-muted-foreground"
            )}
          >
            {formatCents(row.netCents)}
          </span>
          <MoneyTrendBadge netCents={row.netCents} netLastMonthCents={row.netLastMonthCents} />
        </div>
      </td>
      <td className="py-4 pr-4 align-middle">
        {row.trajectory ? (
          <TrajectoryBadge trajectory={row.trajectory} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="min-w-[148px] py-4 pr-4 align-middle">
        {row.kpiSnapshots.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {row.kpiSnapshots.map((kpi) => (
              <KpiSnapshotRow key={kpi.id} kpi={kpi} />
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No KPIs</span>
        )}
      </td>
      <td className="w-[180px] py-4 pr-3 align-middle">
        <div className="flex justify-end">
          <NextAction action={action} />
        </div>
      </td>
    </tr>
  );
}

function SortableVentureRow(props: Omit<ComponentProps<typeof VentureRow>, "sortable">) {
  const sortable = useSortable({ id: props.row.venture.id });
  return <VentureRow {...props} sortable={sortable} />;
}

export function VentureHealthTable({ summaries }: { summaries: VentureHealth[] }) {
  const [rows, setRows] = useState(summaries);
  const [reorderMode, setReorderMode] = useState(false);
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
      } else {
        toast.success("Priority order saved");
        setReorderMode(false);
      }
    });
  };

  const ids = rows.map((r) => r.venture.id);

  const tableBody = (
    <tbody className="divide-y divide-border/50">
      {rows.map((row, index) =>
        reorderMode ? (
          <SortableVentureRow
            key={row.venture.id}
            row={row}
            rank={index + 1}
            reorderMode
          />
        ) : (
          <VentureRow
            key={row.venture.id}
            row={row}
            rank={index + 1}
            reorderMode={false}
          />
        )
      )}
    </tbody>
  );

  return (
    <div className={cn("space-y-3", pending && "opacity-70")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {reorderMode
            ? "Drag ventures into priority order, then tap Done."
            : "KPIs show latest values. Next step pulls from your plan — blocker-linked steps first."}
        </p>
        <Button
          type="button"
          variant={reorderMode ? "default" : "outline"}
          size="sm"
          className="gap-1.5"
          onClick={() => setReorderMode(!reorderMode)}
        >
          {reorderMode ? (
            <>
              <Lock className="size-3.5" />
              Done reordering
            </>
          ) : (
            <>
              <Pencil className="size-3.5" />
              Reorder priorities
            </>
          )}
        </Button>
      </div>

      <div className="overflow-x-auto">
        {reorderMode ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pl-2 pr-0" aria-label="Reorder" />
                  <th className="pb-3 pr-4">Venture</th>
                  <th className="pb-3 pr-4">This month</th>
                  <th className="pb-3 pr-4">Momentum</th>
                  <th className="pb-3 pr-4">KPIs</th>
                  <th className="pb-3 pr-3 text-right">Next step</th>
                </tr>
              </thead>
              <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                {tableBody}
              </SortableContext>
            </table>
          </DndContext>
        ) : (
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/70 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 pl-2 pr-0 w-9">#</th>
                <th className="pb-3 pr-4">Venture</th>
                <th className="pb-3 pr-4">This month</th>
                <th className="pb-3 pr-4">Momentum</th>
                <th className="pb-3 pr-4">KPIs</th>
                <th className="pb-3 pr-3 text-right">Next step</th>
              </tr>
            </thead>
            {tableBody}
          </table>
        )}
      </div>
    </div>
  );
}
