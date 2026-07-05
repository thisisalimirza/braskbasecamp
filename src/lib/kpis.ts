import { getDb, newId, nowMs } from "./db";

export type KpiDefinition = {
  id: string;
  ventureId: string;
  name: string;
  unit: string | null;
  sortOrder: number;
  createdAt: number;
};

export type KpiEntry = {
  id: string;
  kpiDefinitionId: string;
  value: number;
  recordedOn: number;
  createdAt: number;
};

function rowToDef(row: Record<string, unknown>): KpiDefinition {
  return {
    id: String(row.id),
    ventureId: String(row.venture_id),
    name: String(row.name),
    unit: row.unit == null ? null : String(row.unit),
    sortOrder: Number(row.sort_order),
    createdAt: Number(row.created_at),
  };
}

function rowToEntry(row: Record<string, unknown>): KpiEntry {
  return {
    id: String(row.id),
    kpiDefinitionId: String(row.kpi_definition_id),
    value: Number(row.value),
    recordedOn: Number(row.recorded_on),
    createdAt: Number(row.created_at),
  };
}

export async function listKpiDefinitions(ventureId: string): Promise<KpiDefinition[]> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT * FROM kpi_definitions WHERE venture_id = ? ORDER BY sort_order, name",
    args: [ventureId],
  });
  return res.rows.map((r) => rowToDef(r as Record<string, unknown>));
}

export async function createKpiDefinition(input: {
  ventureId: string;
  name: string;
  unit?: string;
  sortOrder?: number;
}): Promise<KpiDefinition> {
  const db = await getDb();
  const id = newId();
  const now = nowMs();
  await db.execute({
    sql: "INSERT INTO kpi_definitions (id, venture_id, name, unit, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [id, input.ventureId, input.name, input.unit ?? null, input.sortOrder ?? 0, now],
  });
  const defs = await listKpiDefinitions(input.ventureId);
  const def = defs.find((d) => d.id === id);
  if (!def) throw new Error("Failed to create KPI");
  return def;
}

export async function deleteKpiDefinition(id: string): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM kpi_entries WHERE kpi_definition_id = ?", args: [id] });
  await db.execute({ sql: "DELETE FROM kpi_definitions WHERE id = ?", args: [id] });
}

export async function getLatestKpiEntry(definitionId: string): Promise<KpiEntry | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT * FROM kpi_entries WHERE kpi_definition_id = ? ORDER BY recorded_on DESC LIMIT 1",
    args: [definitionId],
  });
  if (res.rows.length === 0) return null;
  return rowToEntry(res.rows[0] as Record<string, unknown>);
}

export async function listKpiEntries(definitionId: string, limit = 12): Promise<KpiEntry[]> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT * FROM kpi_entries WHERE kpi_definition_id = ? ORDER BY recorded_on DESC LIMIT ?",
    args: [definitionId, limit],
  });
  return res.rows.map((r) => rowToEntry(r as Record<string, unknown>)).reverse();
}

export async function createKpiEntry(input: {
  kpiDefinitionId: string;
  value: number;
  recordedOn: number;
}): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO kpi_entries (id, kpi_definition_id, value, recorded_on, created_at) VALUES (?, ?, ?, ?, ?)",
    args: [newId(), input.kpiDefinitionId, input.value, input.recordedOn, nowMs()],
  });
}

export type KpiWithLatest = KpiDefinition & {
  latestValue: number | null;
  lastRecordedAt: number | null;
  history: number[];
};

export async function getKpisWithLatest(ventureId: string): Promise<KpiWithLatest[]> {
  const defs = await listKpiDefinitions(ventureId);
  const result: KpiWithLatest[] = [];
  for (const def of defs) {
    const latest = await getLatestKpiEntry(def.id);
    const history = await listKpiEntries(def.id, 8);
    result.push({
      ...def,
      latestValue: latest?.value ?? null,
      lastRecordedAt: latest?.recordedOn ?? null,
      history: history.map((e) => e.value),
    });
  }
  return result;
}
