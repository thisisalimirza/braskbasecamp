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
  ClipboardList,
  BarChart3,
  OctagonAlert,
  Plus,
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
import { formatCents, daysAgoMs } from "@/lib/format";
import { TRAJECTORY_LABELS, primaryActionForVenture, planStatusLabel, type VentureAction } from "@/lib/next-actions";
import { reorderVenturesPriorityAction } from "@/app/actions";
import { openWeeklyCheckinForVenture } from "@/components/AppShell";
import type { VentureHealth } from "@/lib/venture-health";
import { attentionHeadline, portfolioAttentionSnippet } from "@/lib/venture-display";
import { MoneyTrendBadge } from "@/components/portfolio/MoneyTrendBadge";
import { AttentionChips } from "@/components/portfolio/AttentionChips";
import type { KpiSnapshot } from "@/lib/kpi-tracking";
import { cn } from "@/lib/utils";

/** Shared column template so the header legend and every row stay aligned. */
const ROW_GRID =
  "grid grid-cols-[2.25rem_minmax(0,1fr)_5.5rem_7.25rem_12.75rem] items-start gap-x-4 sm:gap-x-5";

function KpiTrendIcon({ trend }: { trend: KpiSnapshot["trend"] }) {
  if (trend === "up") return <TrendingUp className="size-3 text-emerald-600/80 dark:text-emerald-400/80" />;
  if (trend === "down") return <TrendingDown className="size-3 text-red-500/80 dark:text-red-400/80" />;
  if (trend === "flat") return <Minus className="size-3 text-muted-foreground/60" />;
  return null;
}

function KpiInlineList({ kpis }: { kpis: KpiSnapshot[] }) {
  if (kpis.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs leading-tight">
      {kpis.map((kpi) => (
        <span key={kpi.id} className="inline-flex items-center gap-1.5">
          <span className="text-muted-foreground/75">{kpi.name}</span>
          <span className="inline-flex items-center gap-0.5 font-medium tabular-nums text-foreground/90">
            {kpi.formattedValue}
            <KpiTrendIcon trend={kpi.trend} />
          </span>
        </span>
      ))}
    </div>
  );
}

function formatPulseRecency(ms: number | null): string {
  if (!ms) return "No pulse yet";
  const days = Math.floor((Date.now() - ms) / (24 * 60 * 60 * 1000));
  if (days === 0) return "Pulse · today";
  if (days === 1) return "Pulse · yesterday";
  if (days < 14) return `Pulse · ${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `Pulse · ${weeks}w ago`;
}

function TrajectoryBadge({ trajectory }: { trajectory: VentureHealth["trajectory"] }) {
  if (!trajectory) {
    return <span className="text-xs text-muted-foreground/60">—</span>;
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
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        config.className
      )}
    >
      <Icon className="size-3.5" />
      {config.label}
    </span>
  );
}

function NextAction({ action }: { action: VentureAction }) {
  const step = action.planStep;
  const isUnset = !step;

  const subtext = isUnset
    ? "Add one on the plan"
    : step.otherBlockerLinkedCount > 0
      ? `+${step.otherBlockerLinkedCount} more linked to blockers`
      : step.linkedToKpi && step.kpiName
        ? `Moves ${step.kpiName}`
        : planStatusLabel(step.status);

  return (
    <Link
      href={`/ventures/${action.ventureSlug}?tab=plan`}
      title={action.hint}
      className={cn(
        "group/step flex w-full flex-col gap-1 rounded-xl px-3.5 py-2.5 text-left text-xs",
        "transition-all duration-150 active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isUnset
          ? "border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/[0.03] hover:text-foreground"
          : "border border-primary/15 bg-primary/[0.05] hover:border-primary/30 hover:bg-primary/[0.09]"
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span className={cn("line-clamp-2 font-medium leading-snug", !isUnset && "text-primary")}>
          {isUnset ? "Set next step" : action.label}
        </span>
        {isUnset ? (
          <Plus className="mt-px size-3.5 shrink-0 opacity-60" aria-hidden />
        ) : (
          <ArrowRight
            className="mt-px size-3.5 shrink-0 text-primary/50 transition-transform duration-150 group-hover/step:translate-x-0.5"
            aria-hidden
          />
        )}
      </span>
      <span className="flex items-center gap-1 text-[11px] leading-tight text-muted-foreground">
        {step?.linkedToBlocker && <Link2 className="size-3 shrink-0 opacity-70" aria-hidden />}
        {step?.linkedToKpi && step.kpiName && !step.linkedToBlocker && (
          <BarChart3 className="size-3 shrink-0 opacity-70" aria-hidden />
        )}
        {subtext}
      </span>
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
  const blockerText = attentionHeadline(row);
  const attentionContext = portfolioAttentionSnippet(row)?.context;
  const weekCutoff = daysAgoMs(7);
  const pulseOverdue = !row.lastCheckinAt || row.lastCheckinAt < weekCutoff;
  const action = primaryActionForVenture(row);

  const style = sortable
    ? {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }
    : undefined;

  return (
    <div
      ref={sortable?.setNodeRef}
      style={style}
      className={cn(
        ROW_GRID,
        "group rounded-lg bg-card py-5 transition-colors hover:bg-accent/20",
        sortable?.isDragging && "relative z-10 shadow-lg ring-1 ring-primary/20"
      )}
    >
      <div className="pl-1">
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
          <span className="flex size-7 items-center justify-center rounded-full bg-muted/60 text-[11px] font-medium tabular-nums text-muted-foreground">
            {rank}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <Link
            href={`/ventures/${row.venture.slug}`}
            className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            {row.venture.name}
          </Link>
          <span className="inline-flex items-center gap-1.5 text-[11px] leading-none text-muted-foreground/75">
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                pulseOverdue ? "bg-amber-400/90" : "bg-emerald-400/80"
              )}
              title={pulseOverdue ? "Pulse overdue" : "Pulse is fresh"}
            />
            {formatPulseRecency(row.lastCheckinAt)}
          </span>
          {!reorderMode && (
            <button
              type="button"
              onClick={() => openWeeklyCheckinForVenture(row.venture.id)}
              className={cn(
                "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium text-primary",
                "opacity-0 transition-opacity duration-150",
                "hover:bg-primary/[0.08] group-hover:opacity-100 max-sm:opacity-100",
                "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              title="Run a pulse for this venture"
            >
              <ClipboardList className="size-3" />
              Pulse
            </button>
          )}
        </div>
        <KpiInlineList kpis={row.kpiSnapshots} />
        <AttentionChips row={row} className="mt-2" max={2} />
        {blockerText && (
          <div className="blocker-note mt-2" title={attentionContext ?? undefined}>
            <OctagonAlert className="mt-0.5 size-3.5 shrink-0 text-red-400 dark:text-red-300/70" aria-hidden />
            <span className="line-clamp-2 min-w-0">
              {blockerText}
              {row.openBlockerCount > 1 && (
                <span className="opacity-60"> · +{row.openBlockerCount - 1} more</span>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-1.5 pt-0.5">
        <span
          className={cn(
            "tabular-nums text-[15px] font-semibold leading-none",
            row.netCents < 0 && "text-red-700 dark:text-red-400",
            row.netCents > 0 && "text-emerald-700 dark:text-emerald-400",
            row.netCents === 0 && "text-muted-foreground/70"
          )}
        >
          {formatCents(row.netCents)}
        </span>
        <MoneyTrendBadge netCents={row.netCents} netLastMonthCents={row.netLastMonthCents} />
      </div>

      <div>
        <TrajectoryBadge trajectory={row.trajectory} />
      </div>

      <div className="pr-1">
        <NextAction action={action} />
      </div>
    </div>
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

  const rowElements = rows.map((row, index) =>
    reorderMode ? (
      <SortableVentureRow key={row.venture.id} row={row} rank={index + 1} reorderMode />
    ) : (
      <VentureRow key={row.venture.id} row={row} rank={index + 1} reorderMode={false} />
    )
  );

  const legend = (
    <div
      className={cn(
        ROW_GRID,
        "border-b border-border/60 pb-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70"
      )}
    >
      <span aria-hidden />
      <span>Venture</span>
      <span className="whitespace-nowrap text-right">This month</span>
      <span>Momentum</span>
      <span className="pr-1">Next step</span>
    </div>
  );

  return (
    <div className={cn("space-y-1", pending && "opacity-70")}>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {reorderMode && (
          <p className="mr-auto text-xs text-muted-foreground">
            Drag ventures into priority order, then tap Done.
          </p>
        )}
        <Button
          type="button"
          variant={reorderMode ? "default" : "ghost"}
          size="sm"
          className={cn("gap-1.5", !reorderMode && "text-muted-foreground hover:text-foreground")}
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
              Reorder
            </>
          )}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          {legend}
          {reorderMode ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <div className="divide-y divide-border/40">{rowElements}</div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="divide-y divide-border/40">{rowElements}</div>
          )}
        </div>
      </div>
    </div>
  );
}
