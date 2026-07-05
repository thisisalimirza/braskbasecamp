import { getDb, newId, nowMs } from "./db";
import { getLatestCheckin } from "./checkins";
import type { VentureBlocker } from "./blocker-types";
import { rowToBlocker } from "./blocker-types";

export type { VentureBlocker, BlockerStatus } from "./blocker-types";
export { rowToBlocker } from "./blocker-types";

export async function listBlockers(
  ventureId: string,
  opts?: { includeResolved?: boolean }
): Promise<VentureBlocker[]> {
  const db = await getDb();
  const sql = opts?.includeResolved
    ? "SELECT * FROM venture_blockers WHERE venture_id = ? ORDER BY status ASC, is_primary DESC, sort_order ASC, created_at DESC"
    : "SELECT * FROM venture_blockers WHERE venture_id = ? AND status = 'open' ORDER BY is_primary DESC, sort_order ASC, created_at DESC";
  const res = await db.execute({ sql, args: [ventureId] });
  return res.rows.map((r) => rowToBlocker(r as Record<string, unknown>));
}

export async function getPrimaryBlocker(ventureId: string): Promise<VentureBlocker | null> {
  await ensureBlockerFromLatestCheckin(ventureId);
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT * FROM venture_blockers WHERE venture_id = ? AND status = 'open' AND is_primary = 1 LIMIT 1",
    args: [ventureId],
  });
  if (res.rows.length > 0) return rowToBlocker(res.rows[0] as Record<string, unknown>);

  const fallback = await db.execute({
    sql: "SELECT * FROM venture_blockers WHERE venture_id = ? AND status = 'open' ORDER BY sort_order ASC, created_at DESC LIMIT 1",
    args: [ventureId],
  });
  if (fallback.rows.length === 0) return null;
  return rowToBlocker(fallback.rows[0] as Record<string, unknown>);
}

export async function countOpenBlockers(ventureId: string): Promise<number> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT COUNT(*) AS c FROM venture_blockers WHERE venture_id = ? AND status = 'open'",
    args: [ventureId],
  });
  return Number((res.rows[0] as Record<string, unknown>).c);
}

export async function createBlocker(input: {
  ventureId: string;
  body: string;
  makePrimary?: boolean;
  sourceCheckinId?: string | null;
}): Promise<VentureBlocker> {
  const db = await getDb();
  const id = newId();
  const ts = nowMs();
  const open = await listBlockers(input.ventureId);
  const sortOrder = open.length;
  const makePrimary = input.makePrimary ?? open.length === 0;

  if (makePrimary) {
    await db.execute({
      sql: "UPDATE venture_blockers SET is_primary = 0 WHERE venture_id = ? AND status = 'open'",
      args: [input.ventureId],
    });
  }

  await db.execute({
    sql: `INSERT INTO venture_blockers (id, venture_id, body, status, is_primary, source_checkin_id, created_at, sort_order)
          VALUES (?, ?, ?, 'open', ?, ?, ?, ?)`,
    args: [
      id,
      input.ventureId,
      input.body.trim(),
      makePrimary ? 1 : 0,
      input.sourceCheckinId ?? null,
      ts,
      sortOrder,
    ],
  });

  return {
    id,
    ventureId: input.ventureId,
    body: input.body.trim(),
    status: "open",
    isPrimary: makePrimary,
    sourceCheckinId: input.sourceCheckinId ?? null,
    createdAt: ts,
    resolvedAt: null,
    sortOrder,
  };
}

export async function updateBlocker(id: string, body: string): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE venture_blockers SET body = ? WHERE id = ?",
    args: [body.trim(), id],
  });
}

export async function setPrimaryBlocker(ventureId: string, blockerId: string): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE venture_blockers SET is_primary = 0 WHERE venture_id = ? AND status = 'open'",
    args: [ventureId],
  });
  await db.execute({
    sql: "UPDATE venture_blockers SET is_primary = 1 WHERE id = ? AND venture_id = ?",
    args: [blockerId, ventureId],
  });
}

export async function resolveBlocker(id: string): Promise<void> {
  const db = await getDb();
  const ts = nowMs();
  const row = await db.execute({ sql: "SELECT venture_id, is_primary FROM venture_blockers WHERE id = ?", args: [id] });
  if (row.rows.length === 0) return;
  const ventureId = String((row.rows[0] as Record<string, unknown>).venture_id);
  const wasPrimary = Number((row.rows[0] as Record<string, unknown>).is_primary) === 1;

  await db.execute({
    sql: "UPDATE venture_blockers SET status = 'resolved', resolved_at = ?, is_primary = 0 WHERE id = ?",
    args: [ts, id],
  });

  if (wasPrimary) {
    const next = await db.execute({
      sql: "SELECT id FROM venture_blockers WHERE venture_id = ? AND status = 'open' ORDER BY sort_order ASC, created_at DESC LIMIT 1",
      args: [ventureId],
    });
    if (next.rows.length > 0) {
      await setPrimaryBlocker(ventureId, String((next.rows[0] as Record<string, unknown>).id));
    }
  }
}

export async function ensureBlockerFromLatestCheckin(ventureId: string): Promise<void> {
  const open = await listBlockers(ventureId);
  if (open.length > 0) return;

  const latest = await getLatestCheckin(ventureId);
  if (!latest || latest.trajectory !== "down" || !latest.note?.trim()) return;

  await createBlocker({
    ventureId,
    body: latest.note.trim(),
    makePrimary: true,
    sourceCheckinId: latest.id,
  });
}

export async function createBlockerFromCheckin(input: {
  ventureId: string;
  checkinId: string;
  body: string;
  makePrimary?: boolean;
}): Promise<void> {
  const trimmed = input.body.trim();
  if (!trimmed) return;

  const open = await listBlockers(input.ventureId);
  const existing = open.find((b) => b.body === trimmed);
  if (existing) {
    if (input.makePrimary) await setPrimaryBlocker(input.ventureId, existing.id);
    return;
  }

  await createBlocker({
    ventureId: input.ventureId,
    body: trimmed,
    makePrimary: input.makePrimary ?? true,
    sourceCheckinId: input.checkinId,
  });
}

export async function getPrimaryBlockersForVentures(
  ventureIds: string[]
): Promise<Map<string, VentureBlocker | null>> {
  const map = new Map<string, VentureBlocker | null>();
  await Promise.all(
    ventureIds.map(async (id) => {
      map.set(id, await getPrimaryBlocker(id));
    })
  );
  return map;
}

export async function countOpenBlockersForVentures(
  ventureIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  await Promise.all(
    ventureIds.map(async (id) => {
      map.set(id, await countOpenBlockers(id));
    })
  );
  return map;
}
