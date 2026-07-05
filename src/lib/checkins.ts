import { getDb, newId, nowMs } from "./db";

export type Trajectory = "up" | "flat" | "down";

export type Checkin = {
  id: string;
  ventureId: string;
  checkedAt: number;
  trajectory: Trajectory;
  note: string | null;
  createdAt: number;
};

function rowToCheckin(row: Record<string, unknown>): Checkin {
  return {
    id: String(row.id),
    ventureId: String(row.venture_id),
    checkedAt: Number(row.checked_at),
    trajectory: String(row.trajectory) as Trajectory,
    note: row.note == null ? null : String(row.note),
    createdAt: Number(row.created_at),
  };
}

export async function getLatestCheckin(ventureId: string): Promise<Checkin | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT * FROM checkins WHERE venture_id = ? ORDER BY checked_at DESC LIMIT 1",
    args: [ventureId],
  });
  if (res.rows.length === 0) return null;
  return rowToCheckin(res.rows[0] as Record<string, unknown>);
}

export async function listCheckins(ventureId: string, limit = 20): Promise<Checkin[]> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT * FROM checkins WHERE venture_id = ? ORDER BY checked_at DESC LIMIT ?",
    args: [ventureId, limit],
  });
  return res.rows.map((r) => rowToCheckin(r as Record<string, unknown>));
}

export async function createCheckin(input: {
  ventureId: string;
  checkedAt: number;
  trajectory: Trajectory;
  note?: string | null;
}): Promise<string> {
  const db = await getDb();
  const id = newId();
  await db.execute({
    sql: "INSERT INTO checkins (id, venture_id, checked_at, trajectory, note, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [id, input.ventureId, input.checkedAt, input.trajectory, input.note ?? null, nowMs()],
  });
  return id;
}

export async function lastCheckinDate(ventureId: string): Promise<number | null> {
  const latest = await getLatestCheckin(ventureId);
  return latest?.checkedAt ?? null;
}
