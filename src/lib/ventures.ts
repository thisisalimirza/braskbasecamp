import { getDb, newId, nowMs } from "./db";
import { slugify } from "./format";
import type { Client } from "@libsql/client";

export type VentureType = "product" | "service" | "media" | "other";
export type VentureStatus = "active" | "paused" | "closed";

export type Venture = {
  id: string;
  name: string;
  slug: string;
  ventureType: VentureType;
  status: VentureStatus;
  oneLiner: string | null;
  startedAt: number | null;
  endedAt: number | null;
  priorityOrder: number;
  createdAt: number;
  updatedAt: number;
};

function rowToVenture(row: Record<string, unknown>): Venture {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    ventureType: String(row.venture_type) as VentureType,
    status: String(row.status) as VentureStatus,
    oneLiner: row.one_liner == null ? null : String(row.one_liner),
    startedAt: row.started_at == null ? null : Number(row.started_at),
    endedAt: row.ended_at == null ? null : Number(row.ended_at),
    priorityOrder: Number(row.priority_order ?? 999999),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

const VENTURE_SELECT = `
  SELECT v.*, COALESCE(p.priority_order, 999999) AS priority_order
  FROM ventures v
  LEFT JOIN venture_priorities p ON p.venture_id = v.id
`;

async function backfillMissingPriorities(db: Client, ventureIds: string[]): Promise<void> {
  if (ventureIds.length === 0) return;

  const existing = await db.execute("SELECT venture_id FROM venture_priorities");
  const have = new Set(existing.rows.map((r) => String(r.venture_id)));
  const missing = ventureIds.filter((id) => !have.has(id));
  if (missing.length === 0) return;

  const maxRes = await db.execute("SELECT COALESCE(MAX(priority_order), -1) AS m FROM venture_priorities");
  let next = Number(maxRes.rows[0]?.m ?? -1) + 1;

  for (const id of missing) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO venture_priorities (venture_id, priority_order) VALUES (?, ?)",
      args: [id, next++],
    });
  }
}

async function nextPriorityOrder(db: Client): Promise<number> {
  const res = await db.execute("SELECT COALESCE(MAX(priority_order), -1) + 1 AS next FROM venture_priorities");
  return Number(res.rows[0]?.next ?? 0);
}

export async function listVentures(status?: VentureStatus): Promise<Venture[]> {
  const db = await getDb();
  const res = status
    ? await db.execute({
        sql: `${VENTURE_SELECT} WHERE v.status = ? ORDER BY priority_order ASC, v.name ASC`,
        args: [status],
      })
    : await db.execute(`${VENTURE_SELECT} ORDER BY priority_order ASC, v.name ASC`);

  const ventures = res.rows.map((r) => rowToVenture(r as Record<string, unknown>));
  await backfillMissingPriorities(
    db,
    ventures.map((v) => v.id)
  );

  if (ventures.some((v) => v.priorityOrder >= 999999)) {
    const refreshed = status
      ? await db.execute({
          sql: `${VENTURE_SELECT} WHERE v.status = ? ORDER BY priority_order ASC, v.name ASC`,
          args: [status],
        })
      : await db.execute(`${VENTURE_SELECT} ORDER BY priority_order ASC, v.name ASC`);
    return refreshed.rows.map((r) => rowToVenture(r as Record<string, unknown>));
  }

  return ventures;
}

export async function listActiveVentures(): Promise<Venture[]> {
  return listVentures("active");
}

export async function getVentureBySlug(slug: string): Promise<Venture | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: `${VENTURE_SELECT} WHERE v.slug = ?`,
    args: [slug],
  });
  if (res.rows.length === 0) return null;
  return rowToVenture(res.rows[0] as Record<string, unknown>);
}

export async function getVentureById(id: string): Promise<Venture | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: `${VENTURE_SELECT} WHERE v.id = ?`,
    args: [id],
  });
  if (res.rows.length === 0) return null;
  return rowToVenture(res.rows[0] as Record<string, unknown>);
}

export async function createVenture(input: {
  name: string;
  ventureType: VentureType;
  oneLiner?: string;
  status?: VentureStatus;
  slug?: string;
}): Promise<Venture> {
  const db = await getDb();
  const id = newId();
  const now = nowMs();
  let slug = input.slug ?? slugify(input.name);
  const existing = await db.execute({ sql: "SELECT id FROM ventures WHERE slug = ?", args: [slug] });
  if (existing.rows.length > 0) slug = `${slug}-${id.slice(0, 6)}`;

  await db.execute({
    sql: `INSERT INTO ventures (id, name, slug, venture_type, status, one_liner, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.name,
      slug,
      input.ventureType,
      input.status ?? "active",
      input.oneLiner ?? null,
      now,
      now,
    ],
  });

  const priority = await nextPriorityOrder(db);
  await db.execute({
    sql: "INSERT INTO venture_priorities (venture_id, priority_order) VALUES (?, ?)",
    args: [id, priority],
  });

  const v = await getVentureById(id);
  if (!v) throw new Error("Failed to create venture");
  return v;
}

export async function updateVenture(
  id: string,
  input: Partial<{
    name: string;
    ventureType: VentureType;
    status: VentureStatus;
    oneLiner: string | null;
  }>
): Promise<void> {
  const db = await getDb();
  const current = await getVentureById(id);
  if (!current) throw new Error("Venture not found");

  await db.execute({
    sql: `UPDATE ventures SET name = ?, venture_type = ?, status = ?, one_liner = ?, updated_at = ? WHERE id = ?`,
    args: [
      input.name ?? current.name,
      input.ventureType ?? current.ventureType,
      input.status ?? current.status,
      input.oneLiner !== undefined ? input.oneLiner : current.oneLiner,
      nowMs(),
      id,
    ],
  });
}

/** Persist venture display priority (index 0 = highest priority). */
export async function reorderVentures(orderedIds: string[]): Promise<void> {
  const db = await getDb();
  for (let i = 0; i < orderedIds.length; i++) {
    await db.execute({
      sql: `INSERT INTO venture_priorities (venture_id, priority_order) VALUES (?, ?)
            ON CONFLICT(venture_id) DO UPDATE SET priority_order = excluded.priority_order`,
      args: [orderedIds[i], i],
    });
  }
}
