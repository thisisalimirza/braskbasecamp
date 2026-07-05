"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  LayoutGrid,
  List,
  Plus,
  Star,
  Trash2,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createBlockerAction,
  createPlanItemAction,
  deletePlanItemAction,
  movePlanItemAction,
  resolveBlockerAction,
  setPrimaryBlockerAction,
} from "@/app/actions";
import { PLAN_COLUMNS, type PlanItem, type PlanItemStatus } from "@/lib/plan-types";
import type { VentureBlocker } from "@/lib/blocker-types";
import { planStatusLabel } from "@/lib/next-actions";
import { cn } from "@/lib/utils";

const NO_BLOCKER_VALUE = "none";

function planColumnLabel(status: PlanItemStatus): string {
  return PLAN_COLUMNS.find((c) => c.id === status)?.label ?? status;
}

function blockerSelectLabel(blockerId: string, blockers: VentureBlocker[]): string {
  if (!blockerId) return "No blocker link";
  const body = blockers.find((b) => b.id === blockerId)?.body;
  if (!body) return "No blocker link";
  return body.length > 56 ? `${body.slice(0, 56)}…` : body;
}

type ViewMode = "board" | "list";

export function VenturePlanPanel({
  ventureId,
  ventureSlug,
  blockers: initialBlockers,
  planItems: initialItems,
}: {
  ventureId: string;
  ventureSlug: string;
  blockers: VentureBlocker[];
  planItems: PlanItem[];
}) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("board");
  const [items, setItems] = useState(initialItems);
  const [blockers, setBlockers] = useState(initialBlockers);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newBlocker, setNewBlocker] = useState("");
  const [form, setForm] = useState({
    title: "",
    notes: "",
    status: "backlog" as PlanItemStatus,
    blockerId: "" as string,
  });

  const openBlockers = useMemo(() => blockers.filter((b) => b.status === "open"), [blockers]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    setItems(initialItems);
    setBlockers(initialBlockers);
  }, [initialItems, initialBlockers]);

  const refresh = () => router.refresh();

  const byStatus = (status: PlanItemStatus) =>
    items.filter((i) => i.status === status).sort((a, b) => a.sortOrder - b.sortOrder);

  const handleAddBlocker = async () => {
    if (!newBlocker.trim()) return;
    const res = await createBlockerAction({
      ventureId,
      body: newBlocker.trim(),
      makePrimary: openBlockers.length === 0,
      ventureSlug,
    });
    if (res.error) toast.error(res.error);
    else {
      toast.success("Blocker logged");
      setNewBlocker("");
      refresh();
    }
  };

  const handleSetPrimary = async (blockerId: string) => {
    const res = await setPrimaryBlockerAction(ventureId, blockerId, ventureSlug);
    if (res.error) toast.error(res.error);
    else {
      setBlockers((prev) =>
        prev.map((b) => ({ ...b, isPrimary: b.id === blockerId && b.status === "open" }))
      );
      toast.success("Primary blocker updated");
      refresh();
    }
  };

  const handleResolve = async (blockerId: string) => {
    const res = await resolveBlockerAction(blockerId, ventureSlug);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Blocker resolved");
      refresh();
    }
  };

  const handleCreateItem = async () => {
    if (!form.title.trim()) {
      toast.error("Give this step a title");
      return;
    }
    const res = await createPlanItemAction({
      ventureId,
      title: form.title.trim(),
      notes: form.notes.trim() || null,
      status: form.status,
      blockerId: form.blockerId || null,
      ventureSlug,
    });
    if (res.error) toast.error(res.error);
    else {
      toast.success("Step added");
      setForm({ title: "", notes: "", status: "backlog", blockerId: "" });
      setAddOpen(false);
      refresh();
    }
  };

  const handleMove = async (itemId: string, newStatus: PlanItemStatus) => {
    const item = items.find((i) => i.id === itemId);
    if (!item || item.status === newStatus) return;

    const targetCol = byStatus(newStatus);
    const sortOrder = targetCol.length;

    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status: newStatus, sortOrder } : i))
    );

    const res = await movePlanItemAction(itemId, newStatus, sortOrder, ventureSlug);
    if (res.error) {
      toast.error(res.error);
      setItems(initialItems);
    } else {
      refresh();
    }
  };

  const handleDelete = async (itemId: string) => {
    const res = await deletePlanItemAction(itemId, ventureSlug);
    if (res.error) toast.error(res.error);
    else {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success("Removed");
      refresh();
    }
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const itemId = String(active.id);
    const overId = String(over.id);
    const newStatus = PLAN_COLUMNS.some((c) => c.id === overId)
      ? (overId as PlanItemStatus)
      : items.find((i) => i.id === overId)?.status;

    if (newStatus) handleMove(itemId, newStatus);
  };

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  return (
    <div className="space-y-8">
      {/* Blockers */}
      <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-semibold">What&apos;s blocking</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Log every obstacle. Star the biggest one — it shows on your portfolio home.
            </p>
          </div>
          {openBlockers.length > 1 && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {openBlockers.length} open
            </span>
          )}
        </div>

        {openBlockers.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No open blockers. Add one below or mark a pulse as struggling.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {openBlockers.map((b) => (
              <li
                key={b.id}
                className={cn(
                  "flex flex-wrap items-start gap-2 rounded-xl border px-4 py-3 text-sm",
                  b.isPrimary
                    ? "border-red-200/90 bg-red-50/80 dark:border-red-900/50 dark:bg-red-950/30"
                    : "border-border/70 bg-muted/20"
                )}
              >
                {b.isPrimary && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-800 dark:bg-red-900/40 dark:text-red-200">
                    <Star className="size-3 fill-current" />
                    Primary
                  </span>
                )}
                <p className="min-w-0 flex-1 leading-relaxed">{b.body}</p>
                <div className="flex shrink-0 gap-1">
                  {!b.isPrimary && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleSetPrimary(b.id)}
                    >
                      Make primary
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs text-emerald-700"
                    onClick={() => handleResolve(b.id)}
                  >
                    <Check className="size-3.5" />
                    Resolved
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex gap-2">
          <Input
            placeholder="What's in the way? e.g. Paywall killed retention"
            value={newBlocker}
            onChange={(e) => setNewBlocker(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddBlocker()}
          />
          <Button type="button" variant="outline" className="shrink-0 gap-1" onClick={handleAddBlocker}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      </section>

      {/* Plan */}
      <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-semibold">Your plan</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ideate, queue, work, and ship — drag cards on the board or use the list.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border/70 p-0.5">
              <button
                type="button"
                onClick={() => setView("board")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium",
                  view === "board" ? "bg-background shadow-sm" : "text-muted-foreground"
                )}
              >
                <LayoutGrid className="size-3.5" />
                Board
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium",
                  view === "list" ? "bg-background shadow-sm" : "text-muted-foreground"
                )}
              >
                <List className="size-3.5" />
                List
              </button>
            </div>
            <Button type="button" size="sm" className="gap-1" onClick={() => {
              setForm({ title: "", notes: "", status: "backlog", blockerId: "" });
              setAddOpen(true);
            }}>
              <Plus className="size-4" />
              Add step
            </Button>
          </div>
        </div>

        {view === "board" ? (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
              {PLAN_COLUMNS.map((col) => (
                <PlanColumn
                  key={col.id}
                  column={col}
                  items={byStatus(col.id)}
                  blockers={openBlockers}
                  onDelete={handleDelete}
                  onMove={handleMove}
                />
              ))}
            </div>
            <DragOverlay>
              {activeItem && (
                <PlanCard item={activeItem} blockers={openBlockers} dragging />
              )}
            </DragOverlay>
          </DndContext>
        ) : (
          <PlanListView
            items={items.filter((i) => i.status !== "done")}
            doneItems={byStatus("done")}
            blockers={openBlockers}
            onMove={handleMove}
            onDelete={handleDelete}
          />
        )}
      </section>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add planned step</DialogTitle>
            <DialogDescription>
              Capture what you intend to do — link a blocker if this step unblocks something.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="plan-step-title" className="text-xs">
                Step title
              </Label>
              <Input
                id="plan-step-title"
                placeholder="e.g. Ship onboarding v2"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="plan-step-notes" className="text-xs">
                Notes <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="plan-step-notes"
                rows={2}
                placeholder="Context for future-you"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="plan-step-status" className="text-xs">
                Starting column
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) => v && setForm((f) => ({ ...f, status: v as PlanItemStatus }))}
              >
                <SelectTrigger id="plan-step-status" className="mt-1.5 w-full">
                  <SelectValue>{planColumnLabel(form.status)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PLAN_COLUMNS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-medium">{c.label}</span>
                      <span className="ml-2 text-muted-foreground">— {c.hint}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {openBlockers.length > 0 && (
              <div>
                <Label htmlFor="plan-step-blocker" className="text-xs">
                  Linked blocker <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Select
                  value={form.blockerId || NO_BLOCKER_VALUE}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      blockerId: !v || v === NO_BLOCKER_VALUE ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger id="plan-step-blocker" className="mt-1.5 w-full">
                    <SelectValue>
                      {blockerSelectLabel(form.blockerId, openBlockers)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_BLOCKER_VALUE}>No blocker link</SelectItem>
                    {openBlockers.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.body.length > 48 ? `${b.body.slice(0, 48)}…` : b.body}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateItem}>Add step</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlanColumn({
  column,
  items,
  blockers,
  onDelete,
  onMove,
}: {
  column: (typeof PLAN_COLUMNS)[number];
  items: PlanItem[];
  blockers: VentureBlocker[];
  onDelete: (id: string) => void;
  onMove: (id: string, status: PlanItemStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-w-[200px] flex-1 rounded-xl bg-muted/40 p-2 transition-colors",
        isOver && "ring-2 ring-primary/30"
      )}
    >
      <div className="mb-2 px-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {column.label}
        </p>
        <p className="text-[10px] text-muted-foreground/80">{column.hint}</p>
      </div>
      <div className="space-y-2 min-h-[100px]">
        {items.map((item) => (
          <DraggablePlanCard
            key={item.id}
            item={item}
            blockers={blockers}
            onDelete={onDelete}
            onMove={onMove}
          />
        ))}
      </div>
    </div>
  );
}

function DraggablePlanCard({
  item,
  blockers,
  onDelete,
  onMove,
}: {
  item: PlanItem;
  blockers: VentureBlocker[];
  onDelete: (id: string) => void;
  onMove: (id: string, status: PlanItemStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-40")}>
      <PlanCard
        item={item}
        blockers={blockers}
        dragHandleProps={{ ...attributes, ...listeners }}
        onDelete={onDelete}
        onMove={onMove}
      />
    </div>
  );
}

function PlanCard({
  item,
  blockers,
  dragging,
  dragHandleProps,
  onDelete,
  onMove,
}: {
  item: PlanItem;
  blockers: VentureBlocker[];
  dragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onDelete?: (id: string) => void;
  onMove?: (id: string, status: PlanItemStatus) => void;
}) {
  const linked = item.blockerId ? blockers.find((b) => b.id === item.blockerId) : null;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/80 bg-card p-3 shadow-sm",
        dragging && "shadow-lg ring-1 ring-primary/20",
        dragHandleProps && "cursor-grab active:cursor-grabbing"
      )}
      {...dragHandleProps}
    >
      <p className="text-sm font-medium leading-snug">{item.title}</p>
      {item.notes && (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {item.notes}
        </p>
      )}
      {linked && (
        <p className="mt-2 flex items-start gap-1 text-[11px] text-amber-800 dark:text-amber-300">
          <Link2 className="mt-0.5 size-3 shrink-0" />
          <span className="line-clamp-2">Unblocks: {linked.body}</span>
        </p>
      )}
      {onMove && onDelete && !dragHandleProps && (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.status !== "done" && (
            <>
              {item.status !== "doing" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => onMove(item.id, "doing")}
                >
                  Start
                </Button>
              )}
              {item.status !== "next" && item.status !== "doing" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => onMove(item.id, "next")}
                >
                  Queue next
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] text-emerald-700"
                onClick={() => onMove(item.id, "done")}
              >
                Done
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] text-muted-foreground"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

function PlanListView({
  items,
  doneItems,
  blockers,
  onMove,
  onDelete,
}: {
  items: PlanItem[];
  doneItems: PlanItem[];
  blockers: VentureBlocker[];
  onMove: (id: string, status: PlanItemStatus) => void;
  onDelete: (id: string) => void;
}) {
  if (items.length === 0 && doneItems.length === 0) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        No planned steps yet. Add your first idea — even a rough one keeps the plan visible.
      </p>
    );
  }

  return (
    <div className="mt-5 space-y-6">
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-border/70 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {planStatusLabel(item.status)}
                  </span>
                  <p className="font-medium">{item.title}</p>
                  {item.notes && (
                    <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p>
                  )}
                  {item.blockerId && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="size-3" />
                      {blockers.find((b) => b.id === item.blockerId)?.body ?? "Linked blocker"}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-1">
                  {item.status !== "doing" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => onMove(item.id, "doing")}
                    >
                      Start
                    </Button>
                  )}
                  {item.status !== "done" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs text-emerald-700"
                      onClick={() => onMove(item.id, "done")}
                    >
                      Done
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {doneItems.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recently done
          </p>
          <ul className="space-y-1">
            {doneItems.slice(0, 8).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-muted-foreground"
              >
                <span className="line-through">{item.title}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
