"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import {
  Filter,
  LayoutGrid,
  Link2,
  List,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
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
  createPlanItemAction,
  deletePlanItemAction,
  movePlanItemAction,
  updatePlanItemAction,
} from "@/app/actions";
import { PLAN_COLUMNS, type GlobalPlanItem, type PlanItemStatus } from "@/lib/plan-types";
import type { VentureBlocker } from "@/lib/blocker-types";
import type { Venture } from "@/lib/ventures";
import { planStatusLabel } from "@/lib/next-actions";
import { cn } from "@/lib/utils";

const NO_BLOCKER = "none";
const ALL_VENTURES = "all";

type ViewMode = "board" | "list";

function columnLabel(status: PlanItemStatus): string {
  return PLAN_COLUMNS.find((c) => c.id === status)?.label ?? status;
}

export function GlobalTasksBoard({
  initialItems,
  ventures,
  blockersByVenture,
}: {
  initialItems: GlobalPlanItem[];
  ventures: Venture[];
  blockersByVenture: Record<string, VentureBlocker[]>;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [view, setView] = useState<ViewMode>("board");
  const [search, setSearch] = useState("");
  const [ventureFilter, setVentureFilter] = useState(ALL_VENTURES);
  const [statusFilter, setStatusFilter] = useState<PlanItemStatus | "active" | "all">("active");
  const [blockerOnly, setBlockerOnly] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<GlobalPlanItem | null>(null);
  const [addForm, setAddForm] = useState({
    ventureId: ventures[0]?.id ?? "",
    title: "",
    notes: "",
    status: "backlog" as PlanItemStatus,
    blockerId: "",
  });
  const [editForm, setEditForm] = useState({
    title: "",
    notes: "",
    blockerId: "",
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const refresh = () => router.refresh();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (ventureFilter !== ALL_VENTURES && item.ventureId !== ventureFilter) return false;
      if (statusFilter === "active" && item.status === "done") return false;
      if (statusFilter !== "all" && statusFilter !== "active" && item.status !== statusFilter) {
        return false;
      }
      if (blockerOnly && !item.blockerId) return false;
      if (!showDone && view === "board" && item.status === "done") return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q) ||
        item.ventureName.toLowerCase().includes(q) ||
        item.blockerBody?.toLowerCase().includes(q)
      );
    });
  }, [items, search, ventureFilter, statusFilter, blockerOnly, showDone, view]);

  const byStatus = (status: PlanItemStatus) =>
    filtered.filter((i) => i.status === status).sort((a, b) => a.sortOrder - b.sortOrder);

  const boardColumns = showDone ? PLAN_COLUMNS : PLAN_COLUMNS.filter((c) => c.id !== "done");

  const counts = useMemo(
    () => ({
      total: filtered.length,
      doing: filtered.filter((i) => i.status === "doing").length,
      next: filtered.filter((i) => i.status === "next").length,
      backlog: filtered.filter((i) => i.status === "backlog").length,
    }),
    [filtered]
  );

  const addVentureBlockers = blockersByVenture[addForm.ventureId] ?? [];
  const editVentureBlockers = editItem ? (blockersByVenture[editItem.ventureId] ?? []) : [];

  const handleMove = async (item: GlobalPlanItem, newStatus: PlanItemStatus) => {
    if (item.status === newStatus) return;
    const sortOrder = items.filter((i) => i.status === newStatus && i.ventureId === item.ventureId).length;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: newStatus, sortOrder } : i))
    );
    const res = await movePlanItemAction(item.id, newStatus, sortOrder, item.ventureSlug);
    if (res.error) {
      toast.error(res.error);
      setItems(initialItems);
    } else refresh();
  };

  const handleDelete = async (item: GlobalPlanItem) => {
    const res = await deletePlanItemAction(item.id, item.ventureSlug);
    if (res.error) toast.error(res.error);
    else {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setEditItem(null);
      toast.success("Task removed");
      refresh();
    }
  };

  const handleCreate = async () => {
    if (!addForm.ventureId) {
      toast.error("Pick a venture");
      return;
    }
    if (!addForm.title.trim()) {
      toast.error("Give the task a title");
      return;
    }
    const venture = ventures.find((v) => v.id === addForm.ventureId);
    const res = await createPlanItemAction({
      ventureId: addForm.ventureId,
      title: addForm.title.trim(),
      notes: addForm.notes.trim() || null,
      status: addForm.status,
      blockerId: addForm.blockerId || null,
      ventureSlug: venture?.slug,
    });
    if (res.error) toast.error(res.error);
    else {
      toast.success("Task added");
      setAddForm((f) => ({ ...f, title: "", notes: "", blockerId: "" }));
      setAddOpen(false);
      refresh();
    }
  };

  const openEdit = (item: GlobalPlanItem) => {
    setEditItem(item);
    setEditForm({
      title: item.title,
      notes: item.notes ?? "",
      blockerId: item.blockerId ?? "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editItem || !editForm.title.trim()) return;
    const res = await updatePlanItemAction(
      editItem.id,
      {
        title: editForm.title.trim(),
        notes: editForm.notes.trim() || null,
        blockerId: editForm.blockerId || null,
      },
      editItem.ventureSlug
    );
    if (res.error) toast.error(res.error);
    else {
      toast.success("Task updated");
      setEditItem(null);
      refresh();
    }
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const item = items.find((i) => i.id === String(active.id));
    if (!item) return;
    const overId = String(over.id);
    const newStatus = PLAN_COLUMNS.some((c) => c.id === overId)
      ? (overId as PlanItemStatus)
      : items.find((i) => i.id === overId)?.status;
    if (newStatus) handleMove(item, newStatus);
  };

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;
  const hasFilters =
    search.trim() !== "" ||
    ventureFilter !== ALL_VENTURES ||
    statusFilter !== "active" ||
    blockerOnly;

  const clearFilters = () => {
    setSearch("");
    setVentureFilter(ALL_VENTURES);
    setStatusFilter("active");
    setBlockerOnly(false);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks, ventures, blockers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={ventureFilter} onValueChange={(v) => v && setVentureFilter(v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue>{(v) => (v === ALL_VENTURES ? "All ventures" : ventures.find((x) => x.id === v)?.name ?? "Venture")}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VENTURES}>All ventures</SelectItem>
              {ventures.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => v && setStatusFilter(v as PlanItemStatus | "active" | "all")}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue>
                {(v) =>
                  v === "active" ? "Active" : v === "all" ? "All statuses" : columnLabel(v as PlanItemStatus)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active (not done)</SelectItem>
              <SelectItem value="all">All statuses</SelectItem>
              {PLAN_COLUMNS.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant={blockerOnly ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setBlockerOnly(!blockerOnly)}
          >
            <Link2 className="size-3.5" />
            Blocker-linked
          </Button>
          {view === "board" && (
            <Button
              type="button"
              variant={showDone ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDone(!showDone)}
            >
              Show done
            </Button>
          )}
          {hasFilters && (
            <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={clearFilters}>
              <X className="size-3.5" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{counts.total} tasks</span>
            <span>{counts.doing} in progress</span>
            <span>{counts.next} up next</span>
            <span>{counts.backlog} ideas</span>
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
            <Button type="button" size="sm" className="gap-1" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              Add task
            </Button>
          </div>
        </div>
      </div>

      {/* Board / List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 py-16 text-center">
          <Filter className="size-8 text-muted-foreground/50" />
          <p className="mt-3 font-medium">No tasks match</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters ? "Try clearing filters or add a new task." : "Add your first task to get planning."}
          </p>
          <Button type="button" className="mt-4 gap-1" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add task
          </Button>
        </div>
      ) : view === "board" ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4 min-h-[calc(100vh-280px)]">
            {boardColumns.map((col) => (
              <TaskColumn
                key={col.id}
                column={col}
                items={byStatus(col.id)}
                onEdit={openEdit}
                onMove={handleMove}
                onDelete={handleDelete}
              />
            ))}
          </div>
          <DragOverlay>
            {activeItem && <TaskCard item={activeItem} dragging />}
          </DragOverlay>
        </DndContext>
      ) : (
        <TaskListView items={filtered} onEdit={openEdit} onMove={handleMove} onDelete={handleDelete} />
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add task</DialogTitle>
            <DialogDescription>Create a step on any venture&apos;s plan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Venture</Label>
              <Select
                value={addForm.ventureId}
                onValueChange={(v) =>
                  v && setAddForm((f) => ({ ...f, ventureId: v, blockerId: "" }))
                }
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue>{(v) => ventures.find((x) => x.id === v)?.name ?? "Select venture"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ventures.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Title</Label>
              <Input
                className="mt-1.5"
                placeholder="What needs to happen?"
                value={addForm.title}
                onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                className="mt-1.5"
                rows={2}
                value={addForm.notes}
                onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs">Column</Label>
              <Select
                value={addForm.status}
                onValueChange={(v) => v && setAddForm((f) => ({ ...f, status: v as PlanItemStatus }))}
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue>{(v) => columnLabel((v as PlanItemStatus) ?? "backlog")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PLAN_COLUMNS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {addVentureBlockers.length > 0 && (
              <div>
                <Label className="text-xs">Linked blocker (optional)</Label>
                <Select
                  value={addForm.blockerId || NO_BLOCKER}
                  onValueChange={(v) =>
                    setAddForm((f) => ({ ...f, blockerId: !v || v === NO_BLOCKER ? "" : v }))
                  }
                >
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue>
                      {(v) => {
                        if (!v || v === NO_BLOCKER) return "None";
                        const b = addVentureBlockers.find((x) => x.id === v);
                        return b ? (b.body.length > 48 ? `${b.body.slice(0, 48)}…` : b.body) : "None";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_BLOCKER}>None</SelectItem>
                    {addVentureBlockers.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.body.length > 56 ? `${b.body.slice(0, 56)}…` : b.body}
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
            <Button onClick={handleCreate}>Add task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editItem != null} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="sm:max-w-md">
          {editItem && (
            <>
              <DialogHeader>
                <DialogTitle>Edit task</DialogTitle>
                <DialogDescription>
                  <Link
                    href={`/ventures/${editItem.ventureSlug}?tab=plan`}
                    className="text-primary hover:underline"
                  >
                    {editItem.ventureName}
                  </Link>
                  {" · "}
                  {planStatusLabel(editItem.status)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input
                    className="mt-1.5"
                    value={editForm.title}
                    onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Textarea
                    className="mt-1.5"
                    rows={3}
                    value={editForm.notes}
                    onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                {editVentureBlockers.length > 0 && (
                  <div>
                    <Label className="text-xs">Linked blocker</Label>
                    <Select
                      value={editForm.blockerId || NO_BLOCKER}
                      onValueChange={(v) =>
                        setEditForm((f) => ({ ...f, blockerId: !v || v === NO_BLOCKER ? "" : v }))
                      }
                    >
                      <SelectTrigger className="mt-1.5 w-full">
                        <SelectValue>
                          {(v) => {
                            if (!v || v === NO_BLOCKER) return "None";
                            const b = editVentureBlockers.find((x) => x.id === v);
                            return b ? (b.body.length > 48 ? `${b.body.slice(0, 48)}…` : b.body) : "None";
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_BLOCKER}>None</SelectItem>
                        {editVentureBlockers.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.body.length > 56 ? `${b.body.slice(0, 56)}…` : b.body}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {editItem.status !== "doing" && editItem.status !== "done" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleMove(editItem, "doing");
                        setEditItem(null);
                      }}
                    >
                      Start
                    </Button>
                  )}
                  {editItem.status !== "next" && editItem.status !== "done" && editItem.status !== "doing" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleMove(editItem, "next");
                        setEditItem(null);
                      }}
                    >
                      Queue next
                    </Button>
                  )}
                  {editItem.status !== "done" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-emerald-700"
                      onClick={() => {
                        handleMove(editItem, "done");
                        setEditItem(null);
                      }}
                    >
                      Mark done
                    </Button>
                  )}
                </div>
              </div>
              <DialogFooter className="gap-2 sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDelete(editItem)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditItem(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit}>Save</Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskColumn({
  column,
  items,
  onEdit,
  onMove,
  onDelete,
}: {
  column: (typeof PLAN_COLUMNS)[number];
  items: GlobalPlanItem[];
  onEdit: (item: GlobalPlanItem) => void;
  onMove: (item: GlobalPlanItem, status: PlanItemStatus) => void;
  onDelete: (item: GlobalPlanItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[280px] shrink-0 flex-col rounded-xl bg-muted/35",
        isOver && "ring-2 ring-primary/30"
      )}
    >
      <div className="sticky top-0 z-10 rounded-t-xl border-b border-border/40 bg-muted/50 px-3 py-2.5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {column.label}
          </p>
          <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
            {items.length}
          </span>
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground/80">{column.hint}</p>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2 min-h-[120px]">
        {items.map((item) => (
          <DraggableTaskCard
            key={item.id}
            item={item}
            onEdit={onEdit}
            onMove={onMove}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableTaskCard({
  item,
  onEdit,
}: {
  item: GlobalPlanItem;
  onEdit: (item: GlobalPlanItem) => void;
  onMove: (item: GlobalPlanItem, status: PlanItemStatus) => void;
  onDelete: (item: GlobalPlanItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-40")}>
      <TaskCard
        item={item}
        dragHandleProps={{ ...attributes, ...listeners }}
        onEdit={() => onEdit(item)}
      />
    </div>
  );
}

function TaskCard({
  item,
  dragging,
  dragHandleProps,
  onEdit,
}: {
  item: GlobalPlanItem;
  dragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onEdit?: () => void;
}) {
  return (
    <div
      className={cn(
        "group rounded-lg border border-border/80 bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        dragging && "shadow-lg ring-1 ring-primary/20",
        dragHandleProps && "cursor-grab active:cursor-grabbing"
      )}
      {...dragHandleProps}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/ventures/${item.ventureSlug}?tab=plan`}
          className="shrink-0 rounded-md bg-primary/[0.07] px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/12"
          onClick={(e) => e.stopPropagation()}
        >
          {item.ventureName}
        </Link>
      </div>
      <button
        type="button"
        className="mt-2 w-full text-left"
        onClick={onEdit}
        onPointerDown={(e) => dragHandleProps && e.stopPropagation()}
      >
        <p className="text-sm font-medium leading-snug text-foreground group-hover:text-primary">
          {item.title}
        </p>
        {item.notes && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.notes}</p>
        )}
      </button>
      {item.blockerBody && (
        <p className="mt-2 flex items-start gap-1 text-[11px] text-amber-800 dark:text-amber-300">
          <Link2 className="mt-0.5 size-3 shrink-0" />
          <span className="line-clamp-2">{item.blockerBody}</span>
        </p>
      )}
    </div>
  );
}

function TaskListView({
  items,
  onEdit,
  onMove,
  onDelete,
}: {
  items: GlobalPlanItem[];
  onEdit: (item: GlobalPlanItem) => void;
  onMove: (item: GlobalPlanItem, status: PlanItemStatus) => void;
  onDelete: (item: GlobalPlanItem) => void;
}) {
  const grouped = PLAN_COLUMNS.map((col) => ({
    ...col,
    items: items.filter((i) => i.status === col.id),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
      {grouped.map((group) => (
        <div key={group.id}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
            <span className="ml-2 font-normal tabular-nums">({group.items.length})</span>
          </h3>
          <ul className="space-y-2">
            {group.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border/70 p-3 hover:bg-muted/20"
              >
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onEdit(item)}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/ventures/${item.ventureSlug}?tab=plan`}
                      className="rounded-md bg-primary/[0.07] px-1.5 py-0.5 text-[10px] font-medium text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.ventureName}
                    </Link>
                    {item.blockerBody && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 dark:text-amber-300">
                        <Link2 className="size-3" />
                        Blocker-linked
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-medium">{item.title}</p>
                  {item.notes && <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p>}
                </button>
                <div className="flex shrink-0 flex-wrap gap-1">
                  {item.status !== "doing" && item.status !== "done" && (
                    <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => onMove(item, "doing")}>
                      Start
                    </Button>
                  )}
                  {item.status !== "done" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs text-emerald-700"
                      onClick={() => onMove(item, "done")}
                    >
                      Done
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => onDelete(item)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
