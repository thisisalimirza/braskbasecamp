export type BlockerStatus = "open" | "resolved";

export type VentureBlocker = {
  id: string;
  ventureId: string;
  body: string;
  status: BlockerStatus;
  isPrimary: boolean;
  sourceCheckinId: string | null;
  createdAt: number;
  resolvedAt: number | null;
  sortOrder: number;
};

export function rowToBlocker(row: Record<string, unknown>): VentureBlocker {
  return {
    id: String(row.id),
    ventureId: String(row.venture_id),
    body: String(row.body),
    status: String(row.status) as BlockerStatus,
    isPrimary: Number(row.is_primary) === 1,
    sourceCheckinId: row.source_checkin_id == null ? null : String(row.source_checkin_id),
    createdAt: Number(row.created_at),
    resolvedAt: row.resolved_at == null ? null : Number(row.resolved_at),
    sortOrder: Number(row.sort_order),
  };
}
