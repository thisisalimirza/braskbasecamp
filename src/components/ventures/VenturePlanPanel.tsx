"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Check,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Star,
  Trash2,
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
  updateBlockerAction,
  updatePlanItemAction,
} from "@/app/actions";
import { PLAN_COLUMNS, type PlanItem, type PlanItemStatus } from "@/lib/plan-types";
import type { VentureBlocker } from "@/lib/blocker-types";
import type { KpiDefinition } from "@/lib/kpis";
import { PlanTaskLinks } from "@/components/plan/PlanKpiBadge";
import { PlanColumnHeader, PlanColumnEmptyHint } from "@/components/plan/PlanColumnHeader";
import { PlanKpiSelect } from "@/components/plan/PlanKpiSelect";
import { KpiDoneDialog } from "@/components/plan/KpiDoneDialog";
import { PlanItemFocusDialog } from "@/components/plan/PlanItemFocusDialog";
import { planStatusLabel } from "@/lib/next-actions";
import {
  countDoingItems,
  evaluateWipLimits,
  promoteFromBacklogRequiresIntent,
  stepAgingLabel,
} from "@/lib/plan-wip";
import { useAppSettings } from "@/components/AppSettingsProvider";
import { cn } from "@/lib/utils";

const NO_BLOCKER_VALUE = "none";

function planColumnLabel(status: PlanItemStatus): string {
  return PLAN_COLUMNS.find((c) => c.id === status)?.label ?? status;
}

type ViewMode = "board" | "list";

export function VenturePlanPanel({
  ventureId,
  ventureSlug,
  ventureName,
  blockers: initialBlockers,
  planItems: initialItems,
  kpis,
  portfolioDoingCount = 0,
}: {
  ventureId: string;
  ventureSlug: string;
  ventureName: string;
  blockers: VentureBlocker[];
  planItems: PlanItem[];
  kpis: KpiDefinition[];
  portfolioDoingCount?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");
  const { hardWipLimits } = useAppSettings();
  const [view, setView] = useState<ViewMode>("board");
  const [items, setItems] = useState(initialItems);
  const [blockers, setBlockers] = useState(initialBlockers);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<PlanItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    notes: "",
    blockerId: "",
    kpiDefinitionId: "",
  });
  const [editingBlockerId, setEditingBlockerId] = useState<string | null>(null);
  const [editingBlockerBody, setEditingBlockerBody] = useState("");
  const [kpiDoneItem, setKpiDoneItem] = useState<PlanItem | null>(null);
  const [focusOpen, setFocusOpen] = useState(false);
  const [newBlocker, setNewBlocker] = useState("");
  const [form, setForm] = useState({
    title: "",
    notes: "",
    status: "backlog" as PlanItemStatus,
    blockerId: "" as string,
    kpiDefinitionId: "" as string,
  });

  const openBlockers = useMemo(() => blockers.filter((b) => b.status === "open"), [blockers]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    setItems(initialItems);
    setBlockers(initialBlockers);
  }, [initialItems, initialBlockers]);

  useEffect(() => {
    if (focusId && initialItems.some((i) => i.id === focusId)) {
      setFocusOpen(true);
    }
  }, [focusId, initialItems]);

  const focusItem = focusId ? items.find((i) => i.id === focusId) ?? null : null;

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
      kpiDefinitionId: form.kpiDefinitionId || null,
      ventureSlug,
    });
    if (res.error) toast.error(res.error);
    else {
      toast.success("Step added");
      setForm({ title: "", notes: "", status: "backlog", blockerId: "", kpiDefinitionId: "" });
      setAddOpen(false);
      refresh();
    }
  };

  const handleMove = async (itemId: string, newStatus: PlanItemStatus) => {
    const item = items.find((i) => i.id === itemId);
    if (!item || item.status === newStatus) return;

    if (promoteFromBacklogRequiresIntent(item.status, newStatus)) {
      const ok = window.confirm(
        "Promote this idea to your committed plan? Only queue what you'll actually do this week."
      );
      if (!ok) return;
    }

    if (newStatus === "doing") {
      const { allowed, message } = evaluateWipLimits({
        hard: hardWipLimits,
        ventureItems: items,
        portfolioDoing: portfolioDoingCount || countDoingItems(items),
        movingItemId: itemId,
        currentStatus: item.status,
        targetStatus: newStatus,
      });
      if (!allowed) {
        toast.error(message ?? "WIP limit reached");
        return;
      }
      if (message) toast.message("Heads up", { description: message });
    }

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

  const handleMarkDone = (item: PlanItem) => {
    if (item.kpiDefinitionId && item.kpiName) {
      setKpiDoneItem(item);
      return;
    }
    void handleMove(item.id, "done");
  };

  const openEdit = (item: PlanItem) => {
    setEditItem(item);
    setEditForm({
      title: item.title,
      notes: item.notes ?? "",
      blockerId: item.blockerId ?? "",
      kpiDefinitionId: item.kpiDefinitionId ?? "",
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
        kpiDefinitionId: editForm.kpiDefinitionId || null,
      },
      ventureSlug
    );
    if (res.error) toast.error(res.error);
    else {
      toast.success("Step updated");
      setEditItem(null);
      refresh();
    }
  };

  const handleSaveBlockerEdit = async (blockerId: string) => {
    if (!editingBlockerBody.trim()) return;
    const res = await updateBlockerAction(blockerId, editingBlockerBody.trim(), ventureSlug);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Blocker updated");
      setEditingBlockerId(null);
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
            No blocker yet. Add one below or note what&apos;s in the way on your next pulse.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {openBlockers.map((b) => (
              <li
                key={b.id}
                className={cn(
                  "flex flex-wrap items-start gap-2 rounded-xl px-4 py-3 text-sm",
                  b.isPrimary
                    ? "bg-red-50/70 text-red-950/85 dark:bg-red-950/25 dark:text-red-200/90"
                    : "bg-muted/40"
                )}
              >
                {b.isPrimary && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-800/90 dark:bg-red-900/40 dark:text-red-200">
                    <Star className="size-3 fill-current" />
                    Primary
                  </span>
                )}
                <p className="min-w-0 flex-1 leading-relaxed">
                  {editingBlockerId === b.id ? (
                    <Input
                      value={editingBlockerBody}
                      onChange={(e) => setEditingBlockerBody(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveBlockerEdit(b.id)}
                      className="h-8"
                    />
                  ) : (
                    b.body
                  )}
                </p>
                <div className="flex shrink-0 gap-1">
                  {editingBlockerId === b.id ? (
                    <>
                      <Button type="button" size="sm" className="h-8 text-xs" onClick={() => handleSaveBlockerEdit(b.id)}>
                        Save
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setEditingBlockerId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        setEditingBlockerId(b.id);
                        setEditingBlockerBody(b.body);
                      }}
                    >
                      <Pencil className="size-3" />
                    </Button>
                  )}
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
              setForm({ title: "", notes: "", status: "backlog", blockerId: "", kpiDefinitionId: "" });
              setAddOpen(true);
            }}>
              <Plus className="size-4" />
              Add step
            </Button>
          </div>
        </div>

        {countDoingItems(items) >= 2 && (
          <p className="mt-3 rounded-lg bg-amber-50/80 px-3 py-2 text-xs text-amber-900/90 dark:bg-amber-950/25 dark:text-amber-200">
            {countDoingItems(items)} steps in progress here — finish one before starting more.
          </p>
        )}

        {items.filter((i) => i.status !== "done").length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border/80 px-4 py-8 text-center">
            <p className="font-medium">What&apos;s the smallest thing that moves this forward?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Name one minimum next step — not a wish list.
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-4 gap-1"
              onClick={() => {
                setForm({ title: "", notes: "", status: "next", blockerId: "", kpiDefinitionId: "" });
                setAddOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add minimum next step
            </Button>
          </div>
        ) : view === "board" ? (
          <DndContext id="venture-plan-board" sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {PLAN_COLUMNS.map((col) => (
                <PlanColumn
                  key={col.id}
                  column={col}
                  items={byStatus(col.id)}
                  blockers={openBlockers}
                  onDelete={handleDelete}
                  onMove={handleMove}
                  onDone={handleMarkDone}
                  onEdit={openEdit}
                  onAdd={() => {
                    setForm({ title: "", notes: "", status: col.id, blockerId: "", kpiDefinitionId: "" });
                    setAddOpen(true);
                  }}
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
            onDone={handleMarkDone}
            onEdit={openEdit}
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
                  <SelectValue>
                    {(value) => planColumnLabel((value as PlanItemStatus) ?? "backlog")}
                  </SelectValue>
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
                      {(value) => {
                        if (!value || value === NO_BLOCKER_VALUE) return "No blocker link";
                        const body = openBlockers.find((b) => b.id === value)?.body;
                        if (!body) return "No blocker link";
                        return body.length > 56 ? `${body.slice(0, 56)}…` : body;
                      }}
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
            <PlanKpiSelect
              id="plan-step-kpi"
              kpis={kpis}
              value={form.kpiDefinitionId}
              onChange={(kpiDefinitionId) => setForm((f) => ({ ...f, kpiDefinitionId }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateItem}>Add step</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editItem != null} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="sm:max-w-md">
          {editItem && (
            <>
              <DialogHeader>
                <DialogTitle>Edit step</DialogTitle>
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
                    rows={2}
                    value={editForm.notes}
                    onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
                {openBlockers.length > 0 && (
                  <div>
                    <Label className="text-xs">Linked blocker</Label>
                    <Select
                      value={editForm.blockerId || NO_BLOCKER_VALUE}
                      onValueChange={(v) =>
                        setEditForm((f) => ({
                          ...f,
                          blockerId: !v || v === NO_BLOCKER_VALUE ? "" : v,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1.5 w-full">
                        <SelectValue>{(v) => (!v || v === NO_BLOCKER_VALUE ? "None" : "Linked")}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_BLOCKER_VALUE}>None</SelectItem>
                        {openBlockers.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.body.length > 48 ? `${b.body.slice(0, 48)}…` : b.body}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <PlanKpiSelect
                  id="plan-edit-kpi"
                  kpis={kpis}
                  value={editForm.kpiDefinitionId}
                  onChange={(kpiDefinitionId) => setEditForm((f) => ({ ...f, kpiDefinitionId }))}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditItem(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>Save</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PlanItemFocusDialog
        open={focusOpen}
        onOpenChange={setFocusOpen}
        item={focusItem}
        ventureName={ventureName}
        ventureSlug={ventureSlug}
        blockerBody={
          focusItem?.blockerId
            ? openBlockers.find((b) => b.id === focusItem.blockerId)?.body ?? null
            : null
        }
      />

      {kpiDoneItem && kpiDoneItem.kpiDefinitionId && (
        <KpiDoneDialog
          open={kpiDoneItem != null}
          onOpenChange={(open) => !open && setKpiDoneItem(null)}
          kpiDefinitionId={kpiDoneItem.kpiDefinitionId}
          kpiName={kpiDoneItem.kpiName ?? "KPI"}
          kpiUnit={kpis.find((k) => k.id === kpiDoneItem.kpiDefinitionId)?.unit ?? null}
          ventureSlug={ventureSlug}
          itemId={kpiDoneItem.id}
          sortOrder={kpiDoneItem.sortOrder}
          onComplete={() => setKpiDoneItem(null)}
        />
      )}
    </div>
  );
}

function PlanColumn({
  column,
  items,
  blockers,
  onDelete,
  onMove,
  onDone,
  onEdit,
  onAdd,
}: {
  column: (typeof PLAN_COLUMNS)[number];
  items: PlanItem[];
  blockers: VentureBlocker[];
  onDelete: (id: string) => void;
  onMove: (id: string, status: PlanItemStatus) => void;
  onDone: (item: PlanItem) => void;
  onEdit: (item: PlanItem) => void;
  onAdd?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl bg-muted/35 transition-colors",
        isOver && "bg-accent/40 ring-2 ring-primary/20"
      )}
    >
      <PlanColumnHeader column={column} count={items.length} onAdd={onAdd} />
      <div className="flex min-h-[150px] flex-1 flex-col gap-2 p-2.5 pt-0">
        {items.length === 0 ? (
          <PlanColumnEmptyHint column={column} />
        ) : (
          items.map((item) => (
            <DraggablePlanCard
              key={item.id}
              item={item}
              blockers={blockers}
              onDelete={onDelete}
              onMove={onMove}
              onDone={onDone}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DraggablePlanCard({
  item,
  blockers,
  onDelete,
  onMove,
  onDone,
  onEdit,
}: {
  item: PlanItem;
  blockers: VentureBlocker[];
  onDelete: (id: string) => void;
  onMove: (id: string, status: PlanItemStatus) => void;
  onDone: (item: PlanItem) => void;
  onEdit: (item: PlanItem) => void;
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
        onDone={onDone}
        onEdit={onEdit}
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
  onDone,
  onEdit,
}: {
  item: PlanItem;
  blockers: VentureBlocker[];
  dragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onDelete?: (id: string) => void;
  onMove?: (id: string, status: PlanItemStatus) => void;
  onDone?: (item: PlanItem) => void;
  onEdit?: (item: PlanItem) => void;
}) {
  const linked = item.blockerId ? blockers.find((b) => b.id === item.blockerId) : null;
  const aging = stepAgingLabel(item);

  return (
    <div
      className={cn(
        "group rounded-xl border border-border/70 bg-card p-3.5 shadow-sm transition-all duration-150 hover:border-primary/25 hover:shadow-md",
        dragging && "shadow-lg ring-1 ring-primary/20"
      )}
    >
      <div className={cn(dragHandleProps && "cursor-grab active:cursor-grabbing")} {...dragHandleProps}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug">{item.title}</p>
          {aging && <span className="shrink-0 text-[10px] text-amber-800/90 dark:text-amber-300/90">{aging}</span>}
        </div>
        {item.notes && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {item.notes}
          </p>
        )}
      </div>
      <PlanTaskLinks
        className="mt-2"
        kpiName={item.kpiName}
        blockerBody={linked?.body ?? null}
      />
      {onMove && onDelete && (
        <div
          className="mt-2 flex flex-wrap gap-1 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <Button type="button" variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => onEdit(item)}>
              <Pencil className="size-3" />
            </Button>
          )}
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
                onClick={() => onDone?.(item)}
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
  onDone,
  onEdit,
}: {
  items: PlanItem[];
  doneItems: PlanItem[];
  blockers: VentureBlocker[];
  onMove: (id: string, status: PlanItemStatus) => void;
  onDelete: (id: string) => void;
  onDone: (item: PlanItem) => void;
  onEdit: (item: PlanItem) => void;
}) {
  if (items.length === 0 && doneItems.length === 0) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        What&apos;s the smallest thing that moves this forward? Add one minimum next step — not a wish list.
      </p>
    );
  }

  return (
    <div className="mt-5 space-y-6">
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl bg-muted/35 p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {planStatusLabel(item.status)}
                  </span>
                  <p className="font-medium">{item.title}</p>
                  {item.notes && (
                    <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p>
                  )}
                  <PlanTaskLinks
                    className="mt-2"
                    kpiName={item.kpiName}
                    blockerBody={
                      item.blockerId
                        ? blockers.find((b) => b.id === item.blockerId)?.body ?? null
                        : null
                    }
                  />
                </div>
                <div className="flex shrink-0 flex-wrap gap-1">
                  <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => onEdit(item)}>
                    <Pencil className="size-3.5" />
                  </Button>
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
                      onClick={() => onDone(item)}
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
