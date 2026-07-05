export type PlanItemStatus = "backlog" | "next" | "doing" | "done";

export type PlanItem = {
  id: string;
  ventureId: string;
  title: string;
  notes: string | null;
  status: PlanItemStatus;
  blockerId: string | null;
  sortOrder: number;
  createdAt: number;
  completedAt: number | null;
};

export const PLAN_COLUMNS: { id: PlanItemStatus; label: string; hint: string }[] = [
  { id: "backlog", label: "Ideas", hint: "Captured but not committed" },
  { id: "next", label: "Up next", hint: "What you intend to do soon" },
  { id: "doing", label: "In progress", hint: "Actively working on this" },
  { id: "done", label: "Done", hint: "Completed — archive of what shipped" },
];

export type GlobalPlanItem = PlanItem & {
  ventureName: string;
  ventureSlug: string;
  blockerBody: string | null;
};

export function rowToPlanItem(row: Record<string, unknown>): PlanItem {
  return {
    id: String(row.id),
    ventureId: String(row.venture_id),
    title: String(row.title),
    notes: row.notes == null ? null : String(row.notes),
    status: String(row.status) as PlanItemStatus,
    blockerId: row.blocker_id == null ? null : String(row.blocker_id),
    sortOrder: Number(row.sort_order),
    createdAt: Number(row.created_at),
    completedAt: row.completed_at == null ? null : Number(row.completed_at),
  };
}
