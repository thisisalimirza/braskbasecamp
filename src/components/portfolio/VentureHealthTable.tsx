"use client";

import { useEffect, useState, useTransition, type ComponentProps } from "react";
import Link from "next/link";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  GripVertical,
  ArrowRight,
  CircleDollarSign,
  ClipboardList,
  Lock,
  Pencil,
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
import { TRAJECTORY_LABELS, primaryActionForVenture, type VentureAction } from "@/lib/next-actions";
import {
  openWeeklyCheckin,
  openWeeklyCheckinForVenture,
  openRecordMoneyPrefilled,
} from "@/components/AppShell";
import { reorderVenturesPriorityAction } from "@/app/actions";
import type { VentureHealth } from "@/lib/venture-health";
import { attentionHeadline, portfolioAttentionSnippet } from "@/lib/venture-display";
import { MoneyTrendBadge } from "@/components/portfolio/MoneyTrendBadge";
import { VentureQuickNoteDialog } from "@/components/portfolio/VentureQuickNoteDialog";
import { cn } from "@/lib/utils";

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

function relativeDays(ms: number | null): string | null {
  if (!ms) return null;
  const days = Math.floor((Date.now() - ms) / (24 * 60 * 60 * 1000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function StatusChip({
  label,
  missing,
  onClick,
}: {
  label: string;
  missing?: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    "inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[11px] font-medium leading-tight",
    missing
      ? "border border-amber-300/90 bg-amber-100 text-amber-950 hover:bg-amber-200/90 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100"
      : "bg-muted/60 text-muted-foreground"
  );

  if (missing && onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(className, "cursor-pointer text-left")}>
        {label}
      </button>
    );
  }

  return <span className={className}>{label}</span>;
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
          action.ventureId ? openWeeklyCheckinForVenture(action.ventureId) : openWeeklyCheckin()
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
          "dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
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

  if (action.type === "view_plan" && action.ventureSlug) {
    return (
      <Link
        href={`/ventures/${action.ventureSlug}?tab=plan`}
        className={cn(
          pillClass,
          "border border-primary/20 bg-primary/[0.06] text-primary hover:border-primary/35 hover:bg-primary/10"
        )}
        title={action.hint}
      >
        {action.label}
        <ArrowRight className="size-3.5 shrink-0 opacity-50" />
      </Link>
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

function VentureRow({
  row,
  cutoff,
  rank,
  reorderMode,
  onLogNote,
  sortable,
}: {
  row: VentureHealth;
  cutoff: number;
  rank: number;
  reorderMode: boolean;
  onLogNote: (row: VentureHealth, context: "pulse" | "money") => void;
  sortable?: {
    attributes: ReturnType<typeof useSortable>["attributes"];
    listeners: ReturnType<typeof useSortable>["listeners"];
    setNodeRef: ReturnType<typeof useSortable>["setNodeRef"];
    transform: ReturnType<typeof useSortable>["transform"];
    transition: ReturnType<typeof useSortable>["transition"];
    isDragging: boolean;
  };
}) {
  const needsAttention = row.reasons.length > 0;
  const action = primaryActionForVenture(row);
  const blockerText = attentionHeadline(row);
  const attentionContext = portfolioAttentionSnippet(row)?.context;
  const pulseMissing = !row.lastCheckinAt || row.lastCheckinAt < cutoff;
  const moneyMissing = !row.lastPnlAt || row.lastPnlAt < cutoff;
  const pulseLabel = relativeDays(row.lastCheckinAt);
  const moneyLabel = relativeDays(row.lastPnlAt);

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
        {row.focusPlanItem && (
          <Link
            href={`/ventures/${row.venture.slug}?tab=plan`}
            className="mt-1 block text-xs text-muted-foreground hover:text-primary"
          >
            Next: {row.focusPlanItem.title} →
          </Link>
        )}
        {!blockerText && pulseMissing && (
          <button
            type="button"
            className="mt-1 text-xs text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
            onClick={() => onLogNote(row, "pulse")}
          >
            Log what&apos;s happening →
          </button>
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
          <StatusChip
            label="No pulse yet"
            missing
            onClick={() => onLogNote(row, "pulse")}
          />
        )}
      </td>
      <td className="py-4 pr-4 align-middle">
        <div className="flex flex-col gap-1.5">
          <StatusChip
            label={pulseLabel ? `Pulse · ${pulseLabel}` : "Pulse · not yet"}
            missing={pulseMissing}
            onClick={pulseMissing ? () => onLogNote(row, "pulse") : undefined}
          />
          <StatusChip
            label={moneyLabel ? `Money · ${moneyLabel}` : "Money · not logged yet"}
            missing={moneyMissing}
            onClick={
              moneyMissing
                ? () => onLogNote(row, "money")
                : undefined
            }
          />
        </div>
      </td>
      <td className="w-[148px] py-4 pr-3 align-middle">
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
  const cutoff = daysAgoMs(14);
  const [rows, setRows] = useState(summaries);
  const [reorderMode, setReorderMode] = useState(false);
  const [pending, startTransition] = useTransition();
  const [noteTarget, setNoteTarget] = useState<{
    row: VentureHealth;
    context: "pulse" | "money";
  } | null>(null);

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
            cutoff={cutoff}
            rank={index + 1}
            reorderMode
            onLogNote={(r, ctx) => setNoteTarget({ row: r, context: ctx })}
          />
        ) : (
          <VentureRow
            key={row.venture.id}
            row={row}
            cutoff={cutoff}
            rank={index + 1}
            reorderMode={false}
            onLogNote={(r, ctx) => setNoteTarget({ row: r, context: ctx })}
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
            : "Tap amber chips to log what's happening. Next step is your main action."}
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
                  <th className="pb-3 pr-4">Status</th>
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
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-3 text-right">Next step</th>
              </tr>
            </thead>
            {tableBody}
          </table>
        )}
      </div>

      {noteTarget && (
        <VentureQuickNoteDialog
          open
          onOpenChange={(open) => !open && setNoteTarget(null)}
          ventureId={noteTarget.row.venture.id}
          ventureName={noteTarget.row.venture.name}
          ventureSlug={noteTarget.row.venture.slug}
          defaultTrajectory={noteTarget.row.trajectory ?? "flat"}
          title={
            noteTarget.context === "money"
              ? `Why no money logged · ${noteTarget.row.venture.name}`
              : `Log update · ${noteTarget.row.venture.name}`
          }
          description={
            noteTarget.context === "money"
              ? "Explain the situation — waiting on revenue, not tracking yet, paused spend, etc. This saves as your venture pulse note."
              : "Capture what's happening or what's blocking. Shows on your portfolio and venture page."
          }
        />
      )}
    </div>
  );
}
