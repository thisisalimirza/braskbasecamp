import { getDb, newId, nowMs } from "./db";
import { requireUserId } from "./current-user";
import { assertVentureOwned, OWNED_VENTURES } from "./ownership";
import type { PlanItem, PlanItemStatus, GlobalPlanItem } from "./plan-types";
import { rowToPlanItem } from "./plan-types";
import { pickFocusPlanItem } from "./next-actions";
import { getHardWipLimitsEnabled } from "./settings";
import { evaluateWipLimits } from "./plan-wip";

export type { PlanItem, PlanItemStatus, GlobalPlanItem } from "./plan-types";
export { PLAN_COLUMNS, rowToPlanItem } from "./plan-types";

export async function listPlanItems(ventureId: string): Promise<PlanItem[]> {
  const userId = await requireUserId();
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT p.*, k.name AS kpi_name
          FROM venture_plan_items p
          LEFT JOIN kpi_definitions k ON k.id = p.kpi_definition_id
          WHERE p.venture_id = ? AND p.venture_id IN ${OWNED_VENTURES}
          ORDER BY CASE p.status
            WHEN 'doing' THEN 0 WHEN 'next' THEN 1 WHEN 'backlog' THEN 2 ELSE 3 END,
            p.sort_order ASC, p.created_at ASC`,
    args: [ventureId, userId],
  });
  return res.rows.map((r) => rowToPlanItem(r as Record<string, unknown>));
}

export async function getPlanItemById(id: string): Promise<PlanItem | null> {
  const userId = await requireUserId();
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT p.*, k.name AS kpi_name
          FROM venture_plan_items p
          LEFT JOIN kpi_definitions k ON k.id = p.kpi_definition_id
          WHERE p.id = ? AND p.venture_id IN ${OWNED_VENTURES}`,
    args: [id, userId],
  });
  if (res.rows.length === 0) return null;
  return rowToPlanItem(res.rows[0] as Record<string, unknown>);
}

export async function getFocusPlanItem(ventureId: string): Promise<PlanItem | null> {
  const items = await listPlanItems(ventureId);
  return pickFocusPlanItem(items);
}

export async function createPlanItem(input: {
  ventureId: string;
  title: string;
  notes?: string | null;
  status?: PlanItemStatus;
  blockerId?: string | null;
  kpiDefinitionId?: string | null;
}): Promise<PlanItem> {
  const userId = await requireUserId();
  const db = await getDb();
  await assertVentureOwned(db, input.ventureId, userId);
  const id = newId();
  const ts = nowMs();
  const status = input.status ?? "backlog";

  const countRes = await db.execute({
    sql: "SELECT COUNT(*) AS c FROM venture_plan_items WHERE venture_id = ? AND status = ?",
    args: [input.ventureId, status],
  });
  const sortOrder = Number((countRes.rows[0] as Record<string, unknown>).c);

  await db.execute({
    sql: `INSERT INTO venture_plan_items (id, venture_id, title, notes, status, blocker_id, kpi_definition_id, sort_order, created_at, status_changed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.ventureId,
      input.title.trim(),
      input.notes?.trim() || null,
      status,
      input.blockerId ?? null,
      input.kpiDefinitionId ?? null,
      sortOrder,
      ts,
      ts,
    ],
  });

  const created = await listPlanItems(input.ventureId);
  const item = created.find((i) => i.id === id);
  if (!item) throw new Error("Failed to create plan item");
  return item;
}

export async function updatePlanItem(
  id: string,
  input: Partial<{ title: string; notes: string | null; blockerId: string | null; kpiDefinitionId: string | null }>
): Promise<void> {
  const userId = await requireUserId();
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
  if (input.kpiDefinitionId !== undefined) {
    fields.push("kpi_definition_id = ?");
    args.push(input.kpiDefinitionId);
  }
  if (fields.length === 0) return;

  args.push(id, userId);
  await db.execute({
    sql: `UPDATE venture_plan_items SET ${fields.join(", ")} WHERE id = ? AND venture_id IN ${OWNED_VENTURES}`,
    args,
  });
}

export async function movePlanItem(id: string, status: PlanItemStatus, sortOrder: number): Promise<void> {
  const userId = await requireUserId();
  const current = await getPlanItemById(id);
  if (!current) throw new Error("Plan step not found");

  if (current.status !== status) {
    const hard = await getHardWipLimitsEnabled();
    const [ventureItems, portfolioDoing] = await Promise.all([
      listPlanItems(current.ventureId),
      countPortfolioDoingItems(),
    ]);
    const { allowed, message } = evaluateWipLimits({
      hard,
      ventureItems,
      portfolioDoing,
      movingItemId: id,
      currentStatus: current.status,
      targetStatus: status,
    });
    if (!allowed) throw new Error(message ?? "WIP limit reached");
  }

  const db = await getDb();
  const ts = nowMs();
  const completedAt = status === "done" ? ts : null;
  const statusChangedAt = current.status !== status ? ts : current.statusChangedAt;
  await db.execute({
    sql: `UPDATE venture_plan_items SET status = ?, sort_order = ?, completed_at = ?, status_changed_at = ?
          WHERE id = ? AND venture_id IN ${OWNED_VENTURES}`,
    args: [status, sortOrder, completedAt, statusChangedAt, id, userId],
  });
}

export async function deletePlanItem(id: string): Promise<void> {
  const userId = await requireUserId();
  const db = await getDb();
  await db.execute({
    sql: `DELETE FROM venture_plan_items WHERE id = ? AND venture_id IN ${OWNED_VENTURES}`,
    args: [id, userId],
  });
}

export async function listAllPlanItems(): Promise<GlobalPlanItem[]> {
  const userId = await requireUserId();
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT p.*, v.name AS venture_name, v.slug AS venture_slug,
                 b.body AS blocker_body, k.name AS kpi_name
          FROM venture_plan_items p
          INNER JOIN ventures v ON v.id = p.venture_id AND v.status = 'active' AND v.user_id = ?
          LEFT JOIN venture_blockers b ON b.id = p.blocker_id
          LEFT JOIN kpi_definitions k ON k.id = p.kpi_definition_id
          ORDER BY CASE p.status
            WHEN 'doing' THEN 0 WHEN 'next' THEN 1 WHEN 'backlog' THEN 2 ELSE 3 END,
            p.sort_order ASC, p.created_at ASC`,
    args: [userId],
  });

  return res.rows.map((row) => {
    const item = rowToPlanItem(row as Record<string, unknown>);
    const r = row as Record<string, unknown>;
    return {
      ...item,
      ventureName: String(r.venture_name),
      ventureSlug: String(r.venture_slug),
      blockerBody: r.blocker_body == null ? null : String(r.blocker_body),
    };
  });
}

export async function getUpcomingPlanItemsForVentures(
  ventureIds: string[]
): Promise<Map<string, PlanItem[]>> {
  const map = new Map<string, PlanItem[]>();
  if (ventureIds.length === 0) return map;
  for (const id of ventureIds) map.set(id, []);

  const userId = await requireUserId();
  const db = await getDb();
  const placeholders = ventureIds.map(() => "?").join(",");
  const res = await db.execute({
    sql: `SELECT p.*, k.name AS kpi_name
          FROM venture_plan_items p
          LEFT JOIN kpi_definitions k ON k.id = p.kpi_definition_id
          WHERE p.venture_id IN (${placeholders}) AND p.venture_id IN ${OWNED_VENTURES}
            AND p.status IN ('doing', 'next')
          ORDER BY venture_id,
            CASE p.status WHEN 'doing' THEN 0 ELSE 1 END,
            sort_order ASC,
            created_at ASC`,
    args: [...ventureIds, userId],
  });

  for (const row of res.rows) {
    const item = rowToPlanItem(row as Record<string, unknown>);
    map.get(item.ventureId)?.push(item);
  }
  return map;
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

/** Plan items marked done since a timestamp (portfolio-wide, active ventures). */
export async function listRecentlyDonePlanItems(sinceMs: number): Promise<GlobalPlanItem[]> {
  const userId = await requireUserId();
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT p.*, v.name AS venture_name, v.slug AS venture_slug,
                 b.body AS blocker_body, k.name AS kpi_name
          FROM venture_plan_items p
          INNER JOIN ventures v ON v.id = p.venture_id AND v.status = 'active' AND v.user_id = ?
          LEFT JOIN venture_blockers b ON b.id = p.blocker_id
          LEFT JOIN kpi_definitions k ON k.id = p.kpi_definition_id
          WHERE p.status = 'done' AND p.completed_at IS NOT NULL AND p.completed_at >= ?
          ORDER BY p.completed_at DESC`,
    args: [userId, sinceMs],
  });

  return res.rows.map((row) => {
    const item = rowToPlanItem(row as Record<string, unknown>);
    const r = row as Record<string, unknown>;
    return {
      ...item,
      ventureName: String(r.venture_name),
      ventureSlug: String(r.venture_slug),
      blockerBody: r.blocker_body == null ? null : String(r.blocker_body),
    };
  });
}

export async function countPortfolioDoingItems(): Promise<number> {
  const userId = await requireUserId();
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT COUNT(*) AS c FROM venture_plan_items p
          INNER JOIN ventures v ON v.id = p.venture_id AND v.status = 'active' AND v.user_id = ?
          WHERE p.status = 'doing'`,
    args: [userId],
  });
  return Number((res.rows[0] as Record<string, unknown>).c);
}
