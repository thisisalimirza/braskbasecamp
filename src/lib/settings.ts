import { getDb, nowMs } from "./db";
import { requireUserId } from "./current-user";

export type AppSettings = {
  hardWipLimits: boolean;
};

const HARD_WIP_KEY = "hard_wip_limits";

export async function getAppSettings(): Promise<AppSettings> {
  const userId = await requireUserId();
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT value FROM user_settings WHERE user_id = ? AND key = ?",
    args: [userId, HARD_WIP_KEY],
  });
  const hardWipLimits =
    res.rows.length > 0 && String((res.rows[0] as Record<string, unknown>).value) === "1";
  return { hardWipLimits };
}

export async function getHardWipLimitsEnabled(): Promise<boolean> {
  const s = await getAppSettings();
  return s.hardWipLimits;
}

export async function setHardWipLimits(enabled: boolean): Promise<void> {
  const userId = await requireUserId();
  const db = await getDb();
  const ts = nowMs();
  await db.execute({
    sql: `INSERT INTO user_settings (user_id, key, value, updated_at) VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [userId, HARD_WIP_KEY, enabled ? "1" : "0", ts],
  });
}
