import { getDb, newId, nowMs } from "./db";
import { startOfMonthMs, startOfPrevMonthMs, endOfMonthMs } from "./format";

export type PnlEntryType = "revenue" | "cost" | "owner_transaction";
export type OwnerDirection = "contribution" | "draw";

export type PnlEntry = {
  id: string;
  ventureId: string | null;
  entryType: PnlEntryType;
  direction: OwnerDirection | null;
  category: string;
  amountCents: number;
  occurredOn: number;
  isRecurring: boolean;
  paymentSource: string | null;
  clientId: string | null;
  notes: string | null;
  source: string;
  createdAt: number;
  updatedAt: number;
  ventureName?: string;
  clientName?: string;
};

function rowToPnl(row: Record<string, unknown>): PnlEntry {
  return {
    id: String(row.id),
    ventureId: row.venture_id == null ? null : String(row.venture_id),
    entryType: String(row.entry_type) as PnlEntryType,
    direction: row.direction == null ? null : (String(row.direction) as OwnerDirection),
    category: String(row.category),
    amountCents: Number(row.amount_cents),
    occurredOn: Number(row.occurred_on),
    isRecurring: Number(row.is_recurring) === 1,
    paymentSource: row.payment_source == null ? null : String(row.payment_source),
    clientId: row.client_id == null ? null : String(row.client_id),
    notes: row.notes == null ? null : String(row.notes),
    source: String(row.source ?? "manual"),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    ventureName: row.venture_name == null ? undefined : String(row.venture_name),
    clientName: row.client_name == null ? undefined : String(row.client_name),
  };
}

export async function netCents(filter: {
  ventureId?: string | null;
  from?: number;
  to?: number;
  companyWideOnly?: boolean;
}): Promise<number> {
  const db = await getDb();
  const conditions = ["entry_type IN ('revenue', 'cost')"];
  const args: (string | number)[] = [];

  if (filter.companyWideOnly) {
    conditions.push("venture_id IS NULL");
  } else if (filter.ventureId !== undefined) {
    if (filter.ventureId === null) {
      conditions.push("venture_id IS NULL");
    } else {
      conditions.push("venture_id = ?");
      args.push(filter.ventureId);
    }
  }

  if (filter.from != null) {
    conditions.push("occurred_on >= ?");
    args.push(filter.from);
  }
  if (filter.to != null) {
    conditions.push("occurred_on <= ?");
    args.push(filter.to);
  }

  const res = await db.execute({
    sql: `SELECT
      COALESCE(SUM(CASE WHEN entry_type = 'revenue' THEN amount_cents ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN entry_type = 'cost' THEN amount_cents ELSE 0 END), 0) AS net
    FROM pnl_entries WHERE ${conditions.join(" AND ")}`,
    args,
  });
  return Number(res.rows[0].net);
}

export async function monthlyTrend(
  ventureId?: string | null,
  months = 6
): Promise<{ month: string; netCents: number }[]> {
  const results: { month: string; netCents: number }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const from = d.getTime();
    const to = endOfMonthMs(d);
    // null/undefined = entire portfolio (all ventures). String id = that venture only.
    const net =
      ventureId != null
        ? await netCents({ ventureId, from, to })
        : await netCents({ from, to });
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    results.push({ month: label, netCents: net });
  }
  return results;
}

export type VentureRanking = {
  id: string;
  name: string;
  slug: string;
  netCents: number;
};

export async function ventureRanking(startOfMonth: number): Promise<VentureRanking[]> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT v.id, v.name, v.slug,
      COALESCE(SUM(CASE WHEN p.entry_type = 'revenue' THEN p.amount_cents ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN p.entry_type = 'cost' THEN p.amount_cents ELSE 0 END), 0) AS net_cents
    FROM ventures v
    LEFT JOIN pnl_entries p ON p.venture_id = v.id AND p.occurred_on >= ?
    WHERE v.status = 'active'
    GROUP BY v.id
    ORDER BY net_cents DESC`,
    args: [startOfMonth],
  });
  return res.rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    slug: String(r.slug),
    netCents: Number(r.net_cents),
  }));
}

export async function ownerEquityCents(): Promise<number> {
  const db = await getDb();
  const res = await db.execute(`
    SELECT
      COALESCE(SUM(CASE WHEN direction = 'contribution' THEN amount_cents ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN direction = 'draw' THEN amount_cents ELSE 0 END), 0) AS equity
    FROM pnl_entries WHERE entry_type = 'owner_transaction'
  `);
  return Number(res.rows[0].equity);
}

export async function listPnlEntries(filter: {
  ventureId?: string | null;
  limit?: number;
}): Promise<PnlEntry[]> {
  const db = await getDb();
  const conditions: string[] = ["p.entry_type IN ('revenue', 'cost')"];
  const args: (string | number)[] = [];

  if (filter.ventureId !== undefined) {
    if (filter.ventureId === null) {
      conditions.push("p.venture_id IS NULL");
    } else {
      conditions.push("p.venture_id = ?");
      args.push(filter.ventureId);
    }
  }

  const limit = filter.limit ?? 50;
  const res = await db.execute({
    sql: `SELECT p.*, v.name AS venture_name, c.name AS client_name
    FROM pnl_entries p
    LEFT JOIN ventures v ON v.id = p.venture_id
    LEFT JOIN clients c ON c.id = p.client_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY p.occurred_on DESC, p.created_at DESC
    LIMIT ?`,
    args: [...args, limit],
  });
  return res.rows.map((r) => rowToPnl(r as Record<string, unknown>));
}

export async function getPnlEntry(id: string): Promise<PnlEntry | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT p.*, v.name AS venture_name, c.name AS client_name
    FROM pnl_entries p
    LEFT JOIN ventures v ON v.id = p.venture_id
    LEFT JOIN clients c ON c.id = p.client_id
    WHERE p.id = ?`,
    args: [id],
  });
  if (res.rows.length === 0) return null;
  return rowToPnl(res.rows[0] as Record<string, unknown>);
}

export async function lastPnlEntryDate(ventureId: string): Promise<number | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT MAX(occurred_on) AS last_on FROM pnl_entries
    WHERE venture_id = ? AND entry_type IN ('revenue', 'cost')`,
    args: [ventureId],
  });
  const v = res.rows[0].last_on;
  return v == null ? null : Number(v);
}

export async function createPnlEntry(input: {
  ventureId: string | null;
  entryType: PnlEntryType;
  direction?: OwnerDirection | null;
  category: string;
  amountCents: number;
  occurredOn: number;
  clientId?: string | null;
  notes?: string | null;
  paymentSource?: string | null;
  isRecurring?: boolean;
}): Promise<PnlEntry> {
  if (input.amountCents <= 0) throw new Error("Amount must be positive");
  if (input.entryType === "owner_transaction" && !input.direction) {
    throw new Error("Owner transactions require direction");
  }
  if (input.entryType !== "owner_transaction" && input.direction) {
    throw new Error("Direction only for owner transactions");
  }

  const db = await getDb();
  const id = newId();
  const now = nowMs();
  await db.execute({
    sql: `INSERT INTO pnl_entries
      (id, venture_id, entry_type, direction, category, amount_cents, occurred_on,
       is_recurring, payment_source, client_id, notes, source, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?)`,
    args: [
      id,
      input.ventureId,
      input.entryType,
      input.direction ?? null,
      input.category,
      input.amountCents,
      input.occurredOn,
      input.isRecurring ? 1 : 0,
      input.paymentSource ?? null,
      input.clientId ?? null,
      input.notes ?? null,
      now,
      now,
    ],
  });
  const entry = await getPnlEntry(id);
  if (!entry) throw new Error("Failed to create entry");
  return entry;
}

export async function updatePnlEntry(
  id: string,
  input: Partial<{
    category: string;
    amountCents: number;
    occurredOn: number;
    notes: string | null;
  }>
): Promise<void> {
  const db = await getDb();
  const current = await getPnlEntry(id);
  if (!current) throw new Error("Entry not found");
  await db.execute({
    sql: `UPDATE pnl_entries SET category = ?, amount_cents = ?, occurred_on = ?, notes = ?, updated_at = ? WHERE id = ?`,
    args: [
      input.category ?? current.category,
      input.amountCents ?? current.amountCents,
      input.occurredOn ?? current.occurredOn,
      input.notes !== undefined ? input.notes : current.notes,
      nowMs(),
      id,
    ],
  });
}

export async function deletePnlEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM pnl_entries WHERE id = ?", args: [id] });
}

export async function companyNetThisMonth(): Promise<number> {
  return netCents({ from: startOfMonthMs() });
}

export async function companyNetLastMonth(): Promise<number> {
  const from = startOfPrevMonthMs();
  const to = startOfMonthMs() - 1;
  return netCents({ from, to });
}

export async function ventureNetThisMonth(ventureId: string): Promise<number> {
  return netCents({ ventureId, from: startOfMonthMs() });
}

export async function ventureNetLastMonth(ventureId: string): Promise<number> {
  const from = startOfPrevMonthMs();
  const to = startOfMonthMs() - 1;
  return netCents({ ventureId, from, to });
}

export async function ventureMonthBreakdown(
  ventureId: string
): Promise<{ revenueCents: number; costCents: number; netCents: number }> {
  const db = await getDb();
  const from = startOfMonthMs();
  const res = await db.execute({
    sql: `SELECT
      COALESCE(SUM(CASE WHEN entry_type = 'revenue' THEN amount_cents ELSE 0 END), 0) AS revenue,
      COALESCE(SUM(CASE WHEN entry_type = 'cost' THEN amount_cents ELSE 0 END), 0) AS cost
    FROM pnl_entries
    WHERE venture_id = ? AND occurred_on >= ? AND entry_type IN ('revenue', 'cost')`,
    args: [ventureId, from],
  });
  const revenueCents = Number(res.rows[0].revenue);
  const costCents = Number(res.rows[0].cost);
  return { revenueCents, costCents, netCents: revenueCents - costCents };
}
