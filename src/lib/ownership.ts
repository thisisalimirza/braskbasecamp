import type { Client } from "@libsql/client";

/**
 * SQL fragment restricting a venture_id column to ventures owned by a user.
 * Consumes one `?` arg (the user id).
 */
export const OWNED_VENTURES = "(SELECT id FROM ventures WHERE user_id = ?)";

/**
 * SQL fragment restricting a kpi_definition_id column to definitions whose
 * venture is owned by a user. Consumes one `?` arg (the user id).
 */
export const OWNED_KPI_DEFINITIONS = `(SELECT kd.id FROM kpi_definitions kd
  JOIN ventures v ON v.id = kd.venture_id WHERE v.user_id = ?)`;

export async function assertVentureOwned(db: Client, ventureId: string, userId: string): Promise<void> {
  const res = await db.execute({
    sql: "SELECT 1 FROM ventures WHERE id = ? AND user_id = ?",
    args: [ventureId, userId],
  });
  if (res.rows.length === 0) throw new Error("Venture not found");
}
