import { getDb, newId, nowMs } from "./db";
import type { PlanItem, PlanItemStatus } from "./plan-types";
import { rowToPlanItem } from "./plan-types";

export type { PlanItem, PlanItemStatus } from "./plan-types";
export { PLAN_COLUMNS, rowToPlanItem } from "./plan-types";

export async function listPlanItems(ventureId: string): Promise<PlanItem[]> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT * FROM venture_plan_items WHERE venture_id = ?
          ORDER BY CASE status
            WHEN 'doing' THEN 0 WHEN 'next' THEN 1 WHEN 'backlog' THEN 2 ELSE 3 END,
            sort_order ASC, created_at ASC`,
    args: [ventureId],
  });
  return res.rows.map((r) => rowToPlanItem(r as Record<string, unknown>));
}

export async function getFocusPlanItem(ventureId: string): Promise<PlanItem | null> {
  const items = await listPlanItems(ventureId);
  return items.find((i) => i.status === "doing") ?? items.find((i) => i.status === "next") ?? null;
}

export async function createPlanItem(input: {
  ventureId: string;
  title: string;
  notes?: string | null;
  status?: PlanItemStatus;
  blockerId?: string | null;
}): Promise<PlanItem> {
  const db = await getDb();
  const id = newId();
  const ts = nowMs();
  const status = input.status ?? "backlog";

  const countRes = await db.execute({
    sql: "SELECT COUNT(*) AS c FROM venture_plan_items WHERE venture_id = ? AND status = ?",
    args: [input.ventureId, status],
  });
  const sortOrder = Number((countRes.rows[0] as Record<string, unknown>).c);

  await db.execute({
    sql: `INSERT INTO venture_plan_items (id, venture_id, title, notes, status, blocker_id, sort_order, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.ventureId,
      input.title.trim(),
      input.notes?.trim() || null,
      status,
      input.blockerId ?? null,
      sortOrder,
      ts,
    ],
  });

  return {
    id,
    ventureId: input.ventureId,
    title: input.title.trim(),
    notes: input.notes?.trim() || null,
    status,
    blockerId: input.blockerId ?? null,
    sortOrder,
    createdAt: ts,
    completedAt: null,
  };
}

export async function updatePlanItem(
  id: string,
  input: Partial<{ title: string; notes: string | null; blockerId: string | null }>
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const args: (string | number | null)[] = [];

  if (input.title != null) {
    fields.push("title = ?");
    args.push(input.title.trim());
  }
  if (input.notes !== undefined) {
    fields.push("notes = ?");
    args.push(input.notes?.trim() || null);
  }
  if (input.blockerId !== undefined) {
    fields.push("blocker_id = ?");
    args.push(input.blockerId);
  }
  if (fields.length === 0) return;

  args.push(id);
  await db.execute({
    sql: `UPDATE venture_plan_items SET ${fields.join(", ")} WHERE id = ?`,
    args,
  });
}

export async function movePlanItem(id: string, status: PlanItemStatus, sortOrder: number): Promise<void> {
  const db = await getDb();
  const ts = nowMs();
  const completedAt = status === "done" ? ts : null;
  await db.execute({
    sql: "UPDATE venture_plan_items SET status = ?, sort_order = ?, completed_at = ? WHERE id = ?",
    args: [status, sortOrder, completedAt, id],
  });
}

export async function deletePlanItem(id: string): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM venture_plan_items WHERE id = ?", args: [id] });
}

export async function getFocusPlanItemsForVentures(
  ventureIds: string[]
): Promise<Map<string, PlanItem | null>> {
  const map = new Map<string, PlanItem | null>();
  await Promise.all(
    ventureIds.map(async (id) => {
      map.set(id, await getFocusPlanItem(id));
    })
  );
  return map;
}
