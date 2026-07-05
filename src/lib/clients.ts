import { getDb, newId, nowMs } from "./db";

export type ClientStage = "lead" | "proposal" | "active" | "completed" | "lost";

export type Client = {
  id: string;
  name: string;
  stage: ClientStage;
  estimatedValueCents: number | null;
  contactInfo: string | null;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
  lifetimeRevenueCents?: number;
};

function rowToClient(row: Record<string, unknown>): Client {
  return {
    id: String(row.id),
    name: String(row.name),
    stage: String(row.stage) as ClientStage,
    estimatedValueCents: row.estimated_value_cents == null ? null : Number(row.estimated_value_cents),
    contactInfo: row.contact_info == null ? null : String(row.contact_info),
    notes: row.notes == null ? null : String(row.notes),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    lifetimeRevenueCents:
      row.lifetime_revenue_cents == null ? undefined : Number(row.lifetime_revenue_cents),
  };
}

export async function listClients(): Promise<Client[]> {
  const db = await getDb();
  const res = await db.execute(`
    SELECT c.*,
      COALESCE(SUM(CASE WHEN p.entry_type = 'revenue' THEN p.amount_cents ELSE 0 END), 0) AS lifetime_revenue_cents
    FROM clients c
    LEFT JOIN pnl_entries p ON p.client_id = c.id
    GROUP BY c.id
    ORDER BY c.name
  `);
  return res.rows.map((r) => rowToClient(r as Record<string, unknown>));
}

export async function listClientsByStage(stage: ClientStage): Promise<Client[]> {
  const all = await listClients();
  return all.filter((c) => c.stage === stage);
}

export async function getClient(id: string): Promise<Client | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT c.*,
      COALESCE(SUM(CASE WHEN p.entry_type = 'revenue' THEN p.amount_cents ELSE 0 END), 0) AS lifetime_revenue_cents
    FROM clients c
    LEFT JOIN pnl_entries p ON p.client_id = c.id
    WHERE c.id = ?
    GROUP BY c.id`,
    args: [id],
  });
  if (res.rows.length === 0) return null;
  return rowToClient(res.rows[0] as Record<string, unknown>);
}

export async function createClient(input: {
  name: string;
  stage?: ClientStage;
  estimatedValueCents?: number | null;
  contactInfo?: string | null;
  notes?: string | null;
}): Promise<Client> {
  const db = await getDb();
  const id = newId();
  const now = nowMs();
  await db.execute({
    sql: `INSERT INTO clients (id, name, stage, estimated_value_cents, contact_info, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.name,
      input.stage ?? "lead",
      input.estimatedValueCents ?? null,
      input.contactInfo ?? null,
      input.notes ?? null,
      now,
      now,
    ],
  });
  const client = await getClient(id);
  if (!client) throw new Error("Failed to create client");
  return client;
}

export async function updateClientStage(id: string, stage: ClientStage): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE clients SET stage = ?, updated_at = ? WHERE id = ?",
    args: [stage, nowMs(), id],
  });
}

export async function updateClient(
  id: string,
  input: Partial<{
    name: string;
    stage: ClientStage;
    estimatedValueCents: number | null;
    contactInfo: string | null;
    notes: string | null;
  }>
): Promise<void> {
  const db = await getDb();
  const current = await getClient(id);
  if (!current) throw new Error("Client not found");
  await db.execute({
    sql: `UPDATE clients SET name = ?, stage = ?, estimated_value_cents = ?, contact_info = ?, notes = ?, updated_at = ? WHERE id = ?`,
    args: [
      input.name ?? current.name,
      input.stage ?? current.stage,
      input.estimatedValueCents !== undefined ? input.estimatedValueCents : current.estimatedValueCents,
      input.contactInfo !== undefined ? input.contactInfo : current.contactInfo,
      input.notes !== undefined ? input.notes : current.notes,
      nowMs(),
      id,
    ],
  });
}
