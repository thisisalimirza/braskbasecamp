import { getDb, newId, nowMs } from "./db";
import { slugify } from "./format";

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
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export async function listVentures(status?: VentureStatus): Promise<Venture[]> {
  const db = await getDb();
  const res = status
    ? await db.execute({ sql: "SELECT * FROM ventures WHERE status = ? ORDER BY name", args: [status] })
    : await db.execute("SELECT * FROM ventures ORDER BY name");
  return res.rows.map((r) => rowToVenture(r as Record<string, unknown>));
}

export async function listActiveVentures(): Promise<Venture[]> {
  return listVentures("active");
}

export async function getVentureBySlug(slug: string): Promise<Venture | null> {
  const db = await getDb();
  const res = await db.execute({ sql: "SELECT * FROM ventures WHERE slug = ?", args: [slug] });
  if (res.rows.length === 0) return null;
  return rowToVenture(res.rows[0] as Record<string, unknown>);
}

export async function getVentureById(id: string): Promise<Venture | null> {
  const db = await getDb();
  const res = await db.execute({ sql: "SELECT * FROM ventures WHERE id = ?", args: [id] });
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
