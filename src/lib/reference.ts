import { getDb, newId, nowMs } from "./db";

export type ReferenceFact = {
  id: string;
  scope: string;
  label: string;
  value: string;
  category: string | null;
  createdAt: number;
  updatedAt: number;
};

export type ReferenceLink = {
  id: string;
  scope: string;
  label: string;
  url: string;
  category: string | null;
  createdAt: number;
  updatedAt: number;
};

function rowToFact(row: Record<string, unknown>): ReferenceFact {
  return {
    id: String(row.id),
    scope: String(row.scope),
    label: String(row.label),
    value: String(row.value),
    category: row.category == null ? null : String(row.category),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

function rowToLink(row: Record<string, unknown>): ReferenceLink {
  return {
    id: String(row.id),
    scope: String(row.scope),
    label: String(row.label),
    url: String(row.url),
    category: row.category == null ? null : String(row.category),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export async function listFacts(scope: string): Promise<ReferenceFact[]> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT * FROM reference_facts WHERE scope = ? ORDER BY category, label, updated_at DESC",
    args: [scope],
  });
  return res.rows.map((r) => rowToFact(r as Record<string, unknown>));
}

export async function listGlobalFacts(): Promise<ReferenceFact[]> {
  return listFacts("global");
}

export async function listLinks(scope: string): Promise<ReferenceLink[]> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT * FROM reference_links WHERE scope = ? ORDER BY category, label, updated_at DESC",
    args: [scope],
  });
  return res.rows.map((r) => rowToLink(r as Record<string, unknown>));
}

export async function createFact(input: {
  scope: string;
  label: string;
  value: string;
  category?: string;
}): Promise<void> {
  const db = await getDb();
  const now = nowMs();
  await db.execute({
    sql: "INSERT INTO reference_facts (id, scope, label, value, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [newId(), input.scope, input.label, input.value, input.category ?? null, now, now],
  });
}

export async function updateFact(id: string, label: string, value: string, category?: string): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE reference_facts SET label = ?, value = ?, category = ?, updated_at = ? WHERE id = ?",
    args: [label, value, category ?? null, nowMs(), id],
  });
}

export async function deleteFact(id: string): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM reference_facts WHERE id = ?", args: [id] });
}

export async function createLink(input: {
  scope: string;
  label: string;
  url: string;
  category?: string;
}): Promise<void> {
  const db = await getDb();
  const now = nowMs();
  await db.execute({
    sql: "INSERT INTO reference_links (id, scope, label, url, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [newId(), input.scope, input.label, input.url, input.category ?? null, now, now],
  });
}

export async function updateLink(id: string, label: string, url: string, category?: string): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE reference_links SET label = ?, url = ?, category = ?, updated_at = ? WHERE id = ?",
    args: [label, url, category ?? null, nowMs(), id],
  });
}

export async function deleteLink(id: string): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM reference_links WHERE id = ?", args: [id] });
}
