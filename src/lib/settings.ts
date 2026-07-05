import { getDb, nowMs } from "./db";

export type AppSettings = {
  hardWipLimits: boolean;
};

const HARD_WIP_KEY = "hard_wip_limits";

export async function getAppSettings(): Promise<AppSettings> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT value FROM app_settings WHERE key = ?",
    args: [HARD_WIP_KEY],
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
  const db = await getDb();
  const ts = nowMs();
  await db.execute({
    sql: `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [HARD_WIP_KEY, enabled ? "1" : "0", ts],
  });
}
